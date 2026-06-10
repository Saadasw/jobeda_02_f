import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@mantine/hooks';
import {
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  addItem,
  createStructure,
  deleteItem,
  deleteStructure,
  listFeeGroups,
  listFeeTypes,
  listStructures,
  STRUCTURE_FREQUENCIES,
  type FeeGroup,
  type FeeStructure,
  type FeeType,
} from './api';
import { GenerateFeesModal } from './GenerateFeesModal';
import { listAcademicYears, listClasses } from '@/features/academic/api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';

const FREQ_OPTIONS = STRUCTURE_FREQUENCIES.map((f) => ({
  value: f,
  label: f.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
}));

function GroupStructureCard({
  yearId,
  classId,
  group,
  structure,
  feeTypes,
}: {
  yearId: number;
  classId: number;
  group: FeeGroup;
  structure?: FeeStructure;
  feeTypes: FeeType[];
}) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fee-structures', String(yearId), String(classId)] });

  const [ftId, setFtId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [freq, setFreq] = useState<string>('monthly');
  const [due, setDue] = useState<number | ''>('');

  const create = useMutation({
    mutationFn: () => createStructure({ academic_year_id: yearId, class_id: classId, fee_group_id: group.id }),
    onSuccess: invalidate,
  });
  const delStruct = useMutation({
    mutationFn: () => deleteStructure(structure!.id),
    onSuccess: invalidate,
  });
  const add = useMutation({
    mutationFn: () =>
      addItem(structure!.id, {
        fee_type_id: Number(ftId),
        amount,
        frequency: freq,
        due_day: due === '' ? undefined : Number(due),
      }),
    onSuccess: () => {
      setFtId(null);
      setAmount(0);
      setFreq('monthly');
      setDue('');
      invalidate();
    },
  });
  const delItem = useMutation({
    mutationFn: (itemId: number) => deleteItem(structure!.id, itemId),
    onSuccess: invalidate,
  });

  const usedTypeIds = new Set((structure?.items ?? []).map((i) => i.fee_type_id));
  const ftOptions = feeTypes
    .filter((f) => !usedTypeIds.has(f.id))
    .map((f) => ({ value: String(f.id), label: f.name ?? `#${f.id}` }));
  const monthlyTotal = (structure?.items ?? [])
    .filter((i) => i.frequency === 'monthly')
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="sm">
        <div>
          <Text fw={600}>{group.name}</Text>
          {structure && (
            <Text size="xs" c="dimmed">
              {structure.items.length} item{structure.items.length === 1 ? '' : 's'} · {formatMoney(monthlyTotal)}/mo
            </Text>
          )}
        </div>
        {structure ? (
          <Button size="xs" variant="subtle" color="red" onClick={() => delStruct.mutate()} loading={delStruct.isPending}>
            Delete price list
          </Button>
        ) : (
          <Button size="xs" variant="light" onClick={() => create.mutate()} loading={create.isPending}>
            ＋ Create price list
          </Button>
        )}
      </Group>

      {structure && (
        <Table verticalSpacing="xs" withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fee type</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
              <Table.Th>Frequency</Table.Th>
              <Table.Th>Due day</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {structure.items.map((it) => (
              <Table.Tr key={it.id}>
                <Table.Td>{it.fee_type_name ?? `#${it.fee_type_id}`}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>{formatMoney(it.amount)}</Table.Td>
                <Table.Td tt="capitalize">{(it.frequency ?? '').replace('_', ' ')}</Table.Td>
                <Table.Td>{it.due_day ?? '—'}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Button size="compact-xs" variant="subtle" color="red" onClick={() => delItem.mutate(it.id)}>
                    Remove
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {structure.items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" py="xs">No items yet — add one below.</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {/* add-item row */}
            <Table.Tr>
              <Table.Td>
                <Select
                  placeholder="Fee type"
                  data={ftOptions}
                  value={ftId}
                  onChange={setFtId}
                  searchable
                  size="xs"
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  placeholder="Amount"
                  value={amount}
                  onChange={(v) => setAmount(typeof v === 'number' ? v : Number(v) || 0)}
                  min={0}
                  thousandSeparator=","
                  allowNegative={false}
                  size="xs"
                />
              </Table.Td>
              <Table.Td>
                <Select data={FREQ_OPTIONS} value={freq} onChange={(v) => setFreq(v ?? 'monthly')} size="xs" allowDeselect={false} />
              </Table.Td>
              <Table.Td>
                <NumberInput placeholder="1–28" value={due} onChange={(v) => setDue(v === '' ? '' : Number(v))} min={1} max={28} size="xs" />
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Button size="compact-xs" onClick={() => add.mutate()} loading={add.isPending} disabled={!ftId || !(amount >= 0)}>
                  Add
                </Button>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}

export function FeeStructuresPage() {
  const years = useQuery({ queryKey: ['academic-years'], queryFn: listAcademicYears });
  const classes = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const feeTypes = useQuery({ queryKey: ['fee-types'], queryFn: listFeeTypes });
  const groups = useQuery({ queryKey: ['fee-groups'], queryFn: listFeeGroups });

  const [yearId, setYearId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [genOpened, genHandlers] = useDisclosure(false);

  useEffect(() => {
    if (!yearId && years.data) {
      const cur = years.data.find((y) => y.is_current) ?? years.data[0];
      if (cur) setYearId(String(cur.id));
    }
  }, [years.data, yearId]);

  const structures = useQuery({
    queryKey: ['fee-structures', yearId, classId],
    queryFn: () => listStructures({ academic_year_id: Number(yearId), class_id: Number(classId) }),
    enabled: !!yearId && !!classId,
  });

  const yearOptions = (years.data ?? []).map((y) => ({ value: String(y.id), label: y.is_current ? `${y.name} (current)` : y.name }));
  const classOptions = (classes.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Fee structures</Title>
        <Button onClick={genHandlers.open}>Generate fees</Button>
      </Group>

      <Group>
        <Select label="Academic year" data={yearOptions} value={yearId} onChange={setYearId} w={180} />
        <Select
          label="Class"
          placeholder="Select a class"
          data={classOptions}
          value={classId}
          onChange={setClassId}
          searchable
          clearable
          w={220}
        />
      </Group>

      {!classId ? (
        <Text c="dimmed">Select a class to set up its price lists (one per fee group).</Text>
      ) : (
        <AsyncBoundary
          isLoading={structures.isLoading || groups.isLoading || feeTypes.isLoading}
          isError={structures.isError}
          error={structures.error}
          onRetry={() => structures.refetch()}
        >
          {structures.data && groups.data && feeTypes.data && (
            <Stack gap="md">
              {groups.data.map((g) => (
                <GroupStructureCard
                  key={g.id}
                  yearId={Number(yearId)}
                  classId={Number(classId)}
                  group={g}
                  structure={structures.data.find((s) => s.fee_group_id === g.id)}
                  feeTypes={feeTypes.data}
                />
              ))}
            </Stack>
          )}
        </AsyncBoundary>
      )}

      <GenerateFeesModal
        opened={genOpened}
        onClose={genHandlers.close}
        defaultYearId={yearId ? Number(yearId) : null}
        defaultClassId={classId ? Number(classId) : null}
      />
    </Stack>
  );
}
