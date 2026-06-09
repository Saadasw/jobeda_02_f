import { Anchor, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { GUARDIAN_RELATIONS, listGuardians } from '@/features/guardians/api';

/**
 * Guardian selection for the admission form. Either picks an existing guardian
 * or captures a new one to be created on submit. Kept as a controlled value so
 * the parent owns the create-then-attach flow.
 */
export type GuardianSelection =
  | { mode: 'none' }
  | { mode: 'existing'; id: number }
  | { mode: 'new'; name: string; phone: string; relation: string };

interface Props {
  value: GuardianSelection;
  onChange: (value: GuardianSelection) => void;
}

const RELATION_OPTIONS = GUARDIAN_RELATIONS.map((r) => ({
  value: r,
  label: r.charAt(0).toUpperCase() + r.slice(1),
}));

export function GuardianPicker({ value, onChange }: Props) {
  const guardians = useQuery({
    queryKey: ['guardians', 'all'],
    queryFn: () => listGuardians({ limit: 200 }),
  });

  if (value.mode === 'new') {
    return (
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            New guardian
          </Text>
          <Anchor component="button" type="button" size="xs" onClick={() => onChange({ mode: 'none' })}>
            Pick existing instead
          </Anchor>
        </Group>
        <TextInput
          label="Guardian name"
          placeholder="e.g. Abdul Karim"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.currentTarget.value })}
        />
        <Group grow align="flex-start">
          <TextInput
            label="Phone"
            placeholder="01XXXXXXXXX"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.currentTarget.value })}
          />
          <Select
            label="Relation"
            placeholder="Select"
            data={RELATION_OPTIONS}
            value={value.relation || null}
            onChange={(v) => onChange({ ...value, relation: v ?? '' })}
            clearable
          />
        </Group>
      </Stack>
    );
  }

  const options = (guardians.data ?? []).map((g) => ({
    value: String(g.id),
    label: g.phone ? `${g.name} · ${g.phone}` : g.name,
  }));

  return (
    <Stack gap="xs">
      <Select
        label="Guardian"
        placeholder={guardians.isLoading ? 'Loading…' : 'Search guardian (optional)'}
        data={options}
        searchable
        clearable
        nothingFoundMessage="No guardian found"
        value={value.mode === 'existing' ? String(value.id) : null}
        onChange={(v) => onChange(v ? { mode: 'existing', id: Number(v) } : { mode: 'none' })}
      />
      <Anchor
        component="button"
        type="button"
        size="xs"
        onClick={() => onChange({ mode: 'new', name: '', phone: '', relation: '' })}
      >
        ＋ Add new guardian
      </Anchor>
    </Stack>
  );
}
