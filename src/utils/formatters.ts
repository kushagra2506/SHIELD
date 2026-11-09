/**
 * Indian Rupee and Metric Formatters
 */

export function formatINR(val: number | null | undefined, compact: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';

  if (compact) {
    const abs = Math.abs(val);
    if (abs >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
      return `₹${(val / 1000).toFixed(1)} K`;
    }
    return `₹${val.toFixed(0)}`;
  }

  // Standard Indian comma separator notation (en-IN)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  } catch {
    return `₹${val.toLocaleString('en-IN')}`;
  }
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

export function formatPercent(val: number | null | undefined, isAlreadyPct: boolean = false): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const num = isAlreadyPct ? val : val * 100;
  return `${num.toFixed(2)}%`;
}

export function formatHours(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0 hrs';
  return `${val.toFixed(1)} hrs`;
}

