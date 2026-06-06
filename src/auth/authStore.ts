import { create } from 'zustand';

/** Authenticated user (mirrors the backend UserResponse). */
export interface AuthUser {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role_id: number;
  role_name?: string | null;
  is_active?: boolean;
  last_login?: string | null;
  created_at?: string | null;
}

interface AuthState {
  /** Short-lived access token, kept in memory only (never persisted). */
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (token, user) => set({ accessToken: token, user }),
  clear: () => set({ accessToken: null, user: null }),
}));
