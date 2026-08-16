import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertCircle } from 'lucide-react';
import { deleteTransaction, type TransactionResponse } from '@/api';
import { formatDate } from '@/utils/format';


interface TransactionTableProps {
  transactions: TransactionResponse[];
  onDeleted: () => void;
}

export function TransactionTable({ transactions, onDeleted }: TransactionTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      onDeleted();
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions'] });
      setDeletingId(null);
    },
    onError: (err) => {
      console.error('Delete transaction failed:', err);
      alert('Failed to delete transaction. Please try again.');
      setDeletingId(null);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction record?')) {
      setDeletingId(id);
      mutation.mutate(id);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted text-sm flex flex-col items-center gap-2">
        <AlertCircle size={24} className="opacity-60 text-secondary" />
        No transactions recorded in this category.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-token">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Security</th>
            <th>Type</th>
            <th className="text-right">Quantity</th>
            <th className="text-right">Price</th>
            <th className="text-right">Charges</th>
            <th className="text-right">Total Amount</th>
            <th>Notes</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const charges = (txn.brokerage || 0) + (txn.taxes || 0);
            return (
              <tr key={txn.id} className="hover:bg-muted/50 cursor-default">
                <td className="font-mono text-secondary text-xs">
                  {formatDate(txn.transaction_date)}
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">{txn.name}</span>
                    <span className="text-[10px] text-muted font-mono uppercase">{txn.symbol}</span>
                  </div>
                </td>
                <td>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor:
                        txn.transaction_type === 'BUY' || txn.transaction_type === 'SIP'
                          ? 'var(--positive-subtle)'
                          : txn.transaction_type === 'SELL'
                          ? 'var(--negative-subtle)'
                          : 'var(--bg-muted)',
                      color:
                        txn.transaction_type === 'BUY' || txn.transaction_type === 'SIP'
                          ? 'var(--positive)'
                          : txn.transaction_type === 'SELL'
                          ? 'var(--negative)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {txn.transaction_type}
                  </span>
                </td>
                <td className="text-right font-mono font-medium">{txn.quantity}</td>
                <td className="text-right font-mono text-secondary">
                  {txn.transaction_type === 'BONUS' || txn.transaction_type === 'SPLIT'
                    ? '—'
                    : `₹${txn.price.toFixed(2)}`}
                </td>
                <td className="text-right font-mono text-muted text-xs">
                  {charges > 0 ? `₹${charges.toFixed(2)}` : '—'}
                </td>
                <td className="text-right font-mono font-semibold">
                  {txn.amount > 0 ? `₹${txn.amount.toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="text-xs text-secondary max-w-[150px] truncate" title={txn.notes}>
                  {txn.notes || '—'}
                </td>
                <td className="text-center">
                  <button
                    onClick={() => handleDelete(txn.id)}
                    disabled={deletingId === txn.id}
                    className="p-1.5 rounded-lg hover:bg-negative-subtle text-muted hover:text-negative active:scale-95 transition-all"
                    title="Delete record"
                  >
                    <Trash2 size={14} className={deletingId === txn.id ? 'animate-pulse' : ''} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
