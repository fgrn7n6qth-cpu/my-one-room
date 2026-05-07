package com.roomplanner.backend.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AuthTokenServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void issuedTokenSurvivesServiceReload() {
        Path tokensFile = tempDir.resolve("tokens.json");
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        AuthTokenService tokenService = new AuthTokenService(tokensFile.toString(), Duration.ofHours(4), objectMapper);
        tokenService.init();

        String token = tokenService.issueToken("user-1");

        AuthTokenService reloadedTokenService = new AuthTokenService(tokensFile.toString(), Duration.ofHours(4), objectMapper);
        reloadedTokenService.init();

        assertEquals("user-1", reloadedTokenService.resolveUserId(token));
    }

    @Test
    void expiredTokensAreNotResolved() throws InterruptedException {
        Path tokensFile = tempDir.resolve("tokens-expiring.json");
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        AuthTokenService tokenService = new AuthTokenService(tokensFile.toString(), Duration.ofMillis(5), objectMapper);
        tokenService.init();

        String token = tokenService.issueToken("user-2");
        Thread.sleep(15);

        assertNull(tokenService.resolveUserId(token));
    }
}
