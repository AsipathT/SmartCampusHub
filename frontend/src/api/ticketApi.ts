import api from './client';
import { Ticket, TicketPriority, TicketStatus, TicketAttachment, TicketComment, IncidentAssigneeOption } from '../types/ticket';

export interface CreateTicketPayload {
  location: string;
  category: string;
  description: string;
  /** Reporter-supplied priority (LOW / MEDIUM / HIGH) — required by Module C. */
  priority: TicketPriority;
  contactName: string;
  contactNumber: string;
  pinLatitude: number;
  pinLongitude: number;
  reporterUserId: number;
}

export interface UpdateTicketPayload {
  location?: string;
  category?: string;
  description?: string;
  priority?: TicketPriority;
  preferredContactDetails?: string;
  contactName?: string;
  contactNumber?: string;
  pinLatitude?: number;
  pinLongitude?: number;
  status?: TicketStatus;
  rejectionReason?: string;
  resolutionNotes?: string;
  actorUserId?: number;
  actorRole?: string;
}

export const listTickets = async (params?: {
  reporterUserId?: number;
  assignedStaffId?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}): Promise<Ticket[]> => {
  const response = await api.get('/tickets', { params });
  return response.data;
};

export const getTicketById = async (ticketId: number, viewerUserId?: number): Promise<Ticket> => {
  const response = await api.get(`/tickets/${ticketId}`, { params: { viewerUserId } });
  return response.data;
};

export const createTicket = async (payload: CreateTicketPayload): Promise<Ticket> => {
  const response = await api.post('/tickets', payload);
  return response.data;
};

export const updateTicket = async (ticketId: number, payload: UpdateTicketPayload): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${ticketId}`, payload);
  return response.data;
};

export const deleteTicket = async (
  ticketId: number,
  payload: { actorUserId: number }
): Promise<void> => {
  await api.delete(`/tickets/${ticketId}`, { data: payload });
};

export const uploadTicketAttachments = async (
  ticketId: number,
  files: File[]
): Promise<TicketAttachment[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await api.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const addTicketComment = async (
  ticketId: number,
  payload: { authorUserId: number; authorRole: string; content: string }
): Promise<TicketComment> => {
  const response = await api.post(`/tickets/${ticketId}/comments`, payload, { skipAuth: true } as any);
  return response.data;
};

export const assignTicket = async (
  ticketId: number,
  payload: { assignedStaffId: number; actorUserId: number; actorRole: string }
): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${ticketId}/assign`, payload);
  return response.data;
};

export const listAssignableStaff = async (category?: string): Promise<IncidentAssigneeOption[]> => {
  const response = await api.get('/tickets/assignees', { params: { category } });
  return response.data;
};

export const updateTicketComment = async (
  ticketId: number,
  commentId: number,
  payload: { actorUserId: number; actorRole: string; content: string }
): Promise<TicketComment> => {
  const response = await api.patch(`/tickets/${ticketId}/comments/${commentId}`, payload);
  return response.data;
};

export const deleteTicketComment = async (
  ticketId: number,
  commentId: number,
  payload: { actorUserId: number; actorRole: string }
): Promise<void> => {
  await api.delete(`/tickets/${ticketId}/comments/${commentId}`, { data: payload });
};
