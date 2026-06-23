import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  createFeeType,
  deleteFeeType,
  FEE_TYPE_FREQUENCIES,
  listFeeTypes,
  updateFeeType,
  type FeeType,
} from './api';
import { listAccounts } from '@/features/accounts/api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { normalizeError } from '@/api/errors';

const FREQ_OPTIONS = FEE_TYPE_FREQUENCIES.map((f) => ({
  value: f,
  label: f.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
}));
// monthly/termly/annual recur; one_time/adhoc don't (keeps the legacy is_recurring flag correct).
const RECURRING = new Set(['monthly', 'termly', 'annual']);

export function FeeTypesPage() {
  const queryClient = useQueryClient();
  const feeTypes = useQuery({ queryKey: ['fee-types'], queryFn: listFeeTypes });
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });

  const [opened, handlers] = useDisclosure(false);
  const [editing, setEditing] = useState<FeeType | null>(null);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FeeType | null>(null);

  const revenueAccounts = (accounts.data ?? []).filter((a) => a.type === 'revenue');
  const accountName = (id: number | null) =>
    (accounts.data ?? []).find((a) => a.id === id)?.name ?? '—';

  function openCreate() {
    setEditing(null);
    setName('');
    setFrequency('monthly');
    setAccountId(null);
    handlers.open();
  }
  function openEdit(ft: FeeType) {
    setEditing(ft);
    setName(ft.name ?? '');
    setFrequency(ft.frequency ?? 'monthly');
    setAccountId(ft.account_id ? String(ft.account_id) : null);
    handlers.open();
  }

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        frequency,
        account_id: Number(accountId),
        is_recurring: RECURRING.has(frequency),
      };
      return editing ? updateFeeType(editing.id, body) : createFeeType(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      handlers.close();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteFeeType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      setDeleting(null);
    },
  });

  const canSave = !!name.trim() && !!accountId;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Fee types</Title>
        <Button onClick={openCreate}>＋ Add fee type</Button>
      </Group>
      <Text c="dimmed" size="sm">
        The catalogue of fees (Tuition, Hostel, Meals…). Each credits a revenue account when billed,
        and a frequency that the structure editor and generation use.
      </Text>

      <AsyncBoundary
        isLoading={feeTypes.isLoading || accounts.isLoading}
        isError={feeTypes.isError}
        error={feeTypes.error}
        onRetry={() => feeTypes.refetch()}
      >
        {feeTypes.data && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Frequency</Table.Th>
                <Table.Th>Income account</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {feeTypes.data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center" py="md">No fee types yet.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                feeTypes.data.map((ft) => (
                  <Table.Tr key={ft.id}>
                    <Table.Td>{ft.name ?? '—'}</Table.Td>
                    <Table.Td tt="capitalize">{(ft.frequency ?? '—').replace('_', ' ')}</Table.Td>
                    <Table.Td>{accountName(ft.account_id)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <Button size="xs" variant="subtle" onClick={() => openEdit(ft)}>Edit</Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            remove.reset();
                            setDeleting(ft);
                          }}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        )}
      </AsyncBoundary>

      <Modal opened={opened} onClose={handlers.close} title={editing ? 'Edit fee type' : 'Add fee type'} centered>
        <Stack>
          {save.isError && <Alert color="red" variant="light">{normalizeError(save.error).message}</Alert>}
          <TextInput label="Name" placeholder="e.g. Meals" value={name} onChange={(e) => setName(e.currentTarget.value)} withAsterisk />
          <Select label="Frequency" data={FREQ_OPTIONS} value={frequency} onChange={(v) => setFrequency(v ?? 'monthly')} allowDeselect={false} />
          <Select
            label="Income account"
            placeholder={accounts.isLoading ? 'Loading…' : 'Select revenue account'}
            description="The revenue account credited when this fee is billed"
            data={revenueAccounts.map((a) => ({ value: String(a.id), label: a.name }))}
            value={accountId}
            onChange={setAccountId}
            searchable
            withAsterisk
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handlers.close}>Cancel</Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!canSave}>
              {editing ? 'Save' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={!!deleting} onClose={() => setDeleting(null)} title="Delete fee type" centered>
        <Stack>
          {remove.isError && <Alert color="red" variant="light">{normalizeError(remove.error).message}</Alert>}
          <Text size="sm">
            Delete fee type “{deleting?.name}”? It will be hidden from new price lists and billing.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button color="red" loading={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
