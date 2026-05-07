package com.roomplanner.backend.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PendingEmailVerification(
    String email,
    String purpose,
    String code,
    Instant requestedAt,
    Instant expiresAt
) {
}
