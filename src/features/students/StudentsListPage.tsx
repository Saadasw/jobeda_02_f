import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { Group, Pagination, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { listStudents } from './api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/date';

const PAGE_SIZE = 20;

export function StudentsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['students', { page, search: debouncedSearch }],
    queryFn: () =>
      listStudents({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
    placeholderData: keepPreviousData,
  });

  return (
    <Stack gap="md">
      <Title order={2}>Students</Title>

      <TextInput
        placeholder="Search by name…"
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setPage(1);
        }}
        w={320}
      />

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {query.data && (
          <>
            <Table.ScrollContainer minWidth={640}>
              <Table highlightOnHover striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Class</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Total Fee</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Paid</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Due</Table.Th>
                    <Table.Th>Last Payment</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {query.data.data.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No students found.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    query.data.data.map((s) => (
                      <Table.Tr
                        key={s.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/students/${s.id}`)}
                      >
                        <Table.Td>{s.name}</Table.Td>
                        <Table.Td>{s.class ?? '—'}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatMoney(s.total_fee)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatMoney(s.total_paid)}</Table.Td>
                        <Table.Td
                          style={{ textAlign: 'right' }}
                          c={Number(s.due) > 0 ? 'red.7' : undefined}
                          fw={Number(s.due) > 0 ? 600 : undefined}
                        >
                          {formatMoney(s.due)}
                        </Table.Td>
                        <Table.Td>{formatDate(s.last_payment_date)}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {query.data.total} student{query.data.total === 1 ? '' : 's'}
              </Text>
              {query.data.total_pages > 1 && (
                <Pagination value={page} onChange={setPage} total={query.data.total_pages} size="sm" />
              )}
            </Group>
          </>
        )}
      </AsyncBoundary>
    </Stack>
  );
}
