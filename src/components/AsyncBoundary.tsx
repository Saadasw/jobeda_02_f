import type { ReactNode } from 'react';
import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { normalizeError } from '@/api/errors';

interface AsyncBoundaryProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Optional custom loading state (defaults to a centered spinner). */
  loading?: ReactNode;
  children: ReactNode;
}

/** Consistent loading / error+retry / content wrapper for data views. */
export function AsyncBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  loading,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return (
      <>
        {loading ?? (
          <Center p="xl">
            <Loader />
          </Center>
        )}
      </>
    );
  }

  if (isError) {
    return (
      <Alert color="red" variant="light" title="Couldn't load data">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{normalizeError(error).message}</Text>
          {onRetry && (
            <Button size="xs" variant="light" color="red" onClick={onRetry}>
              Retry
            </Button>
          )}
        </Stack>
      </Alert>
    );
  }

  return <>{children}</>;
}
