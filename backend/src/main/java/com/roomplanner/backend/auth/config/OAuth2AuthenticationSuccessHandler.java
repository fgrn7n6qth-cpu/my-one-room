package com.roomplanner.backend.auth.config;

import com.roomplanner.backend.auth.service.AuthTokenService;
import com.roomplanner.backend.auth.service.SocialOAuth2UserInfo;
import com.roomplanner.backend.auth.service.UserAccountService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthTokenService authTokenService;
    private final UserAccountService userAccountService;
    private final String frontendBaseUrl;

    public OAuth2AuthenticationSuccessHandler(
        AuthTokenService authTokenService,
        UserAccountService userAccountService,
        @Value("${app.frontend.base-url}") String frontendBaseUrl
    ) {
        this.authTokenService = authTokenService;
        this.userAccountService = userAccountService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
        throws IOException, ServletException {
        try {
            var oauth = (OAuth2AuthenticationToken) authentication;
            var userInfo = SocialOAuth2UserInfo.from(oauth.getAuthorizedClientRegistrationId(), oauth.getPrincipal().getAttributes());
            var user = userAccountService.upsertSocialUser(userInfo.provider(), userInfo.providerUserId(), userInfo.email(), userInfo.name());
            var token = authTokenService.issueToken(user.id());
            getRedirectStrategy().sendRedirect(request, response, frontendBaseUrl + "/?authToken=" + encode(token) + "&authProvider=" + encode(userInfo.provider()));
        } catch (OAuth2AuthenticationException exception) {
            getRedirectStrategy().sendRedirect(request, response, frontendBaseUrl + "/?socialError=" + encode(exception.getError().getDescription()));
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
