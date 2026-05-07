package com.roomplanner.backend.workspace.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomplanner.backend.workspace.model.WorkspaceStateRecord;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkspaceStateService {

    private static final TypeReference<List<WorkspaceStateRecord>> WORKSPACE_LIST_TYPE = new TypeReference<>() {};

    private final Path workspaceFilePath;
    private final ObjectMapper objectMapper;
    private final Map<String, WorkspaceStateRecord> workspaceByUserId = new HashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public WorkspaceStateService(@Value("${app.storage.workspaces-file}") String workspaceFile, ObjectMapper objectMapper) {
        this.workspaceFilePath = Path.of(workspaceFile).toAbsolutePath().normalize();
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    @PostConstruct
    void init() {
        loadWorkspaces();
    }

    public WorkspaceStateRecord getByUserId(String userId) {
        lock.readLock().lock();
        try {
            var record = workspaceByUserId.get(userId);
            if (record == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "저장된 작업 공간이 없습니다.");
            }
            return record;
        } finally {
            lock.readLock().unlock();
        }
    }

    public WorkspaceStateRecord save(String userId, JsonNode state) {
        lock.writeLock().lock();
        try {
            JsonNode safeState = state == null || state.isNull() ? objectMapper.createObjectNode() : state.deepCopy();
            var record = new WorkspaceStateRecord(userId, safeState, Instant.now());
            workspaceByUserId.put(userId, record);
            saveWorkspaces();
            return record;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public void deleteByUserId(String userId) {
        lock.writeLock().lock();
        try {
            if (workspaceByUserId.remove(userId) != null) {
                saveWorkspaces();
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void loadWorkspaces() {
        lock.writeLock().lock();
        try {
            workspaceByUserId.clear();

            if (!Files.exists(workspaceFilePath)) {
                Files.createDirectories(workspaceFilePath.getParent());
                return;
            }

            List<WorkspaceStateRecord> workspaces = objectMapper.readValue(workspaceFilePath.toFile(), WORKSPACE_LIST_TYPE);
            for (var record : workspaces) {
                workspaceByUserId.put(record.userId(), record);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("작업 공간 정보를 불러오지 못했습니다.", exception);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void saveWorkspaces() {
        try {
            Files.createDirectories(workspaceFilePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(workspaceFilePath.toFile(), new ArrayList<>(workspaceByUserId.values()));
        } catch (IOException exception) {
            throw new IllegalStateException("작업 공간 정보를 저장하지 못했습니다.", exception);
        }
    }
}
