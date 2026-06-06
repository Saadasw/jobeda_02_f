import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Title order={1}>403</Title>
        <Text c="dimmed">You don&apos;t have access to this page.</Text>
        <Button component={Link} to="/dashboard">
          Back to dashboard
        </Button>
      </Stack>
    </Container>
  );
}
