package com.roomplanner.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "이름을 입력해 주세요.")
    @Size(max = 40, message = "이름은 40자 이하로 입력해 주세요.")
    String name,

    @NotBlank(message = "전화번호를 입력해 주세요.")
    @Pattern(regexp = "^[0-9\\-\\s]{9,20}$", message = "전화번호 형식이 올바르지 않습니다.")
    String phone,

    @NotBlank(message = "주소를 입력해 주세요.")
    @Size(min = 5, max = 180, message = "주소는 5자 이상 180자 이하로 입력해 주세요.")
    String address
) {
}
