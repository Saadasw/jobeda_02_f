import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  ACCOUNT_TYPES,
  createAccount,
  isProtectedAccount,
  listAccounts,
  updateAccount,
  type Account,
} from './api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { normalizeError } from '@/api/errors';

const TYPE_LABEL: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};
const TYPE_OPTIONS = ACCOUNT_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

export function AccountsPage() {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });

  const [opened, handlers] = useDisclosure(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('revenue');

  function openCreate() {
    setEditing(null);
    setName('');
    setType('revenue');
    handlers.open();
  }
  function openEdit(a: Account) {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    handlers.open();
  }

  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateAccount(editing.id, { name: name.trim() }) // rename only — type is locked after creation
        : createAccount({ name: name.trim(), type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      handlers.close();
    },
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Accounts</Title>
        <Button onClick={openCreate}>＋ Add account</Button>
      </Group>
      <Text c="dimmed" size="sm">
        Your chart of accounts — the ledger buckets money is sorted into. Add a revenue account (e.g.
        “Meals Income”) so a fee type can credit it directly. <b>System accounts</b> used by automatic
        journal posting are locked.
      </Text>

      <AsyncBoundary
        isLoading={accounts.isLoading}
        isError={accounts.isError}
        error={accounts.error}
        onRetry={() => accounts.refetch()}
      >
        {accounts.data && (
          <Stack gap="lg">
            {ACCOUNT_TYPES.map((t) => {
              const rows = accounts.data.filter((a) => a.type === t);
              if (rows.length === 0) return null;
              return (
                <div key={t}>
                  <Text fw={600} mb={4}>
                    {TYPE_LABEL[t]}{' '}
                    <Text span c="dimmed" size="sm">
                      ({rows.length})
                    </Text>
                  </Text>
                  <Paper withBorder radius="md">
                    <Table verticalSpacing="sm">
                      <Table.Tbody>
                        {rows.map((a) => {
                          const locked = isProtectedAccount(a.name);
                          return (
                            <Table.Tr key={a.id}>
                              <Table.Td>
                                {a.name}
                                {a.is_active === false && (
                                  <Badge ml="sm" size="xs" color="gray" variant="light">
                                    Inactive
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>
                                {locked ? (
                                  <Badge size="xs" variant="light" color="gray">
                                    System
                                  </Badge>
                                ) : (
                                  <Button size="compact-xs" variant="subtle" onClick={() => openEdit(a)}>
                                    Rename
                                  </Button>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </div>
              );
            })}
          </Stack>
        )}
      </AsyncBoundary>

      <Modal opened={opened} onClose={handlers.close} title={editing ? 'Rename account' : 'Add account'} centered>
        <Stack>
          {save.isError && <Alert color="red" variant="light">{normalizeError(save.error).message}</Alert>}
          <TextInput
            label="Account name"
            placeholder="e.g. Meals Income"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            withAsterisk
          />
          <Select
            label="Type"
            data={TYPE_OPTIONS}
            value={type}
            onChange={(v) => setType(v ?? 'revenue')}
            allowDeselect={false}
            disabled={!!editing}
            description={editing ? "Type can't be changed after creation" : undefined}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handlers.close}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!name.trim()}>
              {editing ? 'Save' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
