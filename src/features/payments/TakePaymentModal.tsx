import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPayment, allocatePayment } from './api';
import { normalizeError } from '@/api/errors';
import { formatMoney } from '@/lib/money';
import { todayISODate } from '@/lib/date';

interface Props {
  opened: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  due: number;
}

const schema = z.object({
  amount: z.number().gt(0, 'Enter an amount greater than 0'),
  date: z.string().min(1, 'Date is required'),
  method: z.string().min(1, 'Select a method'),
});
type FormValues = z.infer<typeof schema>;

interface PaymentResult {
  receipt_no: string | null;
  amount: number;
  allocated: number;
  advance: number;
  allocationError: string | null;
}

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile', label: 'Mobile banking' },
  { value: 'cheque', label: 'Cheque' },
];

export function TakePaymentModal({ opened, onClose, studentId, studentName, due }: Props) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<PaymentResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: due > 0 ? due : 0, date: todayISODate(), method: 'cash' },
  });

  // Reset the form to the current due/today only when the modal OPENS.
  // `due` is intentionally NOT a dependency: a successful payment updates `due`
  // (via query invalidation), which would otherwise re-run this and wipe the
  // just-shown receipt.
  useEffect(() => {
    if (opened) {
      setResult(null);
      reset({ amount: due > 0 ? due : 0, date: todayISODate(), method: 'cash' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues): Promise<PaymentResult> => {
      // Step 1: record the payment (the receipt is issued here).
      const payment = await createPayment({
        student_id: studentId,
        amount: values.amount,
        date: values.date,
        method: values.method,
      });
      // Step 2: auto-allocate against dues. If this fails the payment is still
      // recorded (held as an advance) — surface that instead of losing it.
      try {
        const alloc = await allocatePayment(payment.id);
        return {
          receipt_no: payment.receipt_no ?? null,
          amount: Number(payment.amount),
          allocated: Number(alloc.allocated),
          advance: Number(alloc.advance),
          allocationError: null,
        };
      } catch (e) {
        return {
          receipt_no: payment.receipt_no ?? null,
          amount: Number(payment.amount),
          allocated: 0,
          advance: Number(payment.amount),
          allocationError: normalizeError(e).message,
        };
      }
    },
    onSuccess: (res) => {
      setResult(res);
      // Refresh everything this payment affects.
      queryClient.invalidateQueries({ queryKey: ['student-summary', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-fees', studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-aging'] });
    },
  });

  function handleClose() {
    mutation.reset();
    setResult(null);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={`Take payment — ${studentName}`} centered>
      {result ? (
        <Stack>
          <Alert
            color={result.allocationError ? 'yellow' : 'teal'}
            variant="light"
            title={result.allocationError ? 'Payment recorded — allocation needs attention' : 'Payment recorded'}
          >
            <Stack gap={4}>
              <Text size="sm">
                Receipt: <b>{result.receipt_no ?? '—'}</b>
              </Text>
              <Text size="sm">
                Amount: <b>{formatMoney(result.amount)}</b>
              </Text>
              <Text size="sm">Applied to dues: {formatMoney(result.allocated)}</Text>
              <Text size="sm">Advance (unapplied): {formatMoney(result.advance)}</Text>
              {result.allocationError && (
                <Text size="sm" c="red">
                  Allocation note: {result.allocationError}
                </Text>
              )}
            </Stack>
          </Alert>
          <Group justify="flex-end">
            <Button onClick={handleClose}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Stack>
            <Text size="sm" c="dimmed">
              Current due: {formatMoney(due)}
            </Text>
            {mutation.isError && (
              <Alert color="red" variant="light">
                {normalizeError(mutation.error).message}
              </Alert>
            )}
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Amount (৳)"
                  value={field.value}
                  onChange={(v) => field.onChange(typeof v === 'number' ? v : Number(v) || 0)}
                  min={0}
                  decimalScale={2}
                  thousandSeparator=","
                  allowNegative={false}
                  error={errors.amount?.message}
                />
              )}
            />
            <TextInput
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <Select
                  label="Method"
                  data={METHODS}
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? '')}
                  allowDeselect={false}
                  error={errors.method?.message}
                />
              )}
            />
            <Group justify="flex-end" mt="xs">
              <Button variant="default" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                Record payment
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
