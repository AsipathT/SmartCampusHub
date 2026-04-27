import api from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiResponse {
  token: string;
  id: string;
  fullName: string;
  email: string;
  role: string;
  profileImage?: string;
  message: string;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

/** Register a new SLIIT student */
export const registerStudent = (payload: RegisterPayload): Promise<AuthApiResponse> =>
  api.post<AuthApiResponse>('/auth/register', payload).then((r) => r.data);

/** Login with email + password */
export const loginUser = (payload: LoginPayload): Promise<AuthApiResponse> =>
  api.post<AuthApiResponse>('/auth/login', payload).then((r) => r.data);

/** Check if an email is already registered (real-time validation) */
export const checkEmailExists = (email: string): Promise<{ exists: boolean }> =>
  api.get<{ exists: boolean }>('/auth/check-email', { params: { email } }).then((r) => r.data);

/** Update user profile */
export const updateProfile = (id: string, payload: { fullName?: string; profileImage?: string }): Promise<AuthApiResponse> =>
  api.put<AuthApiResponse>(`/auth/profile/${id}`, payload).then((r) => r.data);

/** Google OAuth2 login — sends Google ID token to backend for verification */
export const googleLogin = (credential: string): Promise<AuthApiResponse> =>
  api.post<AuthApiResponse>('/auth/google', { credential }).then((r) => r.data);
