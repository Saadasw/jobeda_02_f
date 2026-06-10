import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAcademicYears, listClasses } from '@/features/academic/api';
import { generateFees, generateFeesManual, listFeeTypes, type GenerateResult } from './api';
import { normalizeError } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import { todayISODate } from '@/lib/date';

interface Props {
  opened: boolean;
  onClose: () => void;
  defaultYearId?: number | null;
  defaultClassId?: number | null;
}

type Mode = 'structure' | 'manual';

export function GenerateFeesModal({ opened, onClose, defaultYearId, defaultClassId }: Props) {
  const queryClient = useQueryClient();
  const years = useQuery({ queryKey: ['academic-years'], queryFn: listAcademicYears });
  const classes = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const feeTypes = useQuery({ queryKey: ['fee-types'], queryFn: listFeeTypes });

  const [mode, setMode] = useState<Mode>('structure');
  const [yearId, setYearId] = useState<string | null>(null);
  const [month, setMonth] = useState(todayISODate().slice(0, 7));
  const [classId, setClassId] = useState<string | null>(null); // null => all classes
  const [feeTypeId, setFeeTypeId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [dueDay, setDueDay] = useState<number | ''>('');
  const [preview, setPreview] = useState<GenerateResult | null>(null);
  const [done, setDone] = useState<GenerateResult | null>(null);

  // Reset on open + default the year to current.
  useEffect(() => {
    if (!opened) return;
    setMode('structure');
    setMonth(todayISODate().slice(0, 7));
    setClassId(defaultClassId ? String(defaultClassId) : null);
    setFeeTypeId(null);
    setAmount(0);
    setDueDay('');
    setPreview(null);
    setDone(null);
    const current = years.data?.find((y) => y.is_current) ?? years.data?.[0];
    setYearId(defaultYearId ? String(defaultYearId) : current ? String(current.id) : null);
  }, [opened, years.data, defaultYearId, defaultClassId]);

  const invalid =
    !yearId || !month || (mode === 'manual' && (!feeTypeId || !(amount > 0)));

  function buildAndRun(dryRun: boolean) {
    const common = {
      academic_year_id: Number(yearId),
      month,
      class_id: classId ? Number(classId) : undefined,
      dry_run: dryRun,
    };
    return mode === 'structure'
      ? generateFees(common)
      : generateFeesManual({
          ...common,
          fee_type_id: Number(feeTypeId),
          amount,
          due_day: dueDay === '' ? undefined : Number(dueDay),
        });
  }

  const previewMut = useMutation({
    mutationFn: () => buildAndRun(true),
    onSuccess: (r) => setPreview(r),
  });
  const generateMut = useMutation({
    mutationFn: () => buildAndRun(false),
    onSuccess: (r) => {
      setDone(r);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-aging'] });
    },
  });

  // Editing any input invalidates a stale preview.
  function onAnyChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPreview(null);
    };
  }

  const yearOptions = useMemo(
    () => (years.data ?? []).map((y) => ({ value: String(y.id), label: y.is_current ? `${y.name} (current)` : y.name })),
    [years.data],
  );
  const classOptions = (classes.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));
  const feeTypeOptions = (feeTypes.data ?? []).map((f) => ({ value: String(f.id), label: f.name ?? `#${f.id}` }));

  const err = previewMut.error || generateMut.error;

  return (
    <Modal opened={opened} onClose={onClose} title="Generate fees" centered size="lg">
      {done ? (
        <Stack>
          <Alert color="teal" variant="light" title="Fees generated">
            <Stack gap={2}>
              <Text size="sm">Created: <b>{done.created}</b> fee{done.created === 1 ? '' : 's'} ({formatMoney(done.total_amount)})</Text>
              <Text size="sm">Already billed (skipped): {done.skipped}</Text>
              {done.no_structure > 0 && (
                <Text size="sm" c="orange.7">No price list: {done.no_structure} student(s)</Text>
              )}
            </Stack>
          </Alert>
          <Group justify="flex-end">
            <Button onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <Stack>
          <SegmentedControl
            value={mode}
            onChange={(v) => { setMode(v as Mode); setPreview(null); }}
            data={[
              { value: 'structure', label: 'From structures' },
              { value: 'manual', label: 'Manual one-off' },
            ]}
            fullWidth
          />

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Select
              label="Academic year"
              data={yearOptions}
              value={yearId}
              onChange={onAnyChange(setYearId)}
            />
            <TextInput
              label="Month"
              type="month"
              value={month}
              onChange={(e) => onAnyChange(setMonth)(e.currentTarget.value)}
            />
            <Select
              label="Class"
              placeholder="All classes"
              data={classOptions}
              value={classId}
              onChange={onAnyChange(setClassId)}
              clearable
              searchable
            />
          </SimpleGrid>

          {mode === 'manual' && (
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Select
                label="Fee type"
                placeholder="Select"
                data={feeTypeOptions}
                value={feeTypeId}
                onChange={onAnyChange(setFeeTypeId)}
              />
              <NumberInput
                label="Amount (৳)"
                value={amount}
                onChange={(v) => onAnyChange(setAmount)(typeof v === 'number' ? v : Number(v) || 0)}
                min={0}
                thousandSeparator=","
                allowNegative={false}
              />
              <NumberInput
                label="Due day"
                placeholder="1–28"
                value={dueDay}
                onChange={(v) => onAnyChange(setDueDay)(v === '' ? '' : Number(v))}
                min={1}
                max={28}
              />
            </SimpleGrid>
          )}

          {mode === 'structure' && (
            <Text size="xs" c="dimmed">
              Bills each active student per their (class · fee group) price list — monthly items only.
            </Text>
          )}

          {err && (
            <Alert color="red" variant="light">{normalizeError(err).message}</Alert>
          )}

          {preview && (
            <Alert color={preview.created > 0 ? 'blue' : 'gray'} variant="light" title="Preview">
              <Stack gap={2}>
                <Text size="sm">
                  Will create <b>{preview.created}</b> fee{preview.created === 1 ? '' : 's'} ({formatMoney(preview.total_amount)}) across {preview.students_in_scope} student(s).
                </Text>
                <Text size="sm" c="dimmed">Already billed (skipped): {preview.skipped}</Text>
                {preview.no_structure > 0 && (
                  <Text size="sm" c="orange.7">No price list: {preview.no_structure} student(s) — set up a structure or assign their fee group.</Text>
                )}
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button
              variant="light"
              onClick={() => previewMut.mutate()}
              loading={previewMut.isPending}
              disabled={invalid}
            >
              Preview
            </Button>
            <Button
              onClick={() => generateMut.mutate()}
              loading={generateMut.isPending}
              disabled={invalid || !preview || preview.created === 0}
            >
              Generate
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
