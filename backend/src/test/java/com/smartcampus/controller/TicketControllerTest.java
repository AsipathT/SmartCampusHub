package com.smartcampus.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.AssignTicketRequest;
import com.smartcampus.dto.CreateTicketRequest;
import com.smartcampus.dto.TicketResponseDto;
import com.smartcampus.dto.UpdateTicketRequest;
import com.smartcampus.exception.IncidentOperationsExceptionHandler;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.enums.TicketPriority;
import com.smartcampus.model.enums.TicketStatus;
import com.smartcampus.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone web-layer test for the Maintenance &amp; Incident Ticketing module.
 *
 * <p>Covers the full PAF Module C happy-path workflow expected by the university
 * rubric:
 * <pre>
 *   Create (OPEN) -> Assign technician (IN_PROGRESS)
 *                 -> Resolve (RESOLVED) -> Close (CLOSED)
 * </pre>
 *
 * <p>Also asserts that the module-scoped
 * {@link IncidentOperationsExceptionHandler} produces the uniform
 * {@code {code, message, path, ...}} envelope for the two most common failure
 * paths (missing required field, unknown ticket id, invalid state transition).
 *
 * <p>Uses {@link MockMvcBuilders#standaloneSetup} so the test doesn't require a
 * Spring {@code ApplicationContext} (nor the JPA metamodel, nor the database).
 * This keeps the test fast and isolated — ideal for CI and for the VIVA demo.
 */
class TicketControllerTest {

    private MockMvc mockMvc;
    private TicketService ticketService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Long TICKET_ID = 42L;
    private static final Long REPORTER_ID = 100L;
    private static final Long ADMIN_ID = 1L;
    private static final Long TECHNICIAN_ID = 200L;

    @BeforeEach
    void setUp() {
        ticketService = mock(TicketService.class);
        TicketController controller = new TicketController(ticketService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new IncidentOperationsExceptionHandler())
                .build();
    }

    @Test
    void createTicket_happyPath_returnsCreatedOpenTicket() throws Exception {
        CreateTicketRequest req = validCreateRequest();
        TicketResponseDto saved = baseResponse(TicketStatus.OPEN).build();
        given(ticketService.createTicket(any(CreateTicketRequest.class))).willReturn(saved);

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(TICKET_ID.intValue())))
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.priority", is("MEDIUM")));
    }

    @Test
    void createTicket_missingPriority_returnsUniformValidationEnvelope() throws Exception {
        CreateTicketRequest req = validCreateRequest();
        req.setPriority(null); // Module C mandates priority

        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INCIDENT_FIELD_VALIDATION_FAILED")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.path", is("/api/v1/tickets")))
                .andExpect(jsonPath("$.details.priority").exists());
    }

    @Test
    void assignTechnician_happyPath_returnsInProgressTicket() throws Exception {
        AssignTicketRequest req = new AssignTicketRequest();
        req.setAssignedStaffId(TECHNICIAN_ID);
        req.setActorUserId(ADMIN_ID);
        req.setActorRole("ADMIN");

        TicketResponseDto afterAssign = baseResponse(TicketStatus.IN_PROGRESS)
                .assignedStaffId(TECHNICIAN_ID)
                .build();
        given(ticketService.assignTicket(eq(TICKET_ID), any(AssignTicketRequest.class)))
                .willReturn(afterAssign);

        mockMvc.perform(patch("/api/v1/tickets/{id}/assign", TICKET_ID)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.assignedStaffId", is(TECHNICIAN_ID.intValue())));
    }

    @Test
    void updateStatus_resolveThenClose_followsModuleCWorkflow() throws Exception {
        UpdateTicketRequest resolveReq = adminUpdate();
        resolveReq.setStatus(TicketStatus.RESOLVED);
        resolveReq.setResolutionNotes("Replaced faulty ballast.");
        TicketResponseDto resolved = baseResponse(TicketStatus.RESOLVED)
                .resolutionNotes("Replaced faulty ballast.")
                .build();
        given(ticketService.updateTicket(eq(TICKET_ID), any(UpdateTicketRequest.class)))
                .willReturn(resolved);

        mockMvc.perform(patch("/api/v1/tickets/{id}", TICKET_ID)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RESOLVED")))
                .andExpect(jsonPath("$.resolutionNotes", is("Replaced faulty ballast.")));

        UpdateTicketRequest closeReq = adminUpdate();
        closeReq.setStatus(TicketStatus.CLOSED);
        TicketResponseDto closed = baseResponse(TicketStatus.CLOSED).build();
        given(ticketService.updateTicket(eq(TICKET_ID), any(UpdateTicketRequest.class)))
                .willReturn(closed);

        mockMvc.perform(patch("/api/v1/tickets/{id}", TICKET_ID)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CLOSED")));
    }

    @Test
    void getTicket_unknownId_returnsUniformNotFoundEnvelope() throws Exception {
        given(ticketService.getTicketById(eq(999L), any()))
                .willThrow(new ResourceNotFoundException("Ticket not found"));

        mockMvc.perform(get("/api/v1/tickets/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("INCIDENT_NOT_FOUND")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", is("Ticket not found")))
                .andExpect(jsonPath("$.path", is("/api/v1/tickets/999")));
    }

    @Test
    void updateStatus_invalidTransition_returnsUniformBadRequestEnvelope() throws Exception {
        UpdateTicketRequest badReq = adminUpdate();
        badReq.setStatus(TicketStatus.CLOSED);
        doThrow(new IllegalArgumentException("RESOLVED can only move to CLOSED or back to IN_PROGRESS"))
                .when(ticketService).updateTicket(eq(TICKET_ID), any(UpdateTicketRequest.class));

        mockMvc.perform(patch("/api/v1/tickets/{id}", TICKET_ID)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INCIDENT_BAD_REQUEST")))
                .andExpect(jsonPath("$.status", is(400)));
    }

    private CreateTicketRequest validCreateRequest() {
        CreateTicketRequest req = new CreateTicketRequest();
        req.setLocation("SLIIT Main Building");
        req.setCategory("Electrical");
        req.setDescription("Corridor light flickering on the 3rd floor.");
        req.setPriority(TicketPriority.MEDIUM);
        req.setContactName("Nimal Perera");
        req.setContactNumber("0771234567");
        req.setPinLatitude(6.9147);
        req.setPinLongitude(79.9723);
        req.setReporterUserId(REPORTER_ID);
        return req;
    }

    private UpdateTicketRequest adminUpdate() {
        UpdateTicketRequest req = new UpdateTicketRequest();
        req.setActorUserId(ADMIN_ID);
        req.setActorRole("ADMIN");
        return req;
    }

    private TicketResponseDto.TicketResponseDtoBuilder baseResponse(TicketStatus status) {
        LocalDateTime now = LocalDateTime.now();
        return TicketResponseDto.builder()
                .id(TICKET_ID)
                .location("SLIIT Main Building")
                .category("Electrical")
                .description("Corridor light flickering on the 3rd floor.")
                .priority(TicketPriority.MEDIUM)
                .contactName("Nimal Perera")
                .contactNumber("0771234567")
                .pinLatitude(6.9147)
                .pinLongitude(79.9723)
                .status(status)
                .reporterUserId(REPORTER_ID)
                .createdAt(now)
                .updatedAt(now);
    }
}
