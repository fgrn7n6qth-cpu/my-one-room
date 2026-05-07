package com.roomplanner.backend.workspace.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record WorkspaceStateRecord(
    String userId,
    JsonNode state,
    Instant updatedAt
) {
}
