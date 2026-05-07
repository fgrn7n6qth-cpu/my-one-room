package com.roomplanner.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank(message = "이름을 입력해 주세요.")
    String name,

    @Email(message = "올바른 이메일을 입력해 주세요.")
    @NotBlank(message = "이메일을 입력해 주세요.")
    String email,

    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    String password,

    @NotBlank(message = "이메일 인증 코드를 입력해 주세요.")
    String verificationCode
) {
}
