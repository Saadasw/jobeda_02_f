import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Card, Center, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginRequest } from '@/auth/api';
import { useAuthStore } from '@/auth/authStore';
import { normalizeError } from '@/api/errors';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  tenant_slug: z.string().min(1, 'Madrasa is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', tenant_slug: '' },
  });

  // Already signed in → skip the login screen.
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      const data = await loginRequest(values);
      setSession(data.access_token, data.user);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      const norm = normalizeError(err);
      let mappedToField = false;
      for (const fe of norm.fieldErrors) {
        if (fe.field === 'email' || fe.field === 'password') {
          setError(fe.field, { message: fe.message });
          mappedToField = true;
        }
      }
      // 401 (bad creds), 403 (locked/deactivated), 400 (multi-tenant email), etc.
      if (!mappedToField) {
        setFormError(norm.message);
      }
    }
  };

  return (
    <Center mih="100vh" p="md">
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: 400 }} noValidate>
        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack>
            <Title order={3} ta="center">
              Sign in
            </Title>
            {formError && (
              <Alert color="red" variant="light">
                {formError}
              </Alert>
            )}
            <TextInput
              label="Email"
              placeholder="owner@jobeda.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <TextInput
              label="Madrasa (tenant slug)"
              placeholder="jobeda"
              error={errors.tenant_slug?.message}
              {...register('tenant_slug')}
            />
            <Button type="submit" fullWidth loading={isSubmitting}>
              Sign in
            </Button>
          </Stack>
        </Card>
      </form>
    </Center>
  );
}
