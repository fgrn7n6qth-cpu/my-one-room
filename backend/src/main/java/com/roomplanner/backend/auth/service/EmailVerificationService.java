package com.roomplanner.backend.auth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomplanner.backend.auth.model.PendingEmailVerification;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final TypeReference<List<PendingEmailVerification>> VERIFICATION_LIST_TYPE = new TypeReference<>() {};
    private static final String PURPOSE_SIGNUP = "signup";
    private static final String PURPOSE_PASSWORD_RESET = "password-reset";

    private final Path verificationsFilePath;
    private final ObjectMapper objectMapper;
    private final Duration verificationTtl;
    private final Duration resendCooldown;
    private final String fromAddress;
    private final String username;
    private final JavaMailSender mailSender;
    private final Map<String, PendingEmailVerification> verificationsByKey = new HashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public EmailVerificationService(
        @Value("${app.auth.email-verifications-file}") String verificationsFile,
        @Value("${app.auth.email-verification-ttl}") Duration verificationTtl,
        @Value("${app.auth.email-verification-resend-cooldown}") Duration resendCooldown,
        @Value("${app.auth.mail.from}") String fromAddress,
        @Value("${spring.mail.username:}") String username,
        ObjectMapper objectMapper,
        ObjectProvider<JavaMailSender> mailSenderProvider
    ) {
        this.verificationsFilePath = Path.of(verificationsFile).toAbsolutePath().normalize();
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
        this.verificationTtl = verificationTtl;
        this.resendCooldown = resendCooldown;
        this.fromAddress = fromAddress == null ? "" : fromAddress.trim();
        this.username = username == null ? "" : username.trim();
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @PostConstruct
    void init() {
        loadVerifications();
    }

    public void sendSignupCode(String email) {
        sendCode(email, PURPOSE_SIGNUP);
    }

    public void sendPasswordResetCode(String email) {
        sendCode(email, PURPOSE_PASSWORD_RESET);
    }

    public void verifySignupCode(String email, String code) {
        verifyCode(email, code, PURPOSE_SIGNUP);
    }

    public void verifyPasswordResetCode(String email, String code) {
        verifyCode(email, code, PURPOSE_PASSWORD_RESET);
    }

    private void sendCode(String email, String purpose) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일을 입력해 주세요.");
        }

        ensureMailReady();

        String verificationKey = buildVerificationKey(normalizedEmail, purpose);
        String code = generateCode();
        Instant now = Instant.now();

        lock.writeLock().lock();
        try {
            removeExpiredEntries(now);

            PendingEmailVerification existing = verificationsByKey.get(verificationKey);
            if (existing != null && existing.requestedAt() != null) {
                Instant nextAllowedAt = existing.requestedAt().plus(resendCooldown);
                if (nextAllowedAt.isAfter(now)) {
                    long remainingSeconds = Math.max(1L, Duration.between(now, nextAllowedAt).toSeconds());
                    throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "인증 코드는 " + remainingSeconds + "초 후에 다시 보낼 수 있습니다."
                    );
                }
            }

            verificationsByKey.put(verificationKey, new PendingEmailVerification(
                normalizedEmail,
                purpose,
                code,
                now,
                now.plus(verificationTtl)
            ));
            saveVerifications();
        } finally {
            lock.writeLock().unlock();
        }

        sendVerificationMail(normalizedEmail, code, verificationTtl, purpose);
    }

    private void verifyCode(String email, String code, String purpose) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedCode = code == null ? "" : code.trim();
        String verificationKey = buildVerificationKey(normalizedEmail, purpose);

        lock.writeLock().lock();
        try {
            removeExpiredEntries(Instant.now());
            PendingEmailVerification pending = verificationsByKey.get(verificationKey);
            if (pending == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 코드를 먼저 발송해 주세요.");
            }
            if (!pending.code().equals(normalizedCode)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 코드가 올바르지 않습니다.");
            }

            verificationsByKey.remove(verificationKey);
            saveVerifications();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void ensureMailReady() {
        if (mailSender == null || fromAddress.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "메일 발송 설정이 완료되지 않았습니다. SMTP 환경변수를 먼저 설정해 주세요."
            );
        }
        if (!username.isBlank() && !isCompatibleSender(username, fromAddress)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "APP_MAIL_FROM과 SPRING_MAIL_USERNAME 조합을 다시 확인해 주세요."
            );
        }
    }

    private boolean isCompatibleSender(String username, String fromAddress) {
        String normalizedUsername = username.trim().toLowerCase(Locale.ROOT);
        String normalizedFrom = fromAddress.trim().toLowerCase(Locale.ROOT);

        if (normalizedUsername.equals(normalizedFrom)) {
            return true;
        }

        int atIndex = normalizedFrom.indexOf('@');
        if (atIndex <= 0) {
            return false;
        }

        String localPart = normalizedFrom.substring(0, atIndex);
        return normalizedUsername.equals(localPart);
    }

    private void sendVerificationMail(String to, String code, Duration ttl, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(buildMailSubject(purpose));
            helper.setText(buildMailBody(code, ttl, purpose), false);
            mailSender.send(message);
        } catch (MailAuthenticationException exception) {
            log.warn("SMTP authentication failed for mail username={}", username, exception);
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "메일 서버 로그인에 실패했습니다. SMTP 계정과 앱 비밀번호를 다시 확인해 주세요."
            );
        } catch (MailSendException exception) {
            log.warn("SMTP send failed for from={} to={}", fromAddress, to, exception);
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "인증 메일 발송이 거절되었습니다. 수신 주소와 메일 서버 설정을 확인해 주세요."
            );
        } catch (MailException | MessagingException exception) {
            log.warn("SMTP mail failed for from={} to={}", fromAddress, to, exception);
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "인증 메일을 보내지 못했습니다. 백엔드 로그와 SMTP 오류를 확인해 주세요."
            );
        }
    }

    private String buildMailSubject(String purpose) {
        return switch (purpose) {
            case PURPOSE_PASSWORD_RESET -> "[My One Room] 비밀번호 재설정 인증 코드 안내";
            default -> "[My One Room] 회원가입 인증 코드 안내";
        };
    }

    private String buildMailBody(String code, Duration ttl, String purpose) {
        long ttlMinutes = Math.max(1L, ttl.toMinutes());
        String intro = PURPOSE_PASSWORD_RESET.equals(purpose)
            ? "비밀번호 재설정을 위한 이메일 인증 코드를 보내드립니다."
            : "회원가입을 위한 이메일 인증 코드를 보내드립니다.";

        return """
            안녕하세요. My One Room 입니다.

            %s

            인증 코드: %s

            이 코드는 %d분 동안만 유효합니다.
            본인이 요청하지 않았다면 이 메일을 무시해 주세요.

            감사합니다.
            My One Room
            """.formatted(intro, code, ttlMinutes);
    }

    private String generateCode() {
        return "%06d".formatted(ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }

    private void loadVerifications() {
        lock.writeLock().lock();
        try {
            verificationsByKey.clear();
            if (!Files.exists(verificationsFilePath)) {
                Files.createDirectories(verificationsFilePath.getParent());
                return;
            }

            List<PendingEmailVerification> entries = objectMapper.readValue(verificationsFilePath.toFile(), VERIFICATION_LIST_TYPE);
            Instant now = Instant.now();
            for (PendingEmailVerification entry : entries) {
                PendingEmailVerification normalized = normalizePending(entry);
                if (normalized.email() == null || normalized.email().isBlank()) {
                    continue;
                }
                if (normalized.expiresAt() != null && normalized.expiresAt().isAfter(now)) {
                    verificationsByKey.put(buildVerificationKey(normalized.email(), normalized.purpose()), normalized);
                }
            }
            saveVerifications();
        } catch (IOException exception) {
            throw new IllegalStateException("이메일 인증 정보를 불러오지 못했습니다.", exception);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void saveVerifications() {
        try {
            Files.createDirectories(verificationsFilePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(
                verificationsFilePath.toFile(),
                new ArrayList<>(verificationsByKey.values())
            );
        } catch (IOException exception) {
            throw new IllegalStateException("이메일 인증 정보를 저장하지 못했습니다.", exception);
        }
    }

    private void removeExpiredEntries(Instant now) {
        verificationsByKey.entrySet().removeIf((entry) -> {
            Instant expiresAt = entry.getValue().expiresAt();
            return expiresAt == null || !expiresAt.isAfter(now);
        });
    }

    private PendingEmailVerification normalizePending(PendingEmailVerification pending) {
        String normalizedEmail = normalizeEmail(pending.email());
        String normalizedPurpose = normalizePurpose(pending.purpose());
        return new PendingEmailVerification(
            normalizedEmail,
            normalizedPurpose,
            pending.code(),
            pending.requestedAt() != null ? pending.requestedAt() : Instant.now(),
            pending.expiresAt()
        );
    }

    private String buildVerificationKey(String email, String purpose) {
        return normalizePurpose(purpose) + ":" + normalizeEmail(email);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePurpose(String purpose) {
        return purpose == null || purpose.isBlank() ? PURPOSE_SIGNUP : purpose.trim().toLowerCase(Locale.ROOT);
    }
}
