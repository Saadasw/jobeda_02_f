import { useAuthStore } from './authStore';
import { logoutRequest } from './api';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);

  async function logout(): Promise<void> {
    try {
      await logoutRequest();
    } finally {
      // Always clear local state, even if the network call fails.
      clear();
    }
  }

  return { user, isAuthenticated: Boolean(user && accessToken), logout };
}
