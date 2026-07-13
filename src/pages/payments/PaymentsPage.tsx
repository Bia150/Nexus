import React, { useState } from 'react';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Send, TrendingUp,
  X, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { initialWalletBalance, initialTransactions, Transaction, TransactionType, TransactionStatus } from '../../data/wallet';

const typeLabels: Record<TransactionType, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
  funding: 'Deal Funding',
};

const statusVariant: Record<TransactionStatus, 'success' | 'warning' | 'error'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

type ModalKind = 'deposit' | 'withdraw' | 'transfer' | 'fund' | null;

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(initialWalletBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [modal, setModal] = useState<ModalKind>(null);
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('');

  const isInvestor = user?.role === 'investor';

  const closeModal = () => {
    setModal(null);
    setAmount('');
    setTarget('');
  };

  const submitTransaction = (type: TransactionType) => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if ((type === 'withdrawal' || type === 'transfer' || type === 'funding') && value > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const tx: Transaction = {
      id: `t${Date.now()}`,
      type,
      amount: value,
      sender: type === 'deposit' ? 'Bank Account ****4821' : 'My Wallet',
      receiver:
        type === 'deposit' ? 'My Wallet' :
        type === 'withdrawal' ? 'Bank Account ****4821' :
        target || 'Recipient',
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      note: type === 'funding' ? 'Investor → Entrepreneur funding' : undefined,
    };

    setTransactions(prev => [tx, ...prev]);
    setBalance(prev => (type === 'deposit' ? prev + value : prev - value));

    const messages: Record<TransactionType, string> = {
      deposit: 'Deposit successful',
      withdrawal: 'Withdrawal initiated',
      transfer: 'Transfer sent',
      funding: 'Deal funded successfully',
    };
    toast.success(messages[type]);
    closeModal();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your wallet, transfers, and deal funding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet balance card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <CardBody className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-primary-100 text-sm">Wallet Balance</span>
              <Wallet size={22} className="text-primary-100" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
            <div className="flex items-center gap-2 text-xs text-primary-100">
              <CreditCard size={14} />
              <span>Nexus Wallet · **** 7734</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20" size="sm" leftIcon={<ArrowDownToLine size={16} />} onClick={() => setModal('deposit')}>
                Deposit
              </Button>
              <Button variant="outline" className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20" size="sm" leftIcon={<ArrowUpFromLine size={16} />} onClick={() => setModal('withdraw')}>
                Withdraw
              </Button>
              <Button variant="outline" className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20" size="sm" leftIcon={<Send size={16} />} onClick={() => setModal('transfer')}>
                Transfer
              </Button>
              {isInvestor && (
                <Button variant="outline" className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20" size="sm" leftIcon={<TrendingUp size={16} />} onClick={() => setModal('fund')}>
                  Fund Deal
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Overview</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(transactions.filter(t => t.status === 'completed' && (t.type === 'deposit')).reduce((s, t) => s + t.amount, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Deposited</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(transactions.filter(t => t.type === 'funding').reduce((s, t) => s + t.amount, 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Funded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">
                  {transactions.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Pending Transactions</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Sender</th>
                <th className="pb-2 font-medium">Receiver</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 font-medium text-gray-900">{typeLabels[tx.type]}</td>
                  <td className="py-3">{formatCurrency(tx.amount)}</td>
                  <td className="py-3 text-gray-600">{tx.sender}</td>
                  <td className="py-3 text-gray-600">{tx.receiver}</td>
                  <td className="py-3 text-gray-500">{tx.date}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant[tx.status]} size="sm">{tx.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {modal === 'deposit' && 'Deposit Funds'}
                {modal === 'withdraw' && 'Withdraw Funds'}
                {modal === 'transfer' && 'Transfer Funds'}
                {modal === 'fund' && 'Fund a Deal'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Amount (USD)"
                type="number"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                fullWidth
              />
              {(modal === 'transfer' || modal === 'fund') && (
                <Input
                  label={modal === 'fund' ? 'Startup / Entrepreneur name' : 'Recipient name'}
                  type="text"
                  placeholder={modal === 'fund' ? 'e.g. TechWave AI' : 'e.g. Jane Doe'}
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  fullWidth
                />
              )}
              <p className="text-xs text-gray-400">
                This is a simulated transaction for demo purposes — no real funds move.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button
                  onClick={() =>
                    submitTransaction(
                      modal === 'deposit' ? 'deposit' :
                      modal === 'withdraw' ? 'withdrawal' :
                      modal === 'fund' ? 'funding' : 'transfer'
                    )
                  }
                >
                  Confirm
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};