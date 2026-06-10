import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  createFeeGroup,
  deleteFeeGroup,
  listFeeGroups,
  updateFeeGroup,
  type FeeGroup,
} from './api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { normalizeError } from '@/api/errors';

export function FeeGroupsPage() {
  const queryClient = useQueryClient();
  const groups = useQuery({ queryKey: ['fee-groups'], queryFn: listFeeGroups });

  const [opened, handlers] = useDisclosure(false);
  const [editing, setEditing] = useState<FeeGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function openCreate() {
    setEditing(null);
    setName('');
    setDescription('');
    handlers.open();
  }
  function openEdit(g: FeeGroup) {
    setEditing(g);
    setName(g.name);
    setDescription(g.description ?? '');
    handlers.open();
  }

  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateFeeGroup(editing.id, { name, description })
        : createFeeGroup({ name, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-groups'] });
      handlers.close();
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteFeeGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fee-groups'] }),
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Fee groups</Title>
        <Button onClick={openCreate}>＋ Add group</Button>
      </Group>
      <Text c="dimmed" size="sm">
        A student's fee profile. Price lists (fee structures) are defined per class × group.
      </Text>

      <AsyncBoundary
        isLoading={groups.isLoading}
        isError={groups.isError}
        error={groups.error}
        onRetry={() => groups.refetch()}
      >
        {groups.data && (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groups.data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text c="dimmed" ta="center" py="md">No fee groups yet.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                groups.data.map((g) => (
                  <Table.Tr key={g.id}>
                    <Table.Td>{g.name}</Table.Td>
                    <Table.Td>{g.description ?? '—'}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="flex-end">
                        <Button size="xs" variant="subtle" onClick={() => openEdit(g)}>Edit</Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => remove.mutate(g.id)}
                          loading={remove.isPending && remove.variables === g.id}
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

      <Modal opened={opened} onClose={handlers.close} title={editing ? 'Edit fee group' : 'Add fee group'} centered>
        <Stack>
          {save.isError && <Alert color="red" variant="light">{normalizeError(save.error).message}</Alert>}
          <TextInput label="Name" placeholder="e.g. Residential" value={name} onChange={(e) => setName(e.currentTarget.value)} withAsterisk />
          <Textarea label="Description" placeholder="Optional" value={description} onChange={(e) => setDescription(e.currentTarget.value)} autosize minRows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={handlers.close}>Cancel</Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!name.trim()}>
              {editing ? 'Save' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
