import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/env';
import { useAuthStore } from './authStore';

interface AuthContextValue {
  /** True once the initial session-restore attempt has completed. */
  bootstrapped: boolean;
}

const AuthContext = createContext<AuthContextValue>({ bootstrapped: false });

/**
 * On mount, try to restore a session from the httpOnly refresh cookie (a page
 * reload clears the in-memory access token). If the cookie is valid the backend
 * returns a fresh access token + user; otherwise we remain unauthenticated.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        if (active) setSession(data.access_token, data.user);
      } catch {
        // No valid session cookie — remain unauthenticated.
      } finally {
        if (active) setBootstrapped(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [setSession]);

  return <AuthContext.Provider value={{ bootstrapped }}>{children}</AuthContext.Provider>;
}

export function useAuthBootstrapped(): boolean {
  return useContext(AuthContext).bootstrapped;
}
