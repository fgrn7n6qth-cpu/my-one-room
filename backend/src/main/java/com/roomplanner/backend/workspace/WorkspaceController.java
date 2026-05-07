package com.roomplanner.backend.workspace;

import com.fasterxml.jackson.databind.JsonNode;
import com.roomplanner.backend.auth.UserPrincipal;
import com.roomplanner.backend.workspace.dto.WorkspaceStateResponse;
import com.roomplanner.backend.workspace.service.WorkspaceStateService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {

    private final WorkspaceStateService workspaceStateService;

    public WorkspaceController(WorkspaceStateService workspaceStateService) {
        this.workspaceStateService = workspaceStateService;
    }

    @GetMapping
    public WorkspaceStateResponse getWorkspace(@AuthenticationPrincipal UserPrincipal principal) {
        var record = workspaceStateService.getByUserId(principal.userId());
        return new WorkspaceStateResponse(record.state(), record.updatedAt());
    }

    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public WorkspaceStateResponse saveWorkspace(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody(required = false) JsonNode state
    ) {
        var record = workspaceStateService.save(principal.userId(), state);
        return new WorkspaceStateResponse(record.state(), record.updatedAt());
    }
}
