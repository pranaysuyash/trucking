import { issueReceipt, recordPayment } from './leaseEngine';
import type { RentLedgerEntry } from './types';

export interface FinancialState {
  ledgerEntries: RentLedgerEntry[];
  receipts: string[];
}

/** Prepare both records together; caller owns the single state transition and persistence. */
export function preparePayment(state: FinancialState, entryId: string, amount: number, paidDate: string) {
  const entry = state.ledgerEntries.find(item => item.id === entryId);
  if (!entry) throw new Error('Select a ledger entry to pay.');
  if (entry.totalDue - entry.amountPaid <= 0) throw new Error('The selected entry has no outstanding balance.');
  const draft = { ...entry, paymentTransactions: entry.paymentTransactions?.map(item => ({ ...item })) };
  const result = recordPayment(draft, amount, paidDate);
  const receipt = issueReceipt(draft, paidDate, amount);
  return {
    state: {
      ledgerEntries: state.ledgerEntries.map(item => item.id === entryId ? draft : item),
      receipts: [...state.receipts, receipt.receiptNumber],
    },
    result,
    receipt,
  };
}
