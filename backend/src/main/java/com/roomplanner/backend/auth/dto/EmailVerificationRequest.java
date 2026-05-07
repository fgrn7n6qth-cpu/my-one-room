package com.roomplanner.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailVerificationRequest(
    @Email(message = "올바른 이메일을 입력해 주세요.")
    @NotBlank(message = "이메일을 입력해 주세요.")
    String email
) {
}
