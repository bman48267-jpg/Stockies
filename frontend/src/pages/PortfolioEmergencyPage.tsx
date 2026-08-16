import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  RefreshCw,
  History,
  Briefcase,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { getPortfolioSummary, getTransactions, deleteTransaction, type PortfolioSummary, type TransactionResponse } from '@/api';
import { formatCurrency, formatPercent, signClass } from '@/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionModal } from '@/components/portfolio/TransactionModal';
import { TransactionTable } from '@/components/portfolio/TransactionTable';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from 'recharts';

export function PortfolioEmergencyPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio-summary'],
    queryFn: getPortfolioSummary,
  });

  const {
    data: txns,
    isLoading: isTxnsLoading,
    refetch: refetchTxns,
  } = useQuery<TransactionResponse[]>({
    queryKey: ['portfolio-transactions', 'emergency_fund'],
    queryFn: () => getTransactions('emergency_fund'),
  });

  const handleRefetch = () => {
    refetchSummary();
    refetchTxns();
  };

  const handleDeleteHolding = async (symbol: string, assetType: 'emergency_fund') => {
    if (
      !window.confirm(
        `Are you sure you want to delete your entire exposure to ${symbol}? This will permanently remove all transaction records for this asset.`
      )
    ) {
      return;
    }
    setDeletingSymbol(symbol);
    try {
      const records = await getTransactions(assetType, symbol);
      if (records.length === 0) {
        alert("No transaction records found for this asset.");
        return;
      }
      await Promise.all(records.map((r) => deleteTransaction(r.id)));
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions', assetType] });
      handleRefetch();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete holding: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingSymbol(null);
    }
  };

  const isLoading = isSummaryLoading || isTxnsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const holdings = summary?.holdings.filter((h) => h.asset_type === 'emergency_fund') || [];
  const listTxns = txns || [];

  const investedVal = summary?.allocation.emergency_fund_invested ?? 0;
  const currentVal = summary?.allocation.emergency_fund_value ?? 0;
  const pnlVal = currentVal - investedVal;
  const pnlPercent = investedVal > 0 ? (pnlVal / investedVal) * 100 : 0;

  // Chart data maps
  const allocationData = holdings.map((h) => ({
    name: h.symbol,
    fullName: h.name,
    value: h.current_value,
  })).sort((a, b) => b.value - a.value);

  const returnsData = holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    'Growth (₹)': h.unrealized_pnl,
  })).sort((a, b) => b['Growth (₹)'] - a['Growth (₹)']);

  const COLORS = ['#3b82f6', '#2563eb', '#60a5fa', '#1d4ed8', '#93c5fd', '#1e3a8a'];

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefetch}
            className="p-2 rounded-xl border border-token hover:bg-muted text-secondary hover:text-primary transition-all"
            title="Refresh Emergency Account"
          >
            <RefreshCw size={15} />
          </button>
          <span className="text-xs text-muted">Liquidity reserves & emergency funds</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus size={16} />
          Add Deposit
        </button>
      </div>

      {listTxns.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <ShieldCheck size={44} className="mx-auto text-blue-500 mb-4 opacity-75 animate-pulse" />
          <h3 className="text-lg font-bold">No Emergency Reserves Yet</h3>
          <p className="text-sm text-secondary mt-1 max-w-sm mx-auto">
            Secure your future by tracking your liquid emergency savings deposits (bank accounts, liquid funds, savings plans).
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 bg-blue-600 hover:bg-blue-500 text-white">
            <Plus size={16} />
            Add Emergency Fund Record
          </button>
        </div>
      ) : (
        <>
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Total Emergency Reserve
              </p>
              <h3 className="text-2xl font-extrabold text-blue-400 font-mono">
                {formatCurrency(currentVal, { compact: false })}
              </h3>
              <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                Deposited:{' '}
                <span className="font-semibold text-secondary font-mono">
                  {formatCurrency(investedVal, { compact: true })}
                </span>
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Interest accrued / Growth
              </p>
              <h3 className={`text-2xl font-extrabold font-mono ${signClass(pnlVal)}`}>
                {pnlVal >= 0 ? '+' : ''}
                {formatCurrency(pnlVal, { compact: false })}
              </h3>
              <p className={`text-xs font-semibold mt-1.5 ${signClass(pnlPercent)}`}>
                {formatPercent(pnlPercent)} returns
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Active Pots
              </p>
              <h3 className="text-2xl font-extrabold text-primary font-mono">
                {holdings.length}
              </h3>
              <p className="text-xs text-muted mt-1.5">Across different channels</p>
            </div>
          </div>

          {/* Visual Charts Section */}
          {holdings.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Allocation */}
              <div
                className="rounded-2xl p-5 lg:col-span-1 space-y-4"
                style={{
                  backdropFilter: 'blur(16px)',
                  backgroundColor: 'rgba(24, 24, 27, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-sans">
                  Reserve Distribution
                </h4>
                <div className="h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {allocationData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(18, 18, 18, 0.8)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                          borderRadius: '12px',
                        }}
                        formatter={(value: any, _name: any, props: any) => [
                          `₹${Number(value).toLocaleString('en-IN')}`,
                          props.payload.fullName
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Value</span>
                    <p className="text-lg font-extrabold text-primary font-mono mt-0.5">
                      ₹{currentVal.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-2 justify-center max-h-16 overflow-y-auto no-scrollbar">
                  {allocationData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-secondary">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span title={item.fullName}>{item.name} ({((item.value / (currentVal || 1)) * 100).toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accrued growth area chart */}
              <div
                className="rounded-2xl p-5 lg:col-span-2 space-y-4"
                style={{
                  backdropFilter: 'blur(16px)',
                  backgroundColor: 'rgba(24, 24, 27, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-sans">
                  Total Growth / Accrued Earnings
                </h4>
                <div className="h-[21rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={returnsData} margin={{ top: 20, right: 15, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="emergencyPnlGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="symbol" tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <YAxis tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(18, 18, 18, 0.8)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                          borderRadius: '12px',
                        }}
                        formatter={(value: any, _name: any, props: any) => [
                          `₹${Number(value).toLocaleString('en-IN')}`,
                          props.payload.name
                        ]}
                      />
                      <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="Growth (₹)"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#emergencyPnlGlow)"
                        dot={{ r: 4, strokeWidth: 1 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Holdings Section */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Briefcase size={16} />
              Emergency Fund Holdings
            </h4>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account / Provider Name</th>
                    <th>Identifier</th>
                    <th className="text-right">Units / Pots</th>
                    <th className="text-right">Avg Unit Value</th>
                    <th className="text-right">Current Unit Value</th>
                    <th className="text-right">Deposited</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-right">Earnings / Growth</th>
                    <th className="text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.symbol}>
                      <td className="font-semibold text-primary">{h.name}</td>
                      <td className="font-mono text-xs uppercase text-secondary">{h.symbol}</td>
                      <td className="text-right font-mono font-medium">{h.quantity}</td>
                      <td className="text-right font-mono text-secondary">₹{h.avg_price.toFixed(2)}</td>
                      <td className="text-right font-mono font-semibold">₹{h.current_price.toFixed(2)}</td>
                      <td className="text-right font-mono text-secondary">
                        ₹{h.invested_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        ₹{h.current_value.toLocaleString('en-IN')}
                      </td>
                      <td className={`text-right font-mono font-bold ${signClass(h.unrealized_pnl)}`}>
                        <div>{h.unrealized_pnl >= 0 ? '+' : ''}{h.unrealized_pnl.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] font-medium">{formatPercent(h.unrealized_pnl_percent)}</div>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleDeleteHolding(h.symbol, h.asset_type)}
                          disabled={deletingSymbol === h.symbol}
                          className="p-1 px-2 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-400 active:scale-95 transition-all text-xs flex items-center justify-center mx-auto"
                          title="Remove reserve segment"
                        >
                          <Trash2 size={13} className={deletingSymbol === h.symbol ? 'animate-pulse' : ''} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Section */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <History size={16} />
              Accrued Transaction Log
            </h4>
            <TransactionTable transactions={listTxns} onDeleted={handleRefetch} />
          </div>
        </>
      )}

      {/* Transaction modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefetch}
        defaultAssetType="emergency_fund"
      />
    </div>
  );
}
