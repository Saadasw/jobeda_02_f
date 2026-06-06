import { Button, Card, Center, PasswordInput, Stack, TextInput, Title } from '@mantine/core';

// Placeholder UI for the foundation milestone. The form is wired to the
// /auth/login flow (validation, token rotation, redirect) in the auth milestone.
export function LoginPage() {
  return (
    <Center mih="100vh" p="md">
      <Card withBorder shadow="sm" radius="md" w={380} p="lg">
        <Stack>
          <Title order={3} ta="center">
            Sign in
          </Title>
          <TextInput label="Email" placeholder="owner@jobeda.com" />
          <PasswordInput label="Password" placeholder="••••••••" />
          <TextInput label="Madrasa (tenant slug)" placeholder="jobeda" />
          <Button fullWidth disabled>
            Sign in
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
