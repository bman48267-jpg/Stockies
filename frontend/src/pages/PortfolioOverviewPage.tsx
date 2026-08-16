import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  PieChart as PieIcon,
  Plus,
  RefreshCw,
  AlertTriangle,
  Award,
  Trash2,
} from 'lucide-react';
import { getPortfolioSummary, getTransactions, deleteTransaction, type PortfolioSummary } from '@/api';
import { formatCurrency, formatPercent, signClass } from '@/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionModal } from '@/components/portfolio/TransactionModal';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as ChartTooltip, 
  AreaChart, 
  Area, 
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid 
} from 'recharts';

export function PortfolioOverviewPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

  const { data: summary, isLoading, isError, refetch } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio-summary'],
    queryFn: getPortfolioSummary,
  });

  const handleTxnAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    queryClient.invalidateQueries({ queryKey: ['portfolio-transactions'] });
  };

  const handleDeleteHolding = async (
    symbol: string,
    assetType: 'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond'
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete your entire exposure to ${symbol}? This will permanently remove all transactions registered under this asset.`
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
    } catch (err) {
      console.error(err);
      alert(`Failed to delete holding: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingSymbol(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div
        className="rounded-2xl p-8 text-center space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <TrendingDown size={40} className="mx-auto text-negative" />
        <h3 className="text-lg font-bold">Failed to load Portfolio</h3>
        <p className="text-sm text-secondary">
          An error occurred while fetching your portfolio summary dashboard.
        </p>
        <button onClick={() => refetch()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const {
    total_invested,
    current_value,
    total_pnl,
    total_pnl_percent,
    day_change,
    day_change_percent,
    xirr = 0.0,
    allocation,
    holdings,
  } = summary;

  // Donut chart data for allocations
  const allocationData = [
    { name: 'Stocks', value: allocation.stocks_value, color: 'var(--accent)' },
    { name: 'Mutual Funds', value: allocation.mf_value, color: '#a855f7' }, // Purple-500
    { name: 'Emergency Funds', value: allocation.emergency_fund_value, color: '#3b82f6' }, // Blue-500
    { name: 'Fixed Deposits', value: allocation.fixed_deposit_value, color: '#eab308' }, // Yellow-500
    { name: 'Bonds', value: allocation.bond_value, color: '#14b8a6' }, // Teal-500
  ].filter((item) => item.value > 0);

  // Fallback if empty allocation
  if (allocationData.length === 0) {
    allocationData.push({ name: 'No Assets', value: 1, color: 'var(--text-muted)' });
  }

  // Cost vs Value stats chart (cumulative across holdings)
  let cumCost = 0;
  let cumVal = 0;
  const lineChartData = [...holdings]
    .sort((a, b) => a.invested_amount - b.invested_amount)
    .map((h) => {
      cumCost += h.invested_amount;
      cumVal += h.current_value;
      return {
        name: h.name.length > 8 ? h.name.slice(0, 8) + '...' : h.name,
        Invested: Number(cumCost.toFixed(2)),
        Value: Number(cumVal.toFixed(2)),
      };
    });

  // Holding contribution data
  const holdingsPnlData = holdings.map((h) => ({
    name: h.name.length > 12 ? h.name.slice(0, 12) + '...' : h.name,
    pnl: h.unrealized_pnl,
  }));

  // Find top gainer
  const topGainer = holdings.length > 0
    ? [...holdings].sort((a, b) => b.unrealized_pnl_percent - a.unrealized_pnl_percent)[0]
    : null;

  // Concentration analysis
  const maxWeight = holdings.length > 0
    ? Math.max(...holdings.map((h) => (h.current_value / (current_value || 1)) * 100))
    : 0;

  const concentrationRisk = maxWeight > 50
    ? { level: 'High Concentration', color: 'var(--negative)', description: 'One asset dominates >50% of value. Diversifying could lower volatility.' }
    : maxWeight > 25
    ? { level: 'Moderate Concentration', color: '#f59e0b', description: 'Largest asset is 25% - 50% of portfolio value.' }
    : { level: 'Optimally Diversified', color: 'var(--positive)', description: 'All assets represent less than 25% of overall value.' };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-token hover:bg-muted text-secondary hover:text-primary transition-all"
            title="Refresh Portfolio"
          >
            <RefreshCw size={15} />
          </button>
          <span className="text-xs text-muted">Auto-enriched with real-time quotes</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-[0.98] transition-all bg-accent text-white"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Main consolidated statistics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Value */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Current Value
          </p>
          <h3 className="text-2xl font-extrabold text-primary font-mono">
            {formatCurrency(current_value, { compact: false })}
          </h3>
          <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
            Invested:{' '}
            <span className="font-semibold text-secondary font-mono">
              {formatCurrency(total_invested, { compact: true })}
            </span>
          </p>
        </div>

        {/* Total Returns absolute & pct */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Total Profit & Loss
          </p>
          <h3 className={`text-2xl font-extrabold flex items-center gap-1 font-mono ${signClass(total_pnl)}`}>
            {total_pnl >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            {formatCurrency(total_pnl, { compact: false })}
          </h3>
          <p className={`text-xs font-semibold mt-1.5 ${signClass(total_pnl)}`}>
            {formatPercent(total_pnl_percent)} returns
          </p>
        </div>

        {/* Extended Internal Rate of Return (XIRR) */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            XIRR Return (Annualized)
          </p>
          <h3 className={`text-2xl font-extrabold flex items-center gap-1 font-mono ${signClass(xirr)}`}>
            <TrendingUp size={22} className={signClass(xirr)} />
            {xirr.toFixed(2)}%
          </h3>
          <p className="text-xs text-muted mt-1.5">Consolidated cashflow-weighted IRR</p>
        </div>

        {/* Day's gain / loss */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            Today's Change
          </p>
          <h3 className={`text-2xl font-extrabold flex items-center gap-1 font-mono ${signClass(day_change)}`}>
            {day_change >= 0 ? '+' : ''}
            {day_change.toFixed(2)}
          </h3>
          <p className={`text-xs font-semibold mt-1.5 ${signClass(day_change_percent)}`}>
            {day_change_percent >= 0 ? '+' : ''}
            {day_change_percent.toFixed(2)}%
          </p>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Briefcase size={44} className="mx-auto text-muted mb-4 opacity-70" />
          <h3 className="text-lg font-bold">Your Portfolio is Empty</h3>
          <p className="text-sm text-secondary mt-1 max-w-sm mx-auto">
            You don't have any financial transactions recorded yet. Tap "Add Transaction" to add your first stock or mutual fund record.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 bg-accent text-white">
            <Plus size={16} />
            Record Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Row 1 Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Value comparison bar chart */}
            <div
              className="lg:col-span-2 rounded-2xl p-5 space-y-4"
              style={{
                backdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(24, 24, 27, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
            >
              <h4 className="text-sm font-bold text-primary">Invested Cost vs Current Market Value</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={lineChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="cumCostGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="cumValGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 9 }} />
                    <YAxis
                      stroke="var(--text-muted)"
                      tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                      tick={{ fontSize: 9 }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 18, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        borderRadius: '12px',
                      }}
                      formatter={(value: any) => [`₹${parseInt(value).toLocaleString('en-IN')}`]}
                    />
                    <Area
                      type="monotone"
                      dataKey="Invested"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fill="url(#cumCostGlow)"
                      dot={{ r: 3 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Value"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="url(#cumValGlow)"
                      dot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation Pie display */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <PieIcon size={16} />
                Asset Allocation
              </h4>
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="48%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(v: any) => [`₹${parseFloat(v).toLocaleString('en-IN')}`]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute text-center mt-[-30px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Total Assets
                  </p>
                  <p className="text-sm font-extrabold text-primary select-none mt-0.5">
                    {formatCurrency(current_value, { compact: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Advanced Charts & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Horizontal P&L contribution by Asset */}
            <div
              className="lg:col-span-2 rounded-2xl p-5 space-y-4"
              style={{
                backdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(24, 24, 27, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
            >
              <h4 className="text-sm font-bold text-primary">Asset returns Distribution (Unrealized P&L)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={holdingsPnlData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="pnlOverviewGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 9 }} />
                    <YAxis
                      stroke="var(--text-muted)"
                      tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                      tick={{ fontSize: 9 }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 18, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        borderRadius: '12px',
                      }}
                      formatter={(v: any) => [`₹${parseInt(v).toLocaleString('en-IN')}`, 'P&L']}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#pnlOverviewGlow)"
                      dot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Smart performance & diversification panels */}
            <div className="space-y-4">
              {/* Top Performer Card */}
              {topGainer && (
                <div
                  className="rounded-2xl p-5 space-y-3"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    Top Performer
                  </p>
                  <div>
                    <h5 className="font-bold text-primary text-sm truncate">{topGainer.name}</h5>
                    <p className="text-xs text-muted font-mono uppercase mt-0.5">{topGainer.symbol}</p>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[10px] text-muted">Returns:</span>
                    <span className="text-base font-bold text-positive font-mono">
                      +{topGainer.unrealized_pnl_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Diversification & risk advice card */}
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <AlertTriangle size={14} style={{ color: concentrationRisk.color }} />
                  Portfolio Health Checker
                </p>
                <div>
                  <h5 className="font-bold text-sm" style={{ color: concentrationRisk.color }}>
                    {concentrationRisk.level}
                  </h5>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    {concentrationRisk.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-token flex justify-between items-baseline">
                  <span className="text-[10px] text-muted">Max Holding Weight:</span>
                  <span className="text-xs font-semibold font-mono text-secondary">
                    {maxWeight.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Consolidated Holdings list */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between items-center pr-2">
              <h4 className="text-sm font-bold text-primary">Aggregated Holdings</h4>
              <span className="text-xs text-muted font-bold font-mono">
                {holdings.length} Active Securities
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Category</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Avg Price</th>
                    <th className="text-right">Live Price</th>
                    <th className="text-right">Invested</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-right">Total Return</th>
                    <th className="text-right">Day Return</th>
                    <th className="text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const detailUrl =
                      h.asset_type === 'stock'
                        ? `/stocks/${h.symbol}`
                        : h.asset_type === 'mutual_fund'
                        ? `/mutual-funds/${h.symbol}`
                        : undefined;
                    return (
                      <tr key={`${h.asset_type}:${h.symbol}`}>
                        <td className="font-semibold text-primary">
                          {detailUrl ? (
                            <a href={detailUrl} className="hover:underline flex flex-col">
                              <span>{h.name}</span>
                              <span className="text-[10px] text-muted font-mono uppercase">
                                {h.symbol}
                              </span>
                            </a>
                          ) : (
                            <div className="flex flex-col">
                              <span>{h.name}</span>
                              <span className="text-[10px] text-muted font-mono uppercase">
                                {h.symbol}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all"
                            style={{
                              backgroundColor:
                                h.asset_type === 'stock'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : h.asset_type === 'mutual_fund'
                                  ? 'rgba(168, 85, 247, 0.1)'
                                  : h.asset_type === 'emergency_fund'
                                  ? 'rgba(59, 130, 246, 0.1)'
                                  : h.asset_type === 'fixed_deposit'
                                  ? 'rgba(234, 179, 8, 0.1)'
                                  : 'rgba(20, 184, 166, 0.1)',
                              color:
                                h.asset_type === 'stock'
                                  ? '#10b981'
                                  : h.asset_type === 'mutual_fund'
                                  ? '#a855f7'
                                  : h.asset_type === 'emergency_fund'
                                  ? '#3b82f6'
                                  : h.asset_type === 'fixed_deposit'
                                  ? '#eab308'
                                  : '#14b8a6',
                            }}
                          >
                            {h.asset_type === 'stock'
                              ? 'Stock'
                              : h.asset_type === 'mutual_fund'
                              ? 'MF'
                              : h.asset_type === 'emergency_fund'
                              ? 'Emergency'
                              : h.asset_type === 'fixed_deposit'
                              ? 'FD'
                              : 'Bond'}
                          </span>
                        </td>
                        <td className="text-right font-mono font-medium">{h.quantity}</td>
                        <td className="text-right font-mono text-secondary">
                          ₹{h.avg_price.toFixed(2)}
                        </td>
                        <td className="text-right font-mono font-semibold">
                          ₹{h.current_price.toFixed(2)}
                        </td>
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
                        <td className={`text-right font-mono font-semibold ${signClass(h.day_change)}`}>
                          <div>{h.day_change !== undefined && h.day_change >= 0 ? '+' : ''}{h.day_change?.toLocaleString('en-IN') ?? '—'}</div>
                          <div className="text-[10px] font-medium">
                            {h.day_change_percent !== undefined ? formatPercent(h.day_change_percent) : '—'}
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleDeleteHolding(h.symbol, h.asset_type)}
                            disabled={deletingSymbol === h.symbol}
                            className="p-1 px-2 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-400 active:scale-95 transition-all text-xs flex items-center justify-center mx-auto"
                            title="Delete entire holding"
                          >
                            <Trash2 size={13} className={deletingSymbol === h.symbol ? 'animate-pulse' : ''} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Shared creation Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTxnAdded}
      />
    </div>
  );
}
