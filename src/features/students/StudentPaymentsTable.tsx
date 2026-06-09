import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Badge, Button, Group, Select, Table, Text, TextInput } from '@mantine/core';
import { getStudentPayments } from './api';
import { PAYMENT_METHODS } from '@/features/payments/api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/date';

interface Props {
  studentId: number;
}

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

function statusColor(status: string | null): string {
  switch (status) {
    case 'completed':
      return 'teal';
    case 'pending':
      return 'yellow';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

export function StudentPaymentsTable({ studentId }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [method, setMethod] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['student-payments', studentId, { from, to, method, status }],
    queryFn: () =>
      getStudentPayments(studentId, {
        limit: 100,
        from: from || undefined,
        to: to || undefined,
        method: method || undefined,
        status: status || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const hasFilters = !!(from || to || method || status);
  function clearFilters() {
    setFrom('');
    setTo('');
    setMethod(null);
    setStatus(null);
  }

  return (
    <div>
      <Group gap="sm" mb="sm" align="flex-end">
        <TextInput
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.currentTarget.value)}
          w={150}
        />
        <TextInput
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.currentTarget.value)}
          w={150}
        />
        <Select
          label="Method"
          placeholder="Any"
          data={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
          value={method}
          onChange={setMethod}
          clearable
          w={170}
        />
        <Select
          label="Status"
          placeholder="Any"
          data={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          clearable
          w={150}
        />
        {hasFilters && (
          <Button variant="subtle" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </Group>

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {query.data && (
          <Table.ScrollContainer minWidth={640}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Receipt</Table.Th>
                  <Table.Th>Method</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {query.data.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text c="dimmed" ta="center" py="md">
                        {hasFilters ? 'No payments match these filters.' : 'No payments yet.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  query.data.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{formatDate(p.date)}</Table.Td>
                      <Table.Td>{p.receipt_no ?? '—'}</Table.Td>
                      <Table.Td tt="capitalize">{p.method ?? '—'}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>{formatMoney(p.amount)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={statusColor(p.status)} tt="capitalize">
                          {p.status ?? '—'}
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
  );
}
