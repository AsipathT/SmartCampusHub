package com.smartcampus.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Uniform JSON error envelope returned by the Incident Operations module
 * (Module C: Maintenance &amp; Incident Ticketing, Module D: Notifications).
 *
 * <p>Shape:
 * <pre>
 * {
 *   "timestamp": "2026-04-17T10:15:30Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "code": "TICKET_VALIDATION_ERROR",
 *   "message": "Only admins can update incident operations",
 *   "path": "/api/v1/tickets/1",
 *   "details": { "priority": "must not be null" }   // optional
 * }
 * </pre>
 *
 * <p>The {@code details} map is only populated for field-level validation failures.
 * All other fields are always present so the frontend can render a consistent
 * toast / banner for every incident or notification API error.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record IncidentApiErrorEnvelope(
        OffsetDateTime timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        Map<String, String> details
) {

    public static IncidentApiErrorEnvelope of(int status, String error, String code, String message, String path) {
        return new IncidentApiErrorEnvelope(OffsetDateTime.now(), status, error, code, message, path, null);
    }

    public static IncidentApiErrorEnvelope withDetails(
            int status, String error, String code, String message, String path, Map<String, String> details) {
        return new IncidentApiErrorEnvelope(OffsetDateTime.now(), status, error, code, message, path, details);
    }
}
