export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  communityId?: string | null;
  community?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: string;
}

export interface Complaint {
  earnedPoints?: number;
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  rejectNote?: string;
  progressNote?: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Resolved';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    name: string;
    email: string;
  } | null;
}

export interface ProfileActivity {
  id: string;
  title: string;
  status: string;
  rejectNote?: string;
  progressNote?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
