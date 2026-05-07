package com.roomplanner.backend.auth.dto;

import com.roomplanner.backend.auth.model.UserAccount;

public record AuthResponse(String token, UserResponse user) {

    public static AuthResponse from(String token, UserAccount user) {
        return new AuthResponse(token, UserResponse.from(user));
    }
}
