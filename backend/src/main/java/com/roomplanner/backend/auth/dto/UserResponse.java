package com.roomplanner.backend.auth.dto;

import com.roomplanner.backend.auth.model.UserAccount;
import java.time.Instant;

public record UserResponse(
    String id,
    String name,
    String email,
    String authProvider,
    String phone,
    String address,
    boolean profileComplete,
    Instant createdAt,
    boolean emailVerified
) {

    public static UserResponse from(UserAccount user) {
        boolean profileComplete =
            user.name() != null && !user.name().isBlank() &&
            user.phone() != null && !user.phone().isBlank() &&
            user.address() != null && !user.address().isBlank();
        return new UserResponse(
            user.id(),
            user.name(),
            user.email(),
            user.authProvider(),
            user.phone(),
            user.address(),
            profileComplete,
            user.createdAt(),
            user.emailVerified()
        );
    }
}
