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
import { useNavigate } from 'react-router-dom';
import { createStudent, type Gender } from './api';
import { GuardianPicker, type GuardianSelection } from './GuardianPicker';
import { listAcademicYears, listClasses, listSections } from '@/features/academic/api';
import { createGuardian, type GuardianRelation } from '@/features/guardians/api';
import { listFeeGroups } from '@/features/fees/api';
import { normalizeError } from '@/api/errors';
import { todayISODate } from '@/lib/date';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  class_id: z.string().min(1, 'Select a class'),
  section_id: z.string(),
  academic_year_id: z.string(),
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

const emptyDefaults: FormValues = {
  name: '',
  class_id: '',
  section_id: '',
  academic_year_id: '',
  admission_date: todayISODate(),
  date_of_birth: '',
  gender: '',
  address: '',
  fee_group_id: '',
};

export function AddStudentModal({ opened, onClose }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [guardian, setGuardian] = useState<GuardianSelection>({ mode: 'none' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyDefaults });

  const classes = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const years = useQuery({ queryKey: ['academic-years'], queryFn: listAcademicYears });
  const classId = watch('class_id');
  const sections = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => listSections(Number(classId)),
    enabled: !!classId,
  });
  const feeGroups = useQuery({ queryKey: ['fee-groups'], queryFn: listFeeGroups });

  // Reset everything when the modal opens.
  useEffect(() => {
    if (opened) {
      reset(emptyDefaults);
      setGuardian({ mode: 'none' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, reset]);

  // Default the academic year to the current one once years load.
  useEffect(() => {
    if (opened && years.data && !getValues('academic_year_id')) {
      const current = years.data.find((y) => y.is_current) ?? years.data[0];
      if (current) setValue('academic_year_id', String(current.id));
    }
  }, [opened, years.data, getValues, setValue]);

  // Default the fee group to "Day" once groups load.
  useEffect(() => {
    if (opened && feeGroups.data && !getValues('fee_group_id')) {
      const day = feeGroups.data.find((g) => g.name.toLowerCase() === 'day') ?? feeGroups.data[0];
      if (day) setValue('fee_group_id', String(day.id));
    }
  }, [opened, feeGroups.data, getValues, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create the guardian first if a new one was entered, then attach its id.
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

      const classRow = classes.data?.find((c) => String(c.id) === values.class_id);
      return createStudent({
        name: values.name.trim(),
        class: classRow?.name,
        class_id: Number(values.class_id),
        section_id: values.section_id ? Number(values.section_id) : undefined,
        academic_year_id: values.academic_year_id ? Number(values.academic_year_id) : undefined,
        admission_date: values.admission_date || undefined,
        date_of_birth: values.date_of_birth || undefined,
        gender: (values.gender || undefined) as Gender | undefined,
        address: values.address.trim() || undefined,
        fee_group_id: values.fee_group_id ? Number(values.fee_group_id) : undefined,
        guardian_id: guardianId,
      });
    },
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      handleClose();
      navigate(`/students/${student.id}`);
    },
  });

  function handleClose() {
    mutation.reset();
    onClose();
  }

  const classOptions = (classes.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));
  const sectionOptions = (sections.data ?? []).map((s) => ({ value: String(s.id), label: s.name }));
  const yearOptions = (years.data ?? []).map((y) => ({
    value: String(y.id),
    label: y.is_current ? `${y.name} (current)` : y.name,
  }));

  return (
    <Modal opened={opened} onClose={handleClose} title="Admit student" centered size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Stack>
          {mutation.isError && (
            <Alert color="red" variant="light">
              {normalizeError(mutation.error).message}
            </Alert>
          )}

          <TextInput
            label="Full name"
            placeholder="Student name"
            withAsterisk
            error={errors.name?.message}
            {...register('name')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Controller
              name="class_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Class"
                  placeholder={classes.isLoading ? 'Loading…' : 'Select class'}
                  withAsterisk
                  data={classOptions}
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v ?? '');
                    setValue('section_id', '');
                  }}
                  searchable
                  error={errors.class_id?.message}
                />
              )}
            />
            <Controller
              name="section_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Section"
                  placeholder={!classId ? 'Pick a class first' : 'Select section (optional)'}
                  data={sectionOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  disabled={!classId}
                  clearable
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Controller
              name="academic_year_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Academic year"
                  placeholder={years.isLoading ? 'Loading…' : 'Select year'}
                  data={yearOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                />
              )}
            />
            <TextInput label="Admission date" type="date" {...register('admission_date')} />
          </SimpleGrid>

          <Controller
            name="fee_group_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Fee group"
                description="Determines which price list bills this student"
                placeholder={feeGroups.isLoading ? 'Loading…' : 'Select group'}
                data={(feeGroups.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? '')}
              />
            )}
          />

          <Divider label="Bio" labelPosition="left" />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Date of birth" type="date" {...register('date_of_birth')} />
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
          </SimpleGrid>

          <Textarea
            label="Address"
            placeholder="Home address"
            autosize
            minRows={2}
            {...register('address')}
          />

          <Divider label="Guardian" labelPosition="left" />
          <GuardianPicker value={guardian} onChange={setGuardian} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Admit student
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
