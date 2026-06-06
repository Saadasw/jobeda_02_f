import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from './authStore';
import { useAuthBootstrapped } from './AuthProvider';

/** Requires an authenticated session; otherwise redirects to /login (with return URL). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const bootstrapped = useAuthBootstrapped();
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!bootstrapped) {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    );
  }
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

/** Requires the user's role to be in `roles`; otherwise redirects to /403. */
export function RoleRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user && !roles.includes(user.role_name ?? '')) {
    return <Navigate to="/403" replace />;
  }
  return <>{children}</>;
}
