package com.roomplanner.backend.auth.model;

import java.time.Instant;

public record AuthTokenRecord(
    String tokenHash,
    String userId,
    Instant issuedAt,
    Instant expiresAt
) {
}
