import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { listAccounts } from '@/features/accounts/api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { formatMoney } from '@/lib/money';
import { formatDate, todayISODate } from '@/lib/date';
import { normalizeError } from '@/api/errors';

export interface MoneyEntry {
  id: number;
  account_id: number;
  amount: number | string;
  date: string;
  description: string | null;
}
export interface MoneyCreate {
  account_id: number;
  amount: number;
  date: string;
  description?: string;
}
export interface MoneyListParams {
  from?: string;
  to?: string;
  limit?: number;
}

interface Props {
  /** "Expenses" / "Income" (plural, for the title). */
  title: string;
  /** "expense" / "income" (singular, for buttons). */
  noun: string;
  blurb: string;
  accountType: 'expense' | 'revenue';
  accountLabel: string;
  amountColor: string;
  queryKey: string;
  list: (params: MoneyListParams) => Promise<MoneyEntry[]>;
  create: (b: MoneyCreate) => Promise<MoneyEntry>;
}

// ─── Date-range presets ──────────────────────────────────────────────────────
const PRESET_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];
const PERIOD_LABEL: Record<string, string> = {
  this_month: 'this month',
  last_month: 'last month',
  this_year: 'this year',
  all: 'all time',
  custom: 'selected range',
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Range for the calendar month `monthsAgo` before the current one (0 = this month). */
function monthRange(monthsAgo: number): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0); // last day of that month
  return { from: ymd(from), to: ymd(to) };
}

export function MoneyEntryPage({
  title,
  noun,
  blurb,
  accountType,
  accountLabel,
  amountColor,
  queryKey,
  list,
  create,
}: Props) {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });

  // Filter state — default to the current month (a transaction log is period-oriented).
  const [preset, setPreset] = useState<string>('this_month');
  const initial = monthRange(0);
  const [customFrom, setCustomFrom] = useState(initial.from);
  const [customTo, setCustomTo] = useState(initial.to);

  const range: MoneyListParams =
    preset === 'all'
      ? {}
      : preset === 'custom'
        ? { from: customFrom || undefined, to: customTo || undefined }
        : preset === 'this_year'
          ? { from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` }
          : preset === 'last_month'
            ? monthRange(1)
            : monthRange(0);

  // Pull the whole selected period (limit 1000) so the total is correct, not just a page.
  const entries = useQuery({
    queryKey: [queryKey, range.from ?? null, range.to ?? null],
    queryFn: () => list({ ...range, limit: 1000 }),
    placeholderData: keepPreviousData,
  });

  const [opened, handlers] = useDisclosure(false);
  const [date, setDate] = useState(todayISODate());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  const acctOptions = (accounts.data ?? [])
    .filter((a) => a.type === accountType)
    .map((a) => ({ value: String(a.id), label: a.name }));
  const accountName = (id: number) => (accounts.data ?? []).find((a) => a.id === id)?.name ?? '—';

  const save = useMutation({
    mutationFn: () =>
      create({
        account_id: Number(accountId),
        amount,
        date,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      handlers.close();
    },
  });

  function openCreate() {
    setDate(todayISODate());
    setAccountId(null);
    setAmount(0);
    setDescription('');
    save.reset();
    handlers.open();
  }

  const total = (entries.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const canSave = !!accountId && amount > 0 && !!date;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{title}</Title>
        <Button onClick={openCreate}>＋ Record {noun}</Button>
      </Group>
      <Text c="dimmed" size="sm">
        {blurb}
      </Text>

      <Group gap="sm" align="flex-end">
        <Select label="Period" data={PRESET_OPTIONS} value={preset} onChange={(v) => setPreset(v ?? 'this_month')} allowDeselect={false} w={160} />
        {preset === 'custom' && (
          <>
            <TextInput label="From" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.currentTarget.value)} w={150} />
            <TextInput label="To" type="date" value={customTo} onChange={(e) => setCustomTo(e.currentTarget.value)} w={150} />
          </>
        )}
      </Group>

      <AsyncBoundary
        isLoading={entries.isLoading || accounts.isLoading}
        isError={entries.isError}
        error={entries.error}
        onRetry={() => entries.refetch()}
      >
        {entries.data && (
          <>
            <Table.ScrollContainer minWidth={640}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Account</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                    <Table.Th>Description</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {entries.data.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text c="dimmed" ta="center" py="md">
                          No {noun} recorded for {PERIOD_LABEL[preset]}.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    entries.data.map((e) => (
                      <Table.Tr key={e.id}>
                        <Table.Td>{formatDate(e.date)}</Table.Td>
                        <Table.Td>{accountName(e.account_id)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }} c={amountColor} fw={600}>
                          {formatMoney(e.amount)}
                        </Table.Td>
                        <Table.Td>{e.description ?? '—'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {entries.data.length > 0 && (
              <Group justify="flex-end">
                <Text size="sm" fw={600}>
                  Total — {PERIOD_LABEL[preset]} ({entries.data.length}):{' '}
                  <Text span c={amountColor}>
                    {formatMoney(total)}
                  </Text>
                </Text>
              </Group>
            )}
          </>
        )}
      </AsyncBoundary>

      <Modal opened={opened} onClose={handlers.close} title={`Record ${noun}`} centered>
        <Stack>
          {save.isError && <Alert color="red" variant="light">{normalizeError(save.error).message}</Alert>}
          <TextInput label="Date" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
          <Select
            label={accountLabel}
            placeholder={accounts.isLoading ? 'Loading…' : 'Select account'}
            data={acctOptions}
            value={accountId}
            onChange={setAccountId}
            searchable
            withAsterisk
          />
          <NumberInput
            label="Amount (৳)"
            value={amount}
            onChange={(v) => setAmount(typeof v === 'number' ? v : Number(v) || 0)}
            min={0}
            thousandSeparator=","
            allowNegative={false}
            decimalScale={2}
            withAsterisk
          />
          <TextInput
            label="Description"
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handlers.close}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!canSave}>
              Record
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
