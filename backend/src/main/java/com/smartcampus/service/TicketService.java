package com.smartcampus.service;

import com.smartcampus.dto.*;
import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {
    TicketResponseDto createTicket(CreateTicketRequest request);
    List<TicketResponseDto> listTickets(Long reporterUserId, Long assignedStaffId, TicketStatus status, TicketPriority priority, String search);
    TicketResponseDto getTicketById(Long ticketId, Long viewerUserId);
    TicketResponseDto updateTicket(Long ticketId, UpdateTicketRequest request);
    TicketResponseDto assignTicket(Long ticketId, AssignTicketRequest request);
    List<TicketAttachmentDto> uploadAttachments(Long ticketId, MultipartFile[] files);
    TicketCommentDto addComment(Long ticketId, AddTicketCommentRequest request);
    TicketCommentDto updateComment(Long ticketId, Long commentId, UpdateTicketCommentRequest request);
    void deleteComment(Long ticketId, Long commentId, DeleteTicketCommentRequest request);
}
