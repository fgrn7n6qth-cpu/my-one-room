package com.roomplanner.backend.auth.service;

import java.util.Map;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public record SocialOAuth2UserInfo(
    String provider,
    String providerUserId,
    String email,
    String name
) {

    public static SocialOAuth2UserInfo from(String provider, Map<String, Object> attributes) {
        return switch (provider) {
            case "google" -> fromGoogle(attributes);
            case "kakao" -> fromKakao(attributes);
            case "naver" -> fromNaver(attributes);
            default -> throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"), "지원하지 않는 소셜 로그인입니다.");
        };
    }

    private static SocialOAuth2UserInfo fromGoogle(Map<String, Object> attributes) {
        return new SocialOAuth2UserInfo(
            "google",
            stringValue(attributes.get("sub")),
            stringValue(attributes.get("email")),
            fallbackName(stringValue(attributes.get("name")), stringValue(attributes.get("email")), "Google 사용자")
        );
    }

    @SuppressWarnings("unchecked")
    private static SocialOAuth2UserInfo fromKakao(Map<String, Object> attributes) {
        var account = (Map<String, Object>) attributes.getOrDefault("kakao_account", Map.of());
        var profile = (Map<String, Object>) account.getOrDefault("profile", Map.of());
        var properties = (Map<String, Object>) attributes.getOrDefault("properties", Map.of());
        var nickname = firstNonBlank(
            stringValue(profile.get("nickname")),
            stringValue(properties.get("nickname"))
        );
        return new SocialOAuth2UserInfo(
            "kakao",
            stringValue(attributes.get("id")),
            stringValue(account.get("email")),
            fallbackName(nickname, stringValue(account.get("email")), "Kakao 사용자")
        );
    }

    @SuppressWarnings("unchecked")
    private static SocialOAuth2UserInfo fromNaver(Map<String, Object> attributes) {
        var response = (Map<String, Object>) attributes.getOrDefault("response", Map.of());
        return new SocialOAuth2UserInfo(
            "naver",
            stringValue(response.get("id")),
            stringValue(response.get("email")),
            fallbackName(firstNonBlank(stringValue(response.get("name")), stringValue(response.get("nickname"))), stringValue(response.get("email")), "Naver 사용자")
        );
    }

    private static String fallbackName(String name, String email, String fallback) {
        return firstNonBlank(name, email != null ? email.split("@")[0] : null, fallback);
    }

    private static String firstNonBlank(String... values) {
        for (var value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
