package com.roomplanner.backend.auth.dto;

public record EmailAvailabilityResponse(
    String email,
    boolean available,
    String message
) {
}
