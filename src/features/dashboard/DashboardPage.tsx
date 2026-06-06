import { Stack, Text, Title } from '@mantine/core';

export function DashboardPage() {
  return (
    <Stack>
      <Title order={2}>Dashboard</Title>
      <Text c="dimmed">
        Foundation scaffold is live. KPI cards (today&apos;s collection, dues, cash balance) land
        in the next milestone.
      </Text>
    </Stack>
  );
}
