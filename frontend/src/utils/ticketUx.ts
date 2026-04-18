import { Ticket } from '../types/ticket';

export const getTicketAgeMs = (ticket: Ticket): number =>
  Math.max(0, Date.now() - new Date(ticket.createdAt).getTime());

export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const getSlaHours = (priority: Ticket['priority']): number => {
  switch (priority) {
    case 'HIGH': return 8;
    case 'MEDIUM': return 24;
    default: return 48;
  }
};

export const getSlaState = (ticket: Ticket): 'ok' | 'warning' | 'breached' => {
  // Terminal / non-active states are not subject to SLA pressure.
  if (
    ticket.status === 'RESOLVED' ||
    ticket.status === 'CLOSED' ||
    ticket.status === 'REJECTED'
  ) {
    return 'ok';
  }
  const ageHours = getTicketAgeMs(ticket) / 3600000;
  const slaHours = getSlaHours(ticket.priority);
  if (ageHours > slaHours) return 'breached';
  if (ageHours > slaHours * 0.75) return 'warning';
  return 'ok';
};
