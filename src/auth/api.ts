import { api } from '@/api/client';
import type { AuthUser } from './authStore';

export interface LoginPayload {
  email: string;
  password: string;
  tenant_slug?: string;
  tenant_id?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export function loginRequest(payload: LoginPayload): Promise<TokenResponse> {
  return api.post<TokenResponse>('/auth/login', payload).then((r) => r.data);
}

export function logoutRequest(): Promise<void> {
  return api.post('/auth/logout', {}).then(() => undefined);
}

export function meRequest(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me').then((r) => r.data);
}
