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
