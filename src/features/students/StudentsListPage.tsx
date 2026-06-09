import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import {
  Button,
  Group,
  Pagination,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ENROLLMENT_STATUSES, listStudents } from './api';
import { AddStudentModal } from './AddStudentModal';
import { listClasses, listSections } from '@/features/academic/api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { useAuthStore } from '@/auth/authStore';

const PAGE_SIZE = 20;
const MANAGE_ROLES = ['owner', 'admin'];

const STATUS_OPTIONS = ENROLLMENT_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export function StudentsListPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role_name);
  const canManage = MANAGE_ROLES.includes(role ?? '');
  const [addOpened, addHandlers] = useDisclosure(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [classId, setClassId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [hasDues, setHasDues] = useState(false);
  const [page, setPage] = useState(1);

  const classes = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const sections = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => listSections(Number(classId)),
    enabled: !!classId,
  });

  const query = useQuery({
    queryKey: ['students', { page, search: debouncedSearch, classId, sectionId, status, hasDues }],
    queryFn: () =>
      listStudents({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        class_id: classId ? Number(classId) : undefined,
        section_id: sectionId ? Number(sectionId) : undefined,
        status: status || undefined,
        has_dues: hasDues || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  function resetPage() {
    setPage(1);
  }

  const classOptions = (classes.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));
  const sectionOptions = (sections.data ?? []).map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Students</Title>
        {canManage && <Button onClick={addHandlers.open}>＋ Admit student</Button>}
      </Group>

      <Group gap="sm" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Name…"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            resetPage();
          }}
          w={220}
        />
        <Select
          label="Class"
          placeholder="All classes"
          data={classOptions}
          value={classId}
          onChange={(v) => {
            setClassId(v);
            setSectionId(null);
            resetPage();
          }}
          searchable
          clearable
          w={180}
        />
        <Select
          label="Section"
          placeholder={classId ? 'All sections' : 'Pick class'}
          data={sectionOptions}
          value={sectionId}
          onChange={(v) => {
            setSectionId(v);
            resetPage();
          }}
          disabled={!classId}
          clearable
          w={150}
        />
        <Select
          label="Status"
          placeholder="Any"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          clearable
          w={150}
        />
        <Switch
          label="Has dues"
          checked={hasDues}
          onChange={(e) => {
            setHasDues(e.currentTarget.checked);
            resetPage();
          }}
          mb={8}
        />
      </Group>

      <AsyncBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {query.data && (
          <>
            <Table.ScrollContainer minWidth={900}>
              <Table highlightOnHover striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Reg No</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Class</Table.Th>
                    <Table.Th>Section</Table.Th>
                    <Table.Th>Roll</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Total Fee</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Paid</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Due</Table.Th>
                    <Table.Th>Last Payment</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {query.data.data.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={9}>
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
                        <Table.Td>{s.registration_no ?? '—'}</Table.Td>
                        <Table.Td>{s.name}</Table.Td>
                        <Table.Td>{s.class ?? '—'}</Table.Td>
                        <Table.Td>{s.section ?? '—'}</Table.Td>
                        <Table.Td>{s.roll_no ?? '—'}</Table.Td>
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

      {canManage && <AddStudentModal opened={addOpened} onClose={addHandlers.close} />}
    </Stack>
  );
}
