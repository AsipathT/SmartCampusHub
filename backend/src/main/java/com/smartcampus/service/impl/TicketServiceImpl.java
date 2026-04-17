package com.smartcampus.service.impl;

import com.smartcampus.dto.*;
import com.smartcampus.model.entity.Ticket;
import com.smartcampus.model.entity.TicketAttachment;
import com.smartcampus.model.entity.TicketComment;
import com.smartcampus.model.entity.IncidentStaffProfile;
import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import com.smartcampus.repository.TicketAttachmentRepository;
import com.smartcampus.repository.TicketCommentRepository;
import com.smartcampus.repository.IncidentStaffProfileRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.NotificationService;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;
    private final IncidentStaffProfileRepository incidentStaffProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public TicketResponseDto createTicket(CreateTicketRequest request) {
        ensureUserExists(request.getReporterUserId(), "Reporter user not found");
        String contactName = request.getContactName().trim();
        String contactNumber = request.getContactNumber().trim();
        String legacyContact = contactName + " | " + contactNumber;
        if (legacyContact.length() > 255) {
            legacyContact = legacyContact.substring(0, 255);
        }
        TicketPriority requestedPriority = request.getPriority() != null
                ? request.getPriority()
                : TicketPriority.MEDIUM;
        Ticket ticket = Ticket.builder()
                .location(request.getLocation().trim())
                .category(request.getCategory().trim())
                .description(request.getDescription().trim())
                .priority(requestedPriority)
                .preferredContactDetails(legacyContact)
                .contactName(contactName)
                .contactNumber(contactNumber)
                .pinLatitude(request.getPinLatitude())
                .pinLongitude(request.getPinLongitude())
                .status(TicketStatus.OPEN)
                .reporterUserId(request.getReporterUserId())
                .build();
        Ticket saved = ticketRepository.save(ticket);
        String reporterName = resolveUserDisplayName(saved.getReporterUserId());
        notifyAdmins(admin -> notificationService.createTicketCreatedNotification(
                admin, saved.getId(), reporterName, saved.getCategory()
        ), "ticket created notification");
        return mapTicketResponse(saved, null, true);
    }

    @Override
    public List<TicketResponseDto> listTickets(Long reporterUserId, Long assignedStaffId, TicketStatus status, TicketPriority priority, String search) {
        List<Ticket> tickets;
        if (reporterUserId != null) {
            tickets = ticketRepository.findByReporterUserIdOrderByCreatedAtDesc(reporterUserId);
        } else if (assignedStaffId != null) {
            tickets = ticketRepository.findByAssignedStaffIdOrderByCreatedAtDesc(assignedStaffId);
        } else if (status != null) {
            tickets = ticketRepository.findByStatusOrderByCreatedAtDesc(status);
        } else if (priority != null) {
            tickets = ticketRepository.findByPriorityOrderByCreatedAtDesc(priority);
        } else {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        }

        return tickets.stream()
                .filter(t -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return String.valueOf(t.getId()).contains(q)
                            || safe(t.getDescription()).toLowerCase().contains(q)
                            || safe(t.getLocation()).toLowerCase().contains(q)
                            || safe(t.getCategory()).toLowerCase().contains(q)
                            || safe(t.getContactName()).toLowerCase().contains(q)
                            || safe(t.getContactNumber()).toLowerCase().contains(q);
                })
                .map(t -> mapTicketResponse(t, null, false))
                .collect(Collectors.toList());
    }

    @Override
    public TicketResponseDto getTicketById(Long ticketId, Long viewerUserId) {
        Ticket ticket = getTicketOrThrow(ticketId);
        return mapTicketResponse(ticket, viewerUserId, true);
    }

    @Override
    public TicketResponseDto updateTicket(Long ticketId, UpdateTicketRequest request) {
        Ticket ticket = getTicketOrThrow(ticketId);
        boolean adminActor = isAdminActor(request.getActorUserId(), request.getActorRole());
        boolean adminOpsUpdate = request.getStatus() != null
                || request.getPriority() != null
                || request.getResolutionNotes() != null
                || request.getRejectionReason() != null;

        if (adminOpsUpdate) {
            validateAdminActor(request.getActorUserId(), request.getActorRole());
        } else if (!adminActor) {
            validateReporterOwnership(ticket, request.getActorUserId());
        }
        TicketStatus previousStatus = ticket.getStatus();

        if (request.getLocation() != null) ticket.setLocation(request.getLocation().trim());
        if (request.getCategory() != null) ticket.setCategory(request.getCategory().trim());
        if (request.getDescription() != null) ticket.setDescription(request.getDescription().trim());
        if (request.getPriority() != null) ticket.setPriority(request.getPriority());
        if (request.getPreferredContactDetails() != null) ticket.setPreferredContactDetails(trimToNull(request.getPreferredContactDetails()));
        if (request.getContactName() != null) ticket.setContactName(request.getContactName().trim());
        if (request.getContactNumber() != null) ticket.setContactNumber(request.getContactNumber().trim());
        if (request.getPinLatitude() != null) ticket.setPinLatitude(request.getPinLatitude());
        if (request.getPinLongitude() != null) ticket.setPinLongitude(request.getPinLongitude());
        if (request.getResolutionNotes() != null) ticket.setResolutionNotes(trimToNull(request.getResolutionNotes()));

        if (request.getStatus() != null) {
            validateStatusTransition(ticket.getStatus(), request.getStatus(), request.getRejectionReason());
            ticket.setStatus(request.getStatus());
            if (request.getStatus() == TicketStatus.REJECTED) {
                ticket.setRejectionReason(trimToNull(request.getRejectionReason()));
            } else if (request.getStatus() == TicketStatus.RESOLVED) {
                ticket.setRejectionReason(null);
            }
        }

        TicketPriority previousPriority = ticket.getPriority();
        Ticket updated = ticketRepository.save(ticket);
        if (request.getStatus() != null && previousStatus != request.getStatus()) {
            safeNotify(() -> notificationService.createTicketStatusChangeNotification(
                    updated.getReporterUserId(),
                    updated.getId(),
                    updated.getStatus().name()
            ), "ticket status change notification");
        }
        if (adminOpsUpdate && request.getPriority() != null && previousPriority != request.getPriority()) {
            safeNotify(() -> notificationService.createTicketPriorityChangeNotification(
                    updated.getReporterUserId(),
                    updated.getId(),
                    updated.getPriority().name()
            ), "ticket priority change notification");
        }
        if (!adminOpsUpdate && !adminActor) {
            String reporterName = resolveUserDisplayName(updated.getReporterUserId());
            notifyAdmins(admin -> notificationService.createTicketUpdatedNotification(
                    admin, updated.getId(), reporterName
            ), "ticket updated notification");
        }
        return mapTicketResponse(updated, null, true);
    }

    @Override
    public TicketResponseDto assignTicket(Long ticketId, AssignTicketRequest request) {
        Ticket ticket = getTicketOrThrow(ticketId);
        validateAdminActor(request.getActorUserId(), request.getActorRole());
        if (request.getAssignedStaffId() == null || request.getAssignedStaffId() <= 0) {
            throw new IllegalArgumentException("Assigned staff ID must be greater than zero");
        }
        ensureUserExists(request.getAssignedStaffId(), "Assigned user not found");
        IncidentStaffProfile profile = incidentStaffProfileRepository.findByUserId(request.getAssignedStaffId())
                .orElseThrow(() -> new IllegalArgumentException("Assigned user is not available in incident staff roster"));
        Long previousAssignee = ticket.getAssignedStaffId();
        TicketStatus previousStatus = ticket.getStatus();
        ticket.setAssignedStaffId(request.getAssignedStaffId());
        // When a technician is assigned to a freshly reported (OPEN) ticket,
        // the workflow moves to IN_PROGRESS automatically — this matches the
        // PAF Module C lifecycle (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED).
        if (previousStatus == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket saved = ticketRepository.save(ticket);
        if (!Objects.equals(previousAssignee, saved.getAssignedStaffId())) {
            String technicianName = profile.getFullName();
            safeNotify(() -> notificationService.createTicketAssignedNotification(
                    saved.getReporterUserId(), saved.getId(), technicianName, false
            ), "ticket assigned notification (reporter)");
            safeNotify(() -> notificationService.createTicketAssignedNotification(
                    saved.getAssignedStaffId(), saved.getId(), technicianName, true
            ), "ticket assigned notification (technician)");
        }
        if (previousStatus != saved.getStatus()) {
            safeNotify(() -> notificationService.createTicketStatusChangeNotification(
                    saved.getReporterUserId(),
                    saved.getId(),
                    saved.getStatus().name()
            ), "ticket status change notification (auto on assign)");
        }
        return mapTicketResponse(saved, null, true);
    }

    @Override
    public void deleteTicket(Long ticketId, DeleteTicketRequest request) {
        Ticket ticket = getTicketOrThrow(ticketId);
        validateReporterOwnership(ticket, request.getActorUserId());
        Long ticketIdValue = ticket.getId();
        String reporterName = resolveUserDisplayName(ticket.getReporterUserId());
        commentRepository.deleteByTicketId(ticketId);
        attachmentRepository.deleteByTicketId(ticketId);
        ticketRepository.delete(ticket);
        notifyAdmins(admin -> notificationService.createTicketDeletedNotification(
                admin, ticketIdValue, reporterName
        ), "ticket deleted notification");
    }

    @Override
    public List<IncidentAssigneeOptionDto> listAssignableStaff(String category) {
        String normalizedCategory = normalize(category);
        List<IncidentStaffProfile> allProfiles = incidentStaffProfileRepository.findAll();
        List<IncidentStaffProfile> matchingProfiles = allProfiles.stream()
                .filter(profile -> normalizedCategory.isBlank() || normalize(profile.getSupportedCategories()).contains(normalizedCategory))
                .collect(Collectors.toList());
        List<IncidentStaffProfile> source = matchingProfiles.isEmpty() ? allProfiles : matchingProfiles;
        return source.stream()
                .sorted(Comparator.comparing(IncidentStaffProfile::getYearsOfExperience).reversed())
                .map(profile -> IncidentAssigneeOptionDto.builder()
                        .userId(profile.getUserId())
                        .fullName(profile.getFullName())
                        .age(profile.getAge())
                        .qualification(profile.getQualification())
                        .yearsOfExperience(profile.getYearsOfExperience())
                        .specialistSkills(profile.getSpecialistSkills())
                        .contactNumber(profile.getContactNumber())
                        .supportedCategories(profile.getSupportedCategories())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketAttachmentDto> uploadAttachments(Long ticketId, MultipartFile[] files) {
        Ticket ticket = getTicketOrThrow(ticketId);
        long existing = attachmentRepository.countByTicketId(ticketId);
        int incoming = files == null ? 0 : files.length;
        if (incoming == 0) throw new IllegalArgumentException("At least one attachment is required");
        if (existing + incoming > MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalArgumentException("Maximum 3 attachments are allowed per ticket");
        }

        Path uploadDir = Paths.get("uploads/tickets");
        try {
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload directory");
        }

        List<TicketAttachment> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            validateAttachment(file);
            String extension = extractExtension(file.getOriginalFilename());
            String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
            Path target = uploadDir.resolve(storedName);
            try {
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Could not store attachment");
            }

            TicketAttachment attachment = TicketAttachment.builder()
                    .ticket(ticket)
                    .originalFileName(Optional.ofNullable(file.getOriginalFilename()).orElse("attachment"))
                    .storedFileName(storedName)
                    .contentType(file.getContentType())
                    .fileSizeBytes(file.getSize())
                    .fileUrl("http://localhost:8080/uploads/tickets/" + storedName)
                    .build();
            saved.add(attachmentRepository.save(attachment));
        }
        return saved.stream().map(this::mapAttachment).collect(Collectors.toList());
    }

    @Override
    public TicketCommentDto addComment(Long ticketId, AddTicketCommentRequest request) {
        Ticket ticket = getTicketOrThrow(ticketId);
        ensureUserExists(request.getAuthorUserId(), "Comment author not found");
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .authorUserId(request.getAuthorUserId())
                .authorRole(request.getAuthorRole().trim().toUpperCase())
                .content(request.getContent().trim())
                .build();
        TicketComment saved = commentRepository.save(comment);
        String preview = request.getContent().trim();
        if (preview.length() > 120) preview = preview.substring(0, 120) + "...";
        final String previewFinal = preview;

        if (!Objects.equals(ticket.getReporterUserId(), request.getAuthorUserId())) {
            // A non-reporter (admin/staff) commented -> notify the reporter.
            safeNotify(() -> notificationService.createTicketCommentNotification(
                    ticket.getReporterUserId(), ticket.getId(), previewFinal
            ), "ticket comment notification (reporter)");
        } else {
            // Reporter commented -> notify every admin so they can respond.
            notifyAdmins(admin -> notificationService.createTicketCommentNotification(
                    admin, ticket.getId(), previewFinal
            ), "ticket comment notification (admins)");
        }
        // Also loop the assigned technician in (if someone other than them commented).
        Long assignee = ticket.getAssignedStaffId();
        if (assignee != null
                && !Objects.equals(assignee, request.getAuthorUserId())
                && !Objects.equals(assignee, ticket.getReporterUserId())) {
            safeNotify(() -> notificationService.createTicketCommentNotification(
                    assignee, ticket.getId(), previewFinal
            ), "ticket comment notification (assignee)");
        }
        return mapComment(saved, request.getAuthorUserId());
    }

    @Override
    public TicketCommentDto updateComment(Long ticketId, Long commentId, UpdateTicketCommentRequest request) {
        TicketComment comment = getCommentOrThrow(ticketId, commentId);
        boolean adminOverride = "ADMIN".equalsIgnoreCase(request.getActorRole());
        if (!adminOverride && !Objects.equals(comment.getAuthorUserId(), request.getActorUserId())) {
            throw new IllegalArgumentException("You can only edit your own comment");
        }
        comment.setContent(request.getContent().trim());
        return mapComment(commentRepository.save(comment), request.getActorUserId());
    }

    @Override
    public void deleteComment(Long ticketId, Long commentId, DeleteTicketCommentRequest request) {
        TicketComment comment = getCommentOrThrow(ticketId, commentId);
        boolean adminOverride = "ADMIN".equalsIgnoreCase(request.getActorRole());
        if (!adminOverride && !Objects.equals(comment.getAuthorUserId(), request.getActorUserId())) {
            throw new IllegalArgumentException("You can only delete your own comment");
        }
        commentRepository.delete(comment);
    }

    private Ticket getTicketOrThrow(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));
    }

    private TicketComment getCommentOrThrow(Long ticketId, Long commentId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!Objects.equals(comment.getTicket().getId(), ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to this ticket");
        }
        return comment;
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Attachment file cannot be empty");
        if (file.getSize() > MAX_FILE_SIZE_BYTES) throw new IllegalArgumentException("Attachment exceeds 5MB limit");
        if (!ALLOWED_TYPES.contains(Optional.ofNullable(file.getContentType()).orElse(""))) {
            throw new IllegalArgumentException("Only JPG, PNG, and WEBP image files are allowed");
        }
    }

    /**
     * Enforces the assignment-specified workflow:
     * {@code OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED} with {@code REJECTED}
     * reachable from {@code OPEN} or {@code IN_PROGRESS} (admin-only and a
     * rejection reason is required). Resolved tickets may be reopened back to
     * {@code IN_PROGRESS} if more work is needed before {@code CLOSED}.
     */
    private void validateStatusTransition(TicketStatus current, TicketStatus next, String rejectionReason) {
        if (current == next) return;
        switch (current) {
            case OPEN -> {
                if (!(next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED)) {
                    throw new IllegalArgumentException("OPEN can only move to IN_PROGRESS or REJECTED");
                }
            }
            case IN_PROGRESS -> {
                if (!(next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED)) {
                    throw new IllegalArgumentException("IN_PROGRESS can only move to RESOLVED or REJECTED");
                }
            }
            case RESOLVED -> {
                if (!(next == TicketStatus.CLOSED || next == TicketStatus.IN_PROGRESS)) {
                    throw new IllegalArgumentException("RESOLVED can only move to CLOSED or back to IN_PROGRESS");
                }
            }
            case CLOSED -> throw new IllegalArgumentException("Closed tickets cannot transition");
            case REJECTED -> throw new IllegalArgumentException("Rejected tickets cannot transition");
        }
        if (next == TicketStatus.REJECTED && (rejectionReason == null || rejectionReason.isBlank())) {
            throw new IllegalArgumentException("Rejection reason is required when status is REJECTED");
        }
    }

    private void ensureUserExists(Long userId, String message) {
        if (userId == null || userRepository.findById(userId).isEmpty()) {
            throw new IllegalArgumentException(message);
        }
    }

    private void validateReporterOwnership(Ticket ticket, Long actorUserId) {
        if (actorUserId == null) {
            throw new IllegalArgumentException("Actor user is required");
        }
        if (!Objects.equals(ticket.getReporterUserId(), actorUserId)) {
            throw new IllegalArgumentException("Only the ticket reporter can modify or delete this ticket");
        }
    }

    private void validateAdminActor(Long actorUserId, String actorRole) {
        if (!isAdminActor(actorUserId, actorRole)) {
            throw new IllegalArgumentException("Only admins can update incident operations");
        }
    }

    private boolean isAdminActor(Long actorUserId, String actorRole) {
        if (actorUserId == null) {
            return false;
        }
        var actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Actor user not found"));
        String resolvedRole = actorRole == null ? "" : actorRole.trim();
        return "ADMIN".equalsIgnoreCase(actor.getRole()) && "ADMIN".equalsIgnoreCase(resolvedRole);
    }

    /**
     * Notifications are a best-effort side-effect of ticket operations. Legacy NOT NULL columns
     * on the shared notifications table can cause inserts to fail; that must never bubble up and
     * break the primary ticket flow (comment add, status change, etc.).
     */
    private void safeNotify(Runnable action, String description) {
        try {
            action.run();
        } catch (Exception ex) {
            log.warn("Skipping {} due to error: {}", description, ex.getMessage());
        }
    }

    /**
     * Fan out a notification to every admin user. Used when the incident module needs
     * to alert the operations team (new ticket, reporter update/delete, etc.).
     */
    private void notifyAdmins(java.util.function.LongConsumer perAdmin, String description) {
        try {
            userRepository.findAllByRoleIgnoreCase("ADMIN").forEach(admin ->
                    safeNotify(() -> perAdmin.accept(admin.getId()), description)
            );
        } catch (Exception ex) {
            log.warn("Skipping admin fan-out for {} due to error: {}", description, ex.getMessage());
        }
    }

    private String resolveUserDisplayName(Long userId) {
        if (userId == null) return "Unknown user";
        return userRepository.findById(userId)
                .map(u -> {
                    if (u.getFullName() != null && !u.getFullName().isBlank()) return u.getFullName();
                    if (u.getUsername() != null && !u.getUsername().isBlank()) return u.getUsername();
                    return "User #" + userId;
                })
                .orElse("User #" + userId);
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
    }

    private TicketResponseDto mapTicketResponse(Ticket ticket, Long viewerUserId, boolean includeDetails) {
        List<TicketAttachment> attachments = attachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        List<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        IncidentAssigneeOptionDto assignedStaffProfile = ticket.getAssignedStaffId() == null
                ? null
                : incidentStaffProfileRepository.findByUserId(ticket.getAssignedStaffId())
                .map(this::mapStaffProfile)
                .orElse(null);

        TicketResponseDto.TicketResponseDtoBuilder builder = TicketResponseDto.builder()
                .id(ticket.getId())
                .location(ticket.getLocation())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .preferredContactDetails(ticket.getPreferredContactDetails())
                .contactName(ticket.getContactName())
                .contactNumber(ticket.getContactNumber())
                .pinLatitude(ticket.getPinLatitude())
                .pinLongitude(ticket.getPinLongitude())
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .reporterUserId(ticket.getReporterUserId())
                .assignedStaffId(ticket.getAssignedStaffId())
                .assignedStaffProfile(assignedStaffProfile)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachmentCount(attachments.size())
                .commentCount(comments.size());

        if (includeDetails) {
            builder.attachments(attachments.stream().map(this::mapAttachment).collect(Collectors.toList()));
            builder.comments(comments.stream().map(c -> mapComment(c, viewerUserId)).collect(Collectors.toList()));
        }
        return builder.build();
    }

    private TicketAttachmentDto mapAttachment(TicketAttachment attachment) {
        return TicketAttachmentDto.builder()
                .id(attachment.getId())
                .originalFileName(attachment.getOriginalFileName())
                .contentType(attachment.getContentType())
                .fileSizeBytes(attachment.getFileSizeBytes())
                .fileUrl(attachment.getFileUrl())
                .build();
    }

    private TicketCommentDto mapComment(TicketComment comment, Long viewerUserId) {
        return TicketCommentDto.builder()
                .id(comment.getId())
                .authorUserId(comment.getAuthorUserId())
                .authorRole(comment.getAuthorRole())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .owner(viewerUserId != null && Objects.equals(comment.getAuthorUserId(), viewerUserId))
                .build();
    }

    private IncidentAssigneeOptionDto mapStaffProfile(IncidentStaffProfile profile) {
        return IncidentAssigneeOptionDto.builder()
                .userId(profile.getUserId())
                .fullName(profile.getFullName())
                .age(profile.getAge())
                .qualification(profile.getQualification())
                .yearsOfExperience(profile.getYearsOfExperience())
                .specialistSkills(profile.getSpecialistSkills())
                .contactNumber(profile.getContactNumber())
                .supportedCategories(profile.getSupportedCategories())
                .build();
    }

    private String extractExtension(String originalName) {
        if (originalName == null || !originalName.contains(".")) return "";
        return originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(String v) {
        return v == null ? "" : v;
    }
}
