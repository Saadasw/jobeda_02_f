import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateStudent, type Gender, type StudentDetail } from './api';
import { GuardianPicker, type GuardianSelection } from './GuardianPicker';
import { listFeeGroups } from '@/features/fees/api';
import { createGuardian, type GuardianRelation } from '@/features/guardians/api';
import { normalizeError } from '@/api/errors';

interface Props {
  opened: boolean;
  onClose: () => void;
  student: StudentDetail;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  admission_date: z.string(),
  date_of_birth: z.string(),
  gender: z.string(),
  address: z.string(),
  fee_group_id: z.string(),
});
type FormValues = z.infer<typeof schema>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export function EditStudentModal({ opened, onClose, student }: Props) {
  const queryClient = useQueryClient();
  const feeGroups = useQuery({ queryKey: ['fee-groups'], queryFn: listFeeGroups });
  const [guardian, setGuardian] = useState<GuardianSelection>({ mode: 'none' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(student) });

  // Re-seed from the student each time the modal opens.
  useEffect(() => {
    if (opened) {
      reset(toDefaults(student));
      setGuardian(student.guardian_id ? { mode: 'existing', id: student.guardian_id } : { mode: 'none' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, student.id]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let guardianId: number | undefined;
      if (guardian.mode === 'existing') {
        guardianId = guardian.id;
      } else if (guardian.mode === 'new' && guardian.name.trim()) {
        const created = await createGuardian({
          name: guardian.name.trim(),
          phone: guardian.phone.trim() || undefined,
          relation: (guardian.relation || undefined) as GuardianRelation | undefined,
        });
        guardianId = created.id;
      }
      return updateStudent(student.id, {
        name: values.name.trim(),
        admission_date: values.admission_date || undefined,
        date_of_birth: values.date_of_birth || undefined,
        gender: (values.gender || undefined) as Gender | undefined,
        address: values.address.trim() || undefined,
        fee_group_id: values.fee_group_id ? Number(values.fee_group_id) : undefined,
        guardian_id: guardianId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardian'] });
      onClose();
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit student" centered size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Stack>
          {mutation.isError && (
            <Alert color="red" variant="light">{normalizeError(mutation.error).message}</Alert>
          )}

          <TextInput label="Full name" withAsterisk error={errors.name?.message} {...register('name')} />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Admission date" type="date" {...register('admission_date')} />
            <TextInput label="Date of birth" type="date" {...register('date_of_birth')} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  label="Gender"
                  placeholder="Select"
                  data={GENDER_OPTIONS}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  clearable
                />
              )}
            />
            <Controller
              name="fee_group_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Fee group"
                  placeholder={feeGroups.isLoading ? 'Loading…' : 'Select group'}
                  data={(feeGroups.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                />
              )}
            />
          </SimpleGrid>

          <Textarea label="Address" autosize minRows={2} {...register('address')} />

          <Divider label="Guardian" labelPosition="left" />
          <GuardianPicker value={guardian} onChange={setGuardian} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Save changes</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function toDefaults(s: StudentDetail): FormValues {
  return {
    name: s.name ?? '',
    admission_date: s.admission_date ?? '',
    date_of_birth: s.date_of_birth ?? '',
    gender: s.gender ?? '',
    address: s.address ?? '',
    fee_group_id: s.fee_group_id ? String(s.fee_group_id) : '',
  };
}
