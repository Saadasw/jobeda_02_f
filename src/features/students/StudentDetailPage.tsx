import { Anchor, Badge, Button, Group, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getStudent, getStudentFeeDetails, getStudentSummary, updateStudent } from './api';
import { StudentPaymentsTable } from './StudentPaymentsTable';
import { getGuardian } from '@/features/guardians/api';
import { listFeeGroups } from '@/features/fees/api';
import { StatCard } from '@/components/StatCard';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatDate, formatMonth } from '@/lib/date';
import { useAuthStore } from '@/auth/authStore';
import { TakePaymentModal } from '@/features/payments/TakePaymentModal';

const COLLECT_ROLES = ['owner', 'admin', 'accountant'];

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

function titleCase(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </div>
  );
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
  const guardianId = student.data?.guardian_id ?? null;
  const guardian = useQuery({
    queryKey: ['guardian', guardianId],
    queryFn: () => getGuardian(guardianId as number),
    enabled: guardianId != null,
  });
  const feeGroups = useQuery({ queryKey: ['fee-groups'], queryFn: listFeeGroups });
  const queryClient = useQueryClient();
  const updateGroup = useMutation({
    mutationFn: (fee_group_id: number) => updateStudent(studentId, { fee_group_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const [payOpened, payHandlers] = useDisclosure(false);
  const role = useAuthStore((s) => s.user?.role_name);
  const canCollect = COLLECT_ROLES.includes(role ?? '');
  const due = Number(summary.data?.due ?? 0);

  const d = student.data;
  const subtitle = d
    ? [
        d.registration_no ? `Reg ${d.registration_no}` : null,
        d.class,
        d.section ? `Section ${d.section}` : null,
        d.roll_no != null ? `Roll ${d.roll_no}` : null,
      ]
        .filter(Boolean)
        .join('  ·  ')
    : '';
  const guardianText = guardianId == null
    ? '—'
    : guardian.data
      ? guardian.data.phone
        ? `${guardian.data.name} · ${guardian.data.phone}`
        : guardian.data.name
      : 'Loading…';

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
        {d && (
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2}>{d.name}</Title>
                <Text c="dimmed">{subtitle || '—'}</Text>
              </div>
              {canCollect && <Button onClick={payHandlers.open}>Take Payment</Button>}
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              <Info label="Date of birth" value={formatDate(d.date_of_birth)} />
              <Info label="Gender" value={titleCase(d.gender)} />
              <Info label="Admission date" value={formatDate(d.admission_date)} />
              <Info label="Guardian" value={guardianText} />
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Fee group
                </Text>
                {canCollect ? (
                  <Select
                    data={(feeGroups.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
                    value={d.fee_group_id ? String(d.fee_group_id) : null}
                    onChange={(v) => v && updateGroup.mutate(Number(v))}
                    placeholder="Set group"
                    size="xs"
                    allowDeselect={false}
                    disabled={updateGroup.isPending}
                    mt={2}
                  />
                ) : (
                  <Text size="sm">
                    {(feeGroups.data ?? []).find((g) => g.id === d.fee_group_id)?.name ?? '—'}
                  </Text>
                )}
              </div>
              <Info label="Address" value={d.address || '—'} />
            </SimpleGrid>
          </Stack>
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
        <Title order={4} mb="sm">
          Fees
        </Title>
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

      <div>
        <Title order={4} mb="sm">
          Payments
        </Title>
        <StudentPaymentsTable studentId={studentId} />
      </div>

      {canCollect && d && (
        <TakePaymentModal
          opened={payOpened}
          onClose={payHandlers.close}
          studentId={studentId}
          studentName={d.name}
          due={due}
        />
      )}
    </Stack>
  );
}
