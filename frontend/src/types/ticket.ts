export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketAttachment {
  id: number;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileUrl: string;
}

export interface TicketComment {
  id: number;
  authorUserId: number;
  authorRole: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner: boolean;
}

export interface Ticket {
  id: number;
  location: string;
  category: string;
  description: string;
  priority: TicketPriority;
  preferredContactDetails: string;
  status: TicketStatus;
  rejectionReason?: string | null;
  resolutionNotes?: string | null;
  reporterUserId: number;
  assignedStaffId?: number | null;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
  commentCount: number;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
}
