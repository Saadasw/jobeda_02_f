import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { NotFoundPage } from '@/components/NotFoundPage';
import { ForbiddenPage } from '@/components/ForbiddenPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { StudentsListPage } from '@/features/students/StudentsListPage';
import { StudentDetailPage } from '@/features/students/StudentDetailPage';
import { ProtectedRoute, RoleRoute } from '@/auth/guards';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <RoleRoute roles={['owner', 'admin']}>
            <DashboardPage />
          </RoleRoute>
        ),
      },
      { path: 'students', element: <StudentsListPage /> },
      { path: 'students/:id', element: <StudentDetailPage /> },
      // More role-gated feature routes are added as modules land.
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
