package com.roomplanner.backend.workspace;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearWorkspaceFiles() throws Exception {
        Files.deleteIfExists(Path.of("./target/test-users.json"));
        Files.deleteIfExists(Path.of("./target/test-tokens.json"));
        Files.deleteIfExists(Path.of("./target/test-workspaces.json"));
        Files.deleteIfExists(Path.of("./target/test-email-verifications.json"));
    }

    @Test
    void saveThenFetchWorkspace() throws Exception {
        String token = signupAndReturnToken("workspace-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(put("/api/workspace")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "currentView": "editor",
                      "selectedProjectId": 1,
                      "projects": [
                        {
                          "id": 1,
                          "name": "Demo Project"
                        }
                      ]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.state.currentView").value("editor"))
            .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        mockMvc.perform(get("/api/workspace")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.state.selectedProjectId").value(1))
            .andExpect(jsonPath("$.state.projects[0].name").value("Demo Project"));
    }

    @Test
    void workspaceStartsMissingUntilSaved() throws Exception {
        String token = signupAndReturnToken("workspace-empty-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(get("/api/workspace")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }

    private String signupAndReturnToken(String email) throws Exception {
        seedSignupCode(email);
        String signupResponse = mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Workspace User",
                      "email": "%s",
                      "password": "password1234",
                      "verificationCode": "123456"
                    }
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        return signupResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
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
