import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

// Accurate SIP calculator — monthly end-of-period compounding
function calculateSIP(params: {
  monthlySip: number;
  annualReturn: number; // percentage e.g. 12.0
  years: number;
  expenseRatio: number; // e.g. 1.5
  stepUpPercent: number; // e.g. 10.0 per year
}): {
  totalInvested: number;
  finalValue: number;
  profit: number;
  estimatedFees: number;
  netFinalValue: number;
  yearlyBreakdown: Array<{
    year: number;
    monthlySip: number;
    investedSoFar: number;
    valueAtYearEnd: number;
  }>;
} {
  // Effective monthly return after expense ratio drag
  const effectiveAnnualReturn = params.annualReturn / 100 - params.expenseRatio / 100;
  const r = effectiveAnnualReturn / 12; // monthly rate

  const grossR = (params.annualReturn / 100) / 12; // for fee calculation

  let totalInvested = 0;
  let corpus = 0;
  let grossCorpus = 0;
  let currentMonthlySip = params.monthlySip;

  const yearlyBreakdown: ReturnType<typeof calculateSIP>['yearlyBreakdown'] = [];

  for (let year = 1; year <= params.years; year++) {
    if (year > 1 && params.stepUpPercent > 0) {
      currentMonthlySip = currentMonthlySip * (1 + params.stepUpPercent / 100);
    }
    for (let month = 1; month <= 12; month++) {
      // End-of-period contribution
      corpus = corpus * (1 + r) + currentMonthlySip;
      grossCorpus = grossCorpus * (1 + grossR) + currentMonthlySip;
      totalInvested += currentMonthlySip;
    }
    yearlyBreakdown.push({
      year,
      monthlySip: Math.round(currentMonthlySip),
      investedSoFar: Math.round(totalInvested),
      valueAtYearEnd: Math.round(corpus),
    });
  }

  const finalValue = Math.round(corpus);
  const profit = finalValue - Math.round(totalInvested);
  const estimatedFees = Math.round(grossCorpus - corpus);
  const netFinalValue = finalValue;

  return {
    totalInvested: Math.round(totalInvested),
    finalValue,
    profit,
    estimatedFees,
    netFinalValue,
    yearlyBreakdown,
  };
}

function ResultCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}) {
  const color =
    highlight === 'positive'
      ? 'var(--positive)'
      : highlight === 'negative'
      ? 'var(--negative)'
      : 'var(--text-primary)';

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export function SIPCalculatorPage() {
  const [monthlySip, setMonthlySip] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [expenseRatio, setExpenseRatio] = useState(0.5);
  const [stepUpPercent, setStepUpPercent] = useState(0);
  const [showTable, setShowTable] = useState(false);

  const result = calculateSIP({
    monthlySip,
    annualReturn,
    years,
    expenseRatio,
    stepUpPercent,
  });

  const returnPercent = result.totalInvested > 0
    ? ((result.profit / result.totalInvested) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          SIP Calculator
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Monthly end-of-period compounding · Expense ratio modelled as annual return drag
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div
          className="rounded-xl p-6 space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Parameters
          </h2>

          {[
            {
              label: 'Monthly SIP (₹)',
              value: monthlySip,
              min: 500,
              max: 200000,
              step: 500,
              setter: setMonthlySip,
            },
            {
              label: 'Expected Annual Return (%)',
              value: annualReturn,
              min: 1,
              max: 30,
              step: 0.5,
              setter: setAnnualReturn,
            },
            {
              label: 'Investment Period (years)',
              value: years,
              min: 1,
              max: 40,
              step: 1,
              setter: setYears,
            },
            {
              label: 'Expense Ratio (%)',
              value: expenseRatio,
              min: 0,
              max: 3,
              step: 0.05,
              setter: setExpenseRatio,
            },
            {
              label: 'Annual Step-up (%)',
              value: stepUpPercent,
              min: 0,
              max: 30,
              step: 1,
              setter: setStepUpPercent,
            },
          ].map((field) => (
            <div key={field.label}>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {field.label}
                </label>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {field.value}
                </span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={(e) => field.setter(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Monthly SIP" value={formatCurrency(monthlySip, { compact: false, decimals: 0 })} />
            <ResultCard
              label="Total Invested"
              value={formatCurrency(result.totalInvested, { compact: true, decimals: 2 })}
            />
            <ResultCard
              label="Estimated Value"
              value={formatCurrency(result.finalValue, { compact: true, decimals: 2 })}
              highlight="positive"
            />
            <ResultCard
              label="Total Profit"
              value={formatCurrency(result.profit, { compact: true, decimals: 2 })}
              highlight="positive"
            />
            <ResultCard
              label="Return"
              value={`${returnPercent.toFixed(1)}%`}
              highlight="positive"
            />
            <ResultCard
              label="Est. Fee Impact"
              value={formatCurrency(result.estimatedFees, { compact: true, decimals: 2 })}
              highlight="negative"
            />
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            * Expense ratio is modelled as an annual drag on the effective return.
            Actual impact may vary. This is an estimate.
          </p>

          <button
            onClick={() => setShowTable((p) => !p)}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: 'var(--accent)' }}
          >
            <BarChart3 size={12} />
            {showTable ? 'Hide' : 'Show'} year-by-year breakdown
          </button>
        </div>
      </div>

      {/* Yearly breakdown */}
      {showTable && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Monthly SIP</th>
                  <th>Invested So Far</th>
                  <th>Portfolio Value</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {result.yearlyBreakdown.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{formatCurrency(row.monthlySip, { compact: false, decimals: 0 })}</td>
                    <td>{formatCurrency(row.investedSoFar, { compact: true })}</td>
                    <td style={{ color: 'var(--positive)', fontWeight: 600 }}>
                      {formatCurrency(row.valueAtYearEnd, { compact: true })}
                    </td>
                    <td>
                      {formatCurrency(row.valueAtYearEnd - row.investedSoFar, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
