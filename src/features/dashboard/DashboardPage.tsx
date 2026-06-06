import { Box, Card, Group, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getOverdueAging, type AgingBucket } from './api';
import { StatCard } from '@/components/StatCard';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';

// Escalating colors for older aging buckets.
const AGING_COLORS = ['yellow.6', 'orange.6', 'red.6', 'red.8'];

export function DashboardPage() {
  const summary = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary });
  const aging = useQuery({ queryKey: ['overdue-aging'], queryFn: getOverdueAging });

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>

      <AsyncBoundary
        isLoading={summary.isLoading}
        isError={summary.isError}
        error={summary.error}
        onRetry={() => summary.refetch()}
      >
        {summary.data && (
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
            <StatCard
              label="Today's Collection"
              value={formatMoney(summary.data.today_collection)}
              accent="teal.7"
            />
            <StatCard
              label="Today's Expense"
              value={formatMoney(summary.data.today_expense)}
              accent="orange.7"
            />
            <StatCard
              label="Total Due"
              value={formatMoney(summary.data.total_due)}
              accent="red.7"
            />
            <StatCard
              label="Cash in Hand"
              value={formatMoney(summary.data.cash_balance)}
              accent={summary.data.cash_balance < 0 ? 'red.7' : 'teal.7'}
              hint={summary.data.cash_balance < 0 ? 'Overdrawn' : undefined}
            />
            <StatCard label="Students" value={String(summary.data.total_students)} />
            <StatCard label="Employees" value={String(summary.data.total_employees)} />
            <StatCard label="Pending Payments" value={String(summary.data.pending_payments)} />
          </SimpleGrid>
        )}
      </AsyncBoundary>

      <Card withBorder radius="md" padding="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Overdue fees (aging)</Title>
          {aging.data && (
            <Text fw={600}>Total: {formatMoney(totalOverdue(aging.data.buckets))}</Text>
          )}
        </Group>
        <AsyncBoundary
          isLoading={aging.isLoading}
          isError={aging.isError}
          error={aging.error}
          onRetry={() => aging.refetch()}
        >
          {aging.data && <AgingBars buckets={aging.data.buckets} />}
        </AsyncBoundary>
      </Card>
    </Stack>
  );
}

function totalOverdue(buckets: AgingBucket[]): number {
  return buckets.reduce((sum, b) => sum + b.overdue_amount, 0);
}

function AgingBars({ buckets }: { buckets: AgingBucket[] }) {
  if (buckets.length === 0 || buckets.every((b) => b.overdue_amount === 0)) {
    return (
      <Text c="dimmed" size="sm">
        No overdue fees.
      </Text>
    );
  }
  const max = Math.max(1, ...buckets.map((b) => b.overdue_amount));

  return (
    <Stack gap="sm">
      {buckets.map((b, i) => (
        <Box key={b.bucket}>
          <Group justify="space-between" mb={4}>
            <Text size="sm">{b.bucket}</Text>
            <Text size="sm" c="dimmed">
              {formatMoney(b.overdue_amount)} · {b.fee_count} {b.fee_count === 1 ? 'fee' : 'fees'}
            </Text>
          </Group>
          <Progress
            value={(b.overdue_amount / max) * 100}
            color={AGING_COLORS[i] ?? 'red.8'}
            size="lg"
            radius="sm"
          />
        </Box>
      ))}
    </Stack>
  );
}
