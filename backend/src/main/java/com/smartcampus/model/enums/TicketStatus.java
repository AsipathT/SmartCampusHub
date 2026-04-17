package com.smartcampus.model.enums;

/**
 * Maintenance & Incident Ticketing workflow states.
 * <p>
 * Per the PAF assignment specification (Module C):
 * {@code OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED}
 * with {@code REJECTED} reachable from {@code OPEN} or {@code IN_PROGRESS}
 * (admin-only, requires a reason).
 */
public enum TicketStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED,
    REJECTED
}
