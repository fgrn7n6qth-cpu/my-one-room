package com.roomplanner.backend.auth.model;

import java.time.Instant;

public record UserAccount(
    String id,
    String name,
    String email,
    String passwordHash,
    String authProvider,
    String providerUserId,
    String phone,
    String address,
    Instant createdAt,
    boolean emailVerified,
    Instant emailVerifiedAt
) {
}
