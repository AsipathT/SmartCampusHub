export type FacilityStatus = 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type FacilityType = 'LECTURE_HALL' | 'LAB' | 'MEETING_ROOM' | 'SPORTS_ARENA' | 'LIBRARY' | 'OTHERS';

export interface Facility {
  id: number;
  name: string;
  description: string;
  type: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl?: string;
  availableFrom: string; // 'HH:MM:SS'
  availableTo: string;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  empty: boolean;
}
