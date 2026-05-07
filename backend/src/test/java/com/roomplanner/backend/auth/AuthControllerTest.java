package com.roomplanner.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "app.storage.users-file=./target/test-users.json",
    "app.auth.tokens-file=./target/test-tokens.json",
    "app.storage.workspaces-file=./target/test-workspaces.json",
    "app.auth.email-verifications-file=./target/test-email-verifications.json",
    "app.auth.email-verification-required=false",
    "app.auth.token-ttl=PT2H",
    "app.cors.allowed-origins=http://localhost:5173"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearUsersFile() throws Exception {
        Files.deleteIfExists(Path.of("./target/test-users.json"));
        Files.deleteIfExists(Path.of("./target/test-tokens.json"));
        Files.deleteIfExists(Path.of("./target/test-workspaces.json"));
        Files.deleteIfExists(Path.of("./target/test-email-verifications.json"));
    }

    @Test
    void signupReturnsTokenAndProfile() throws Exception {
        String email = "signup-" + UUID.randomUUID() + "@example.com";
        seedSignupCode(email);

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.user.name").value("Test User"))
            .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void loginThenFetchProfile() throws Exception {
        String email = "login-" + UUID.randomUUID() + "@example.com";
        seedSignupCode(email);

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Test User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated());

        var loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "email": "%s",
                      "password": "password1234"
                    }
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn()
            .getResponse()
            .getContentAsString();

        var token = loginResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.name").value("Test User"));
    }

    @Test
    void signupWithExistingEmailReturnsConflict() throws Exception {
        String email = "refresh-" + UUID.randomUUID() + "@example.com";
        seedSignupCode(email);

        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "First User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated());

        seedSignupCode(email);
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Updated User",
                      "email": "%s",
                      "password": "renewed5678",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isConflict());
    }

    @Test
    void deleteAccountInvalidatesProfileAccess() throws Exception {
        String email = "delete-" + UUID.randomUUID() + "@example.com";
        seedSignupCode(email);

        var signupResponse = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Delete User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        var token = signupResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(delete("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutInvalidatesProfileAccess() throws Exception {
        String email = "logout-" + UUID.randomUUID() + "@example.com";
        seedSignupCode(email);

        var signupResponse = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Logout User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        var token = signupResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isUnauthorized());
    }

    private void seedSignupCode(String email) throws Exception {
        Path verificationPath = Path.of("./target/test-email-verifications.json");
        Files.createDirectories(verificationPath.getParent());
        Instant now = Instant.now();
        Files.writeString(verificationPath, """
            [
              {
                "email": "%s",
                "purpose": "signup",
                "code": "123456",
                "requestedAt": "%s",
                "expiresAt": "%s"
              }
            ]
            """.formatted(email.toLowerCase(), now, now.plusSeconds(600)));
    }
}
