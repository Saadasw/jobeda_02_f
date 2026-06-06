import { Card, Text, Title } from '@mantine/core';

interface StatCardProps {
  label: string;
  value: string;
  /** Mantine color token for the value, e.g. "teal.7", "red.7". */
  accent?: string;
  hint?: string;
}

export function StatCard({ label, value, accent, hint }: StatCardProps) {
  return (
    <Card withBorder radius="md" padding="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Title order={3} mt={4} c={accent}>
        {value}
      </Title>
      {hint && (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      )}
    </Card>
  );
}
