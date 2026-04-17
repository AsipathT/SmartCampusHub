// Aligned with PAF assignment Module C workflow:
// OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED (Admin may also set REJECTED with a reason).
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

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

export interface IncidentAssigneeOption {
  userId: number;
  fullName: string;
  age: number;
  qualification: string;
  yearsOfExperience: number;
  specialistSkills: string;
  contactNumber: string;
  supportedCategories: string;
}

export interface Ticket {
  id: number;
  location: string;
  category: string;
  description: string;
  priority: TicketPriority;
  preferredContactDetails?: string | null;
  contactName?: string | null;
  contactNumber?: string | null;
  pinLatitude?: number | null;
  pinLongitude?: number | null;
  status: TicketStatus;
  rejectionReason?: string | null;
  resolutionNotes?: string | null;
  reporterUserId: number;
  assignedStaffId?: number | null;
  assignedStaffProfile?: IncidentAssigneeOption | null;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
  commentCount: number;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
}
