import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Plus,
  RefreshCw,
  History,
  Briefcase,
  Trash2,
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

export function PortfolioStocksPage() {
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
    queryKey: ['portfolio-transactions', 'stock'],
    queryFn: () => getTransactions('stock'),
  });

  const handleRefetch = () => {
    refetchSummary();
    refetchTxns();
  };

  const handleDeleteHolding = async (symbol: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete your entire exposure to ${symbol}? This will permanently remove all transactions registered under this asset.`
      )
    ) {
      return;
    }
    setDeletingSymbol(symbol);
    try {
      const records = await getTransactions('stock', symbol);
      if (records.length === 0) {
        alert("No transaction records found for this asset.");
        return;
      }
      await Promise.all(records.map((r) => deleteTransaction(r.id)));
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-transactions', 'stock'] });
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
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const stockHoldings = summary?.holdings.filter((h) => h.asset_type === 'stock') || [];
  const stockTxns = txns || [];

  const stocksInvested = summary?.allocation.stocks_invested ?? 0;
  const stocksValue = summary?.allocation.stocks_value ?? 0;
  const stocksPnl = stocksValue - stocksInvested;
  const stocksPnlPercent = stocksInvested > 0 ? (stocksPnl / stocksInvested) * 100 : 0;

  // Visual holdings mapping
  const stockAllocationData = stockHoldings.map((h) => ({
    name: h.symbol,
    value: h.current_value,
  })).sort((a, b) => b.value - a.value);

  const stockReturnsData = stockHoldings.map((h) => ({
    symbol: h.symbol,
    'P&L (₹)': h.unrealized_pnl,
  })).sort((a, b) => b['P&L (₹)'] - a['P&L (₹)']);

  const STOCK_COLORS = ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#065f46', '#a7f3d0'];

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefetch}
            className="p-2 rounded-xl border border-token hover:bg-muted text-secondary hover:text-primary transition-all"
            title="Refresh Stock Portfolio"
          >
            <RefreshCw size={15} />
          </button>
          <span className="text-xs text-muted">Stock trades and valuations</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-[0.98] transition-all bg-accent text-white"
        >
          <Plus size={16} />
          Add Stock Trade
        </button>
      </div>

      {stockTxns.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <TrendingUp size={44} className="mx-auto text-muted mb-4 opacity-75" />
          <h3 className="text-lg font-bold">No Stock Holdings</h3>
          <p className="text-sm text-secondary mt-1 max-w-sm mx-auto">
            You don't have any stock investments tracked. Record a BUY transaction to build your stock portfolio.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 bg-accent text-white">
            <Plus size={16} />
            Add Stock Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Stock Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Stock Valuation
              </p>
              <h3 className="text-2xl font-extrabold text-primary">
                {formatCurrency(stocksValue, { compact: false })}
              </h3>
              <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                Cost Basis:{' '}
                <span className="font-semibold text-secondary">
                  {formatCurrency(stocksInvested, { compact: true })}
                </span>
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Stocks returns
              </p>
              <h3 className={`text-2xl font-extrabold ${signClass(stocksPnl)}`}>
                {stocksPnl >= 0 ? '+' : ''}
                {formatCurrency(stocksPnl, { compact: false })}
              </h3>
              <p className={`text-xs font-semibold mt-1.5 ${signClass(stocksPnlPercent)}`}>
                {formatPercent(stocksPnlPercent)} returns
              </p>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Unique Shares
              </p>
              <h3 className="text-2xl font-extrabold text-primary">
                {stockHoldings.length}
              </h3>
              <p className="text-xs text-muted mt-1.5">Across active holdings</p>
            </div>
          </div>

          {/* Visual Charts Section */}
          {stockHoldings.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Allocation Pie Chart */}
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
                  Stock Holdings Allocation
                </h4>
                <div className="h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stockAllocationData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
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
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Valuation']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Value</span>
                    <p className="text-lg font-extrabold text-primary font-mono mt-0.5">
                      ₹{stocksValue.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-2 justify-center max-h-16 overflow-y-auto no-scrollbar">
                  {stockAllocationData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-secondary">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STOCK_COLORS[idx % STOCK_COLORS.length] }}></span>
                      <span>{item.name} ({((item.value / (stocksValue || 1)) * 100).toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns Area Chart */}
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
                  Holdings Unrealized Profit & Loss (P&L)
                </h4>
                <div className="h-[21rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockReturnsData} margin={{ top: 20, right: 15, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="pnlGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
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
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'P&L']}
                      />
                      <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="P&L (₹)"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#pnlGlow)"
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
          {stockHoldings.length > 0 && (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Briefcase size={16} />
                Stock Holdings
              </h4>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Equity Name</th>
                      <th>Symbol</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Avg Cost</th>
                      <th className="text-right">Live Price</th>
                      <th className="text-right">Invested Value</th>
                      <th className="text-right">Current Value</th>
                      <th className="text-right">P&L (% Return)</th>
                      <th className="text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHoldings.map((h) => (
                      <tr key={h.symbol}>
                        <td className="font-semibold text-primary">
                          <a href={`/stocks/${h.symbol}`} className="hover:underline">
                            {h.name}
                          </a>
                        </td>
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
                            onClick={() => handleDeleteHolding(h.symbol)}
                            disabled={deletingSymbol === h.symbol}
                            className="p-1 px-2 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-400 active:scale-95 transition-all text-xs flex items-center justify-center mx-auto"
                            title="Delete entire holding"
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
          )}

          {/* Transactions Section */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <History size={16} />
              Stock Transaction History
            </h4>
            <TransactionTable transactions={stockTxns} onDeleted={handleRefetch} />
          </div>
        </>
      )}

      {/* Transaction modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefetch}
        defaultAssetType="stock"
      />
    </div>
  );
}
