package com.smartcampus.repository;

import com.smartcampus.model.entity.Ticket;
import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findAllByOrderByCreatedAtDesc();
    List<Ticket> findByReporterUserIdOrderByCreatedAtDesc(Long reporterUserId);
    List<Ticket> findByAssignedStaffIdOrderByCreatedAtDesc(Long assignedStaffId);
    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
    List<Ticket> findByPriorityOrderByCreatedAtDesc(TicketPriority priority);
}
