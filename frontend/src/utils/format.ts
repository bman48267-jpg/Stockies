/**
 * Format a number in Indian numbering system (lakhs/crores)
 */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format a currency value in ₹ with Indian abbreviations
 * e.g. 125000 → ₹1.25 L, 24500000 → ₹2.45 Cr
 */
export function formatCurrency(
  value: number | null | undefined,
  options: { compact?: boolean; decimals?: number } = {}
): string {
  if (value == null) return '—';

  const { compact = true, decimals = 2 } = options;

  if (!compact) {
    return `₹${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)}`;
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_00_00_000) {
    // Crores
    return `${sign}₹${(abs / 1_00_00_000).toFixed(decimals)} Cr`;
  }
  if (abs >= 1_00_000) {
    // Lakhs
    return `${sign}₹${(abs / 1_00_000).toFixed(decimals)} L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(decimals)} K`;
  }
  return `${sign}₹${abs.toFixed(decimals)}`;
}

/**
 * Format a percentage value
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null) return '—';
  const formatted = value.toFixed(decimals);
  return `${value >= 0 ? '+' : ''}${formatted}%`;
}

/**
 * Format a percentage without the + prefix
 */
export function formatPercentPlain(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large market-cap number
 */
export function formatMarketCap(value: number | null | undefined): string {
  return formatCurrency(value, { compact: true, decimals: 2 });
}

/**
 * Format a price value
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—';
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/**
 * Format a date string to readable Indian format
 */
export function formatDate(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateStr) return '—';
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat('en-IN', defaultOptions).format(
      new Date(dateStr)
    );
  } catch {
    return dateStr;
  }
}

/**
 * Format time with IST timezone
 */
export function formatTime(
  dateStr: string | null | undefined
): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

/**
 * Return the sign class for a value:
 * positive → 'text-positive', negative → 'text-negative'
 */
export function signClass(value: number | null | undefined): string {
  if (value == null) return 'text-muted';
  if (value > 0) return 'text-positive';
  if (value < 0) return 'text-negative';
  return 'text-secondary';
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if market is likely open right now (Indian market hours)
 * Returns a rough UI indicator — not guaranteed accurate.
 */
export function getMarketStatusLabel(): {
  label: string;
  isOpen: boolean;
  color: string;
} {
  const now = new Date();
  const ist = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const day = ist.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(ist.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(ist.find((p) => p.type === 'minute')?.value ?? '0', 10);

  const isWeekend = day === 'Sat' || day === 'Sun';
  const totalMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  if (isWeekend) return { label: 'Market Closed', isOpen: false, color: 'text-negative' };
  if (totalMinutes >= openMinutes && totalMinutes <= closeMinutes) {
    return { label: 'Market Open', isOpen: true, color: 'text-positive' };
  }
  if (totalMinutes >= 9 * 60 && totalMinutes < openMinutes) {
    return { label: 'Pre-Open', isOpen: false, color: 'text-warning' };
  }
  return { label: 'Market Closed', isOpen: false, color: 'text-negative' };
}
