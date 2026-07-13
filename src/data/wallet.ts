export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'funding';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  sender: string;
  receiver: string;
  status: TransactionStatus;
  date: string;
  note?: string;
}

export const initialWalletBalance = 24500;

export const initialTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'deposit',
    amount: 10000,
    sender: 'Bank Account ****4821',
    receiver: 'My Wallet',
    status: 'completed',
    date: '2024-02-10',
  },
  {
    id: 't2',
    type: 'funding',
    amount: 5000,
    sender: 'My Wallet',
    receiver: 'TechWave AI',
    status: 'completed',
    date: '2024-02-12',
    note: 'Seed funding installment',
  },
  {
    id: 't3',
    type: 'withdrawal',
    amount: 1500,
    sender: 'My Wallet',
    receiver: 'Bank Account ****4821',
    status: 'pending',
    date: '2024-02-14',
  },
  {
    id: 't4',
    type: 'transfer',
    amount: 800,
    sender: 'My Wallet',
    receiver: 'Michael Rodriguez',
    status: 'completed',
    date: '2024-02-08',
  },
];