import { MoneyEntryPage } from '@/components/MoneyEntryPage';
import { createExpense, listExpenses } from './api';

export function ExpensesPage() {
  return (
    <MoneyEntryPage
      title="Expenses"
      noun="expense"
      blurb="Money paid out — rent, utilities, supplies. Each posts Dr expense account / Cr Cash."
      accountType="expense"
      accountLabel="Expense account"
      amountColor="red.7"
      queryKey="expenses"
      list={listExpenses}
      create={createExpense}
    />
  );
}
