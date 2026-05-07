package com.roomplanner.backend.auth;

import java.security.Principal;

public record UserPrincipal(String userId, String email) implements Principal {

    @Override
    public String getName() {
        return email;
    }
}
