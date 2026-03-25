export interface Resource {
  id: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  availabilityTime: string;
  imageUrl?: string;
  deleted?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
