package com.roomplanner.backend.workspace.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record WorkspaceStateResponse(
    JsonNode state,
    Instant updatedAt
) {
}
