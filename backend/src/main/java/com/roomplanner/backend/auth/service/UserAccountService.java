package com.roomplanner.backend.auth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomplanner.backend.auth.model.UserAccount;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserAccountService {

    private static final TypeReference<List<UserAccount>> USER_LIST_TYPE = new TypeReference<>() {};

    private final Path usersFilePath;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Map<String, UserAccount> usersById = new HashMap<>();
    private final Map<String, UserAccount> usersByEmail = new HashMap<>();
    private final Map<String, UserAccount> usersByProviderKey = new HashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public UserAccountService(@Value("${app.storage.users-file}") String usersFile, ObjectMapper objectMapper) {
        this.usersFilePath = Path.of(usersFile).toAbsolutePath().normalize();
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    @PostConstruct
    void init() {
        loadUsers();
    }

    public boolean isEmailAvailableForSignup(String email) {
        lock.readLock().lock();
        try {
            return !usersByEmail.containsKey(normalizeEmail(email));
        } finally {
            lock.readLock().unlock();
        }
    }

    public void ensureEmailAvailableForSignup(String email) {
        if (!isEmailAvailableForSignup(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다. 로그인해 주세요.");
        }
    }

    public void ensureLocalAccountCanResetPassword(String email) {
        lock.readLock().lock();
        try {
            UserAccount user = usersByEmail.get(normalizeEmail(email));
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "가입된 이메일을 찾을 수 없습니다.");
            }
            if (user.passwordHash() == null || user.passwordHash().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호 재설정이 가능한 일반 로그인 계정이 아닙니다.");
            }
        } finally {
            lock.readLock().unlock();
        }
    }

    public UserAccount register(String name, String email, String password, boolean emailVerified) {
        lock.writeLock().lock();
        try {
            String normalizedEmail = normalizeEmail(email);
            if (usersByEmail.containsKey(normalizedEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다. 로그인해 주세요.");
            }

            Instant now = Instant.now();
            UserAccount user = new UserAccount(
                UUID.randomUUID().toString(),
                resolveDisplayName(name, null, normalizedEmail),
                normalizedEmail,
                passwordEncoder.encode(password),
                "local",
                null,
                "",
                "",
                now,
                emailVerified,
                emailVerified ? now : null
            );
            usersById.put(user.id(), user);
            if (!user.email().isBlank()) {
                usersByEmail.put(user.email(), user);
            }
            indexProvider(user);
            saveUsers();
            return user;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void resetPassword(String email, String password) {
        lock.writeLock().lock();
        try {
            String normalizedEmail = normalizeEmail(email);
            UserAccount existingUser = usersByEmail.get(normalizedEmail);
            if (existingUser == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "가입된 이메일을 찾을 수 없습니다.");
            }
            if (existingUser.passwordHash() == null || existingUser.passwordHash().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호 재설정이 가능한 일반 로그인 계정이 아닙니다.");
            }

            UserAccount updatedUser = new UserAccount(
                existingUser.id(),
                existingUser.name(),
                existingUser.email(),
                passwordEncoder.encode(password),
                existingUser.authProvider(),
                existingUser.providerUserId(),
                existingUser.phone(),
                existingUser.address(),
                existingUser.createdAt(),
                existingUser.emailVerified(),
                existingUser.emailVerifiedAt()
            );
            replaceUser(existingUser, updatedUser);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public UserAccount upsertSocialUser(String provider, String providerUserId, String email, String name) {
        lock.writeLock().lock();
        try {
            String normalizedProvider = normalizeProvider(provider);
            String normalizedProviderUserId = providerUserId == null ? "" : providerUserId.trim();
            if (normalizedProvider.isBlank() || normalizedProviderUserId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "소셜 로그인 사용자 정보를 확인할 수 없습니다.");
            }

            String providerKey = buildProviderKey(normalizedProvider, normalizedProviderUserId);
            String normalizedEmail = normalizeEmail(email);
            UserAccount existingByProvider = usersByProviderKey.get(providerKey);
            if (existingByProvider != null) {
                UserAccount refreshed = new UserAccount(
                    existingByProvider.id(),
                    resolveDisplayName(name, existingByProvider.name(), normalizedEmail),
                    normalizedEmail.isBlank() ? existingByProvider.email() : normalizedEmail,
                    existingByProvider.passwordHash(),
                    normalizedProvider,
                    normalizedProviderUserId,
                    existingByProvider.phone(),
                    existingByProvider.address(),
                    existingByProvider.createdAt(),
                    true,
                    existingByProvider.emailVerifiedAt() != null ? existingByProvider.emailVerifiedAt() : Instant.now()
                );
                replaceUser(existingByProvider, refreshed);
                return refreshed;
            }

            UserAccount existingByEmail = normalizedEmail.isBlank() ? null : usersByEmail.get(normalizedEmail);
            if (existingByEmail != null) {
                UserAccount linked = new UserAccount(
                    existingByEmail.id(),
                    resolveDisplayName(name, existingByEmail.name(), normalizedEmail),
                    existingByEmail.email(),
                    existingByEmail.passwordHash(),
                    normalizedProvider,
                    normalizedProviderUserId,
                    existingByEmail.phone(),
                    existingByEmail.address(),
                    existingByEmail.createdAt(),
                    true,
                    existingByEmail.emailVerifiedAt() != null ? existingByEmail.emailVerifiedAt() : Instant.now()
                );
                replaceUser(existingByEmail, linked);
                return linked;
            }

            Instant now = Instant.now();
            UserAccount user = new UserAccount(
                UUID.randomUUID().toString(),
                resolveDisplayName(name, null, normalizedEmail),
                normalizedEmail,
                null,
                normalizedProvider,
                normalizedProviderUserId,
                "",
                "",
                now,
                true,
                now
            );
            usersById.put(user.id(), user);
            if (!user.email().isBlank()) {
                usersByEmail.put(user.email(), user);
            }
            indexProvider(user);
            saveUsers();
            return user;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public UserAccount updateProfile(String userId, String name, String phone, String address) {
        lock.writeLock().lock();
        try {
            UserAccount existingUser = usersById.get(userId);
            if (existingUser == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
            }

            UserAccount updatedUser = new UserAccount(
                existingUser.id(),
                name == null || name.isBlank() ? existingUser.name() : name.trim(),
                existingUser.email(),
                existingUser.passwordHash(),
                existingUser.authProvider(),
                existingUser.providerUserId(),
                normalizePhone(phone),
                normalizeText(address),
                existingUser.createdAt(),
                existingUser.emailVerified(),
                existingUser.emailVerifiedAt()
            );
            replaceUser(existingUser, updatedUser);
            return updatedUser;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public UserAccount authenticate(String email, String password) {
        lock.readLock().lock();
        try {
            UserAccount user = usersByEmail.get(normalizeEmail(email));
            if (user == null || user.passwordHash() == null || !passwordEncoder.matches(password, user.passwordHash())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
            }
            if ("local".equalsIgnoreCase(user.authProvider()) && !user.emailVerified()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이메일 인증이 완료되지 않은 계정입니다.");
            }
            return user;
        } finally {
            lock.readLock().unlock();
        }
    }

    public UserAccount getById(String userId) {
        lock.readLock().lock();
        try {
            UserAccount user = usersById.get(userId);
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
            }
            return user;
        } finally {
            lock.readLock().unlock();
        }
    }

    public void deleteById(String userId) {
        lock.writeLock().lock();
        try {
            UserAccount user = usersById.remove(userId);
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
            }
            if (user.email() != null && !user.email().isBlank()) {
                usersByEmail.remove(user.email());
            }
            usersByProviderKey.entrySet().removeIf((entry) -> user.id().equals(entry.getValue().id()));
            saveUsers();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void loadUsers() {
        lock.writeLock().lock();
        try {
            usersById.clear();
            usersByEmail.clear();
            usersByProviderKey.clear();

            if (!Files.exists(usersFilePath)) {
                Files.createDirectories(usersFilePath.getParent());
                return;
            }

            List<UserAccount> users = objectMapper.readValue(usersFilePath.toFile(), USER_LIST_TYPE);
            for (UserAccount rawUser : users) {
                UserAccount user = normalizeStoredUser(rawUser);
                usersById.put(user.id(), user);
                if (user.email() != null && !user.email().isBlank()) {
                    usersByEmail.put(user.email(), user);
                }
                indexProvider(user);
            }
            saveUsers();
        } catch (IOException exception) {
            throw new IllegalStateException("사용자 정보를 불러오지 못했습니다.", exception);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void saveUsers() {
        try {
            Files.createDirectories(usersFilePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(usersFilePath.toFile(), new ArrayList<>(usersById.values()));
        } catch (IOException exception) {
            throw new IllegalStateException("사용자 정보를 저장하지 못했습니다.", exception);
        }
    }

    private void replaceUser(UserAccount previous, UserAccount next) {
        usersById.put(next.id(), next);
        if (previous.email() != null && !previous.email().isBlank()) {
            usersByEmail.remove(previous.email());
        }
        usersByProviderKey.entrySet().removeIf((entry) -> previous.id().equals(entry.getValue().id()));
        if (next.email() != null && !next.email().isBlank()) {
            usersByEmail.put(next.email(), next);
        }
        indexProvider(next);
        saveUsers();
    }

    private void indexProvider(UserAccount user) {
        if (user.authProvider() == null || user.authProvider().isBlank() || user.providerUserId() == null || user.providerUserId().isBlank()) {
            return;
        }
        usersByProviderKey.put(buildProviderKey(user.authProvider(), user.providerUserId()), user);
    }

    private UserAccount normalizeStoredUser(UserAccount user) {
        boolean verified = user.emailVerified() || user.email() == null || user.email().isBlank() || user.createdAt() != null;
        Instant verifiedAt = verified ? (user.emailVerifiedAt() != null ? user.emailVerifiedAt() : user.createdAt()) : null;
        return new UserAccount(
            user.id(),
            user.name(),
            normalizeEmail(user.email()),
            user.passwordHash(),
            user.authProvider(),
            user.providerUserId(),
            normalizePhone(user.phone()),
            normalizeText(user.address()),
            user.createdAt() != null ? user.createdAt() : Instant.now(),
            verified,
            verifiedAt
        );
    }

    private String buildProviderKey(String provider, String providerUserId) {
        return provider + ":" + providerUserId;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeProvider(String provider) {
        return provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        return normalizeText(phone);
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String resolveDisplayName(String preferredName, String fallbackName, String email) {
        if (preferredName != null && !preferredName.isBlank()) {
            return preferredName.trim();
        }
        if (fallbackName != null && !fallbackName.isBlank()) {
            return fallbackName.trim();
        }
        if (email != null && !email.isBlank()) {
            return email.split("@")[0];
        }
        return "이름 없는 사용자";
    }
}
