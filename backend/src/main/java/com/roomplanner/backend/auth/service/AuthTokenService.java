package com.roomplanner.backend.auth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomplanner.backend.auth.model.AuthTokenRecord;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthTokenService {

    private static final TypeReference<List<AuthTokenRecord>> TOKEN_LIST_TYPE = new TypeReference<>() {};

    private final Path tokensFilePath;
    private final Duration tokenTtl;
    private final ObjectMapper objectMapper;
    private final Map<String, AuthTokenRecord> tokensByHash = new HashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public AuthTokenService(
        @Value("${app.auth.tokens-file}") String tokensFile,
        @Value("${app.auth.token-ttl}") Duration tokenTtl,
        ObjectMapper objectMapper
    ) {
        this.tokensFilePath = Path.of(tokensFile).toAbsolutePath().normalize();
        this.tokenTtl = tokenTtl;
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    @PostConstruct
    void init() {
        loadTokens();
    }

    public String issueToken(String userId) {
        lock.writeLock().lock();
        try {
            cleanupExpiredTokensInMemory();
            revokeByUserIdInternal(userId);

            var token = UUID.randomUUID() + "." + UUID.randomUUID();
            var now = Instant.now();
            var record = new AuthTokenRecord(
                hashToken(token),
                userId,
                now,
                now.plus(tokenTtl)
            );
            tokensByHash.put(record.tokenHash(), record);
            saveTokens();
            return token;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public String resolveUserId(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        lock.writeLock().lock();
        try {
            cleanupExpiredTokensInMemory();
            var record = tokensByHash.get(hashToken(token));
            if (record == null) {
                return null;
            }
            if (record.expiresAt().isBefore(Instant.now())) {
                tokensByHash.remove(record.tokenHash());
                saveTokens();
                return null;
            }
            return record.userId();
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void revokeByUserId(String userId) {
        lock.writeLock().lock();
        try {
            if (revokeByUserIdInternal(userId)) {
                saveTokens();
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

    private boolean revokeByUserIdInternal(String userId) {
        return tokensByHash.entrySet().removeIf((entry) -> userId.equals(entry.getValue().userId()));
    }

    private void loadTokens() {
        lock.writeLock().lock();
        try {
            tokensByHash.clear();

            if (!Files.exists(tokensFilePath)) {
                Files.createDirectories(tokensFilePath.getParent());
                return;
            }

            List<AuthTokenRecord> tokens = objectMapper.readValue(tokensFilePath.toFile(), TOKEN_LIST_TYPE);
            for (var token : tokens) {
                if (token.expiresAt() != null && token.expiresAt().isAfter(Instant.now())) {
                    tokensByHash.put(token.tokenHash(), token);
                }
            }
            saveTokens();
        } catch (IOException exception) {
            throw new IllegalStateException("토큰 저장소를 불러오지 못했습니다.", exception);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void saveTokens() {
        try {
            Files.createDirectories(tokensFilePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tokensFilePath.toFile(), new ArrayList<>(tokensByHash.values()));
        } catch (IOException exception) {
            throw new IllegalStateException("토큰 저장소를 저장하지 못했습니다.", exception);
        }
    }

    private void cleanupExpiredTokensInMemory() {
        tokensByHash.entrySet().removeIf((entry) -> entry.getValue().expiresAt().isBefore(Instant.now()));
    }

    private String hashToken(String token) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            var bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 해시를 초기화하지 못했습니다.", exception);
        }
    }
}
