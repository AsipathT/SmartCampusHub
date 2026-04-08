package com.smartcampus.controller;

import com.smartcampus.dto.*;
import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponseDto> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponseDto>> listTickets(
            @RequestParam(required = false) Long reporterUserId,
            @RequestParam(required = false) Long assignedStaffId,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ticketService.listTickets(reporterUserId, assignedStaffId, status, priority, search));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketResponseDto> getTicketById(
            @PathVariable Long ticketId,
            @RequestParam(required = false) Long viewerUserId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId, viewerUserId));
    }

    @PatchMapping("/{ticketId}")
    public ResponseEntity<TicketResponseDto> updateTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ticketService.updateTicket(ticketId, request));
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<TicketResponseDto> assignTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, request));
    }

    @PostMapping(value = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<TicketAttachmentDto>> uploadAttachments(
            @PathVariable Long ticketId,
            @RequestParam("files") MultipartFile[] files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.uploadAttachments(ticketId, files));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<TicketCommentDto> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody AddTicketCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(ticketId, request));
    }

    @PatchMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketCommentDto> updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateTicketCommentRequest request) {
        return ResponseEntity.ok(ticketService.updateComment(ticketId, commentId, request));
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody DeleteTicketCommentRequest request) {
        ticketService.deleteComment(ticketId, commentId, request);
        return ResponseEntity.noContent().build();
    }
}
