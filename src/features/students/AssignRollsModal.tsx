import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Group, Modal, NumberInput, Stack, Table, Text } from '@mantine/core';
import { assignRolls, listStudents } from './api';
import { AsyncBoundary } from '@/components/AsyncBoundary';
import { normalizeError } from '@/api/errors';

interface Props {
  opened: boolean;
  onClose: () => void;
  academicYearId: number;
  classId: number;
  sectionId: number;
  label: string; // e.g. "Hifz-1 · Section A"
}

export function AssignRollsModal({ opened, onClose, academicYearId, classId, sectionId, label }: Props) {
  const queryClient = useQueryClient();
  const roster = useQuery({
    queryKey: ['roster', classId, sectionId],
    queryFn: () => listStudents({ class_id: classId, section_id: sectionId, limit: 200 }),
    enabled: opened,
    placeholderData: keepPreviousData,
  });

  // studentId -> roll value ('' = unassigned)
  const [rolls, setRolls] = useState<Record<number, number | ''>>({});

  const students = useMemo(
    () => [...(roster.data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [roster.data],
  );

  // Seed inputs from the current rolls each time the modal opens / data loads.
  useEffect(() => {
    if (opened && roster.data) {
      const seed: Record<number, number | ''> = {};
      roster.data.data.forEach((s) => {
        seed[s.id] = s.roll_no ?? '';
      });
      setRolls(seed);
    }
  }, [opened, roster.data]);

  function autoNumber() {
    const seed: Record<number, number | ''> = {};
    students.forEach((s, i) => {
      seed[s.id] = i + 1;
    });
    setRolls(seed);
  }

  // Duplicate detection among the non-blank values.
  const dupSet = useMemo(() => {
    const seen = new Set<number>();
    const dups = new Set<number>();
    Object.values(rolls).forEach((v) => {
      if (v === '') return;
      if (seen.has(v)) dups.add(v);
      else seen.add(v);
    });
    return dups;
  }, [rolls]);
  const hasDup = dupSet.size > 0;

  const save = useMutation({
    mutationFn: () =>
      assignRolls({
        academic_year_id: academicYearId,
        class_id: classId,
        section_id: sectionId,
        assignments: students.map((s) => ({
          student_id: s.id,
          roll_no: rolls[s.id] === '' || rolls[s.id] === undefined ? null : Number(rolls[s.id]),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['roster', classId, sectionId] });
      onClose();
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title={`Assign rolls — ${label}`} centered size="md">
      <Stack>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Rolls are unique within this class &amp; section.
          </Text>
          <Button size="xs" variant="light" onClick={autoNumber} disabled={students.length === 0}>
            Auto-number A→Z
          </Button>
        </Group>

        {save.isError && <Alert color="red" variant="light">{normalizeError(save.error).message}</Alert>}
        {hasDup && (
          <Alert color="orange" variant="light">
            Duplicate roll(s): {[...dupSet].join(', ')} — each must be unique.
          </Alert>
        )}

        <AsyncBoundary
          isLoading={roster.isLoading}
          isError={roster.isError}
          error={roster.error}
          onRetry={() => roster.refetch()}
        >
          {roster.data && (
            <Table verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th w={120}>Roll</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {students.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={2}>
                      <Text c="dimmed" ta="center" py="sm">
                        No students in this section.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  students.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.name}</Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={rolls[s.id] ?? ''}
                          onChange={(v) => setRolls((r) => ({ ...r, [s.id]: v === '' ? '' : Number(v) }))}
                          min={1}
                          size="xs"
                          allowDecimal={false}
                          allowNegative={false}
                          placeholder="—"
                          error={rolls[s.id] !== '' && rolls[s.id] !== undefined && dupSet.has(Number(rolls[s.id]))}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          )}
        </AsyncBoundary>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={hasDup || students.length === 0}>
            Save rolls
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
