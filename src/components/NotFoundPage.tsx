import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Title order={1}>404</Title>
        <Text c="dimmed">This page does not exist.</Text>
        <Button component={Link} to="/">
          Go home
        </Button>
      </Stack>
    </Container>
  );
}
