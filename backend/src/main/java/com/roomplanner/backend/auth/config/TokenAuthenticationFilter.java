package com.roomplanner.backend.auth.config;

import com.roomplanner.backend.auth.UserPrincipal;
import com.roomplanner.backend.auth.service.AuthTokenService;
import com.roomplanner.backend.auth.service.UserAccountService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final AuthTokenService authTokenService;
    private final UserAccountService userAccountService;

    public TokenAuthenticationFilter(AuthTokenService authTokenService, UserAccountService userAccountService) {
        this.authTokenService = authTokenService;
        this.userAccountService = userAccountService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        var header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            var token = header.substring(7).trim();
            var userId = authTokenService.resolveUserId(token);
            if (userId != null) {
                var user = userAccountService.getById(userId);
                var principal = new UserPrincipal(user.id(), user.email());
                var authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    token,
                    AuthorityUtils.NO_AUTHORITIES
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
