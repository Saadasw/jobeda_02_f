import { MoneyEntryPage } from '@/components/MoneyEntryPage';
import { createIncome, listIncome } from './api';

export function IncomePage() {
  return (
    <MoneyEntryPage
      title="Income"
      noun="income"
      blurb="Non-fee money in — donations, zakat, events. Each posts Dr Cash / Cr revenue account."
      accountType="revenue"
      accountLabel="Income account"
      amountColor="teal.7"
      queryKey="income"
      list={listIncome}
      create={createIncome}
    />
  );
}
