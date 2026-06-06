import { Anchor, Badge, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getStudent, getStudentFeeDetails, getStudentSummary } from './api';
import { StatCard } from '@/components/StatCard';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatMonth } from '@/lib/date';

function statusColor(status: string | null | undefined): string {
  switch (status) {
    case 'paid':
      return 'teal';
    case 'partial':
      return 'yellow';
    case 'unpaid':
    case 'overdue':
      return 'red';
    default:
      return 'gray';
  }
}

export function StudentDetailPage() {
  const { id } = useParams();
  const studentId = Number(id);
  const enabled = Number.isFinite(studentId);

  const student = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled,
  });
  const summary = useQuery({
    queryKey: ['student-summary', studentId],
    queryFn: () => getStudentSummary(studentId),
    enabled,
  });
  const fees = useQuery({
    queryKey: ['student-fees', studentId],
    queryFn: () => getStudentFeeDetails(studentId, { limit: 100 }),
    enabled,
  });

  return (
    <Stack gap="lg">
      <Anchor component={Link} to="/students" size="sm">
        ← Back to students
      </Anchor>

      <AsyncBoundary
        isLoading={student.isLoading}
        isError={student.isError}
        error={student.error}
        onRetry={() => student.refetch()}
      >
        {student.data && (
          <div>
            <Title order={2}>{student.data.name}</Title>
            <Text c="dimmed">{student.data.class ?? '—'}</Text>
          </div>
        )}
      </AsyncBoundary>

      <AsyncBoundary
        isLoading={summary.isLoading}
        isError={summary.isError}
        error={summary.error}
        onRetry={() => summary.refetch()}
      >
        {summary.data && (
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <StatCard label="Total Fee" value={formatMoney(summary.data.total_fee)} />
            <StatCard label="Paid" value={formatMoney(summary.data.total_paid)} accent="teal.7" />
            <StatCard
              label="Due"
              value={formatMoney(summary.data.due)}
              accent={Number(summary.data.due) > 0 ? 'red.7' : undefined}
            />
            <StatCard label="Advance" value={formatMoney(summary.data.advance)} />
          </SimpleGrid>
        )}
      </AsyncBoundary>

      <div>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Fees</Title>
        </Group>
        <AsyncBoundary
          isLoading={fees.isLoading}
          isError={fees.isError}
          error={fees.error}
          onRetry={() => fees.refetch()}
        >
          {fees.data && (
            <Table.ScrollContainer minWidth={640}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Month</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Net</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Paid</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Due</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {fees.data.data.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No fees assigned.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    fees.data.data.map((f) => (
                      <Table.Tr key={f.fee_id}>
                        <Table.Td>{formatMonth(f.month)}</Table.Td>
                        <Table.Td>{f.fee_type_name ?? '—'}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatMoney(f.net_amount)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatMoney(f.paid)}</Table.Td>
                        <Table.Td
                          style={{ textAlign: 'right' }}
                          c={Number(f.due) > 0 ? 'red.7' : undefined}
                        >
                          {formatMoney(f.due)}
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={statusColor(f.status)}>
                            {f.status ?? '—'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </AsyncBoundary>
      </div>
    </Stack>
  );
}
