import api from './client';
import { Ticket, TicketPriority, TicketStatus, TicketAttachment, TicketComment } from '../types/ticket';

export interface CreateTicketPayload {
  location: string;
  category: string;
  description: string;
  priority: TicketPriority;
  preferredContactDetails: string;
  reporterUserId: number;
}

export interface UpdateTicketPayload {
  location?: string;
  category?: string;
  description?: string;
  priority?: TicketPriority;
  preferredContactDetails?: string;
  status?: TicketStatus;
  rejectionReason?: string;
  resolutionNotes?: string;
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
  const response = await api.post(`/tickets/${ticketId}/comments`, payload);
  return response.data;
};

export const assignTicket = async (
  ticketId: number,
  assignedStaffId: number
): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${ticketId}/assign`, { assignedStaffId });
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
