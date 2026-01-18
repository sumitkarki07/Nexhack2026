/**
 * Formatting utilities for display
 */

/**
 * Format price as percentage
 */
export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}%`;
}

/**
 * Format price as cents
 */
export function formatCents(price: number): string {
  return `${(price * 100).toFixed(1)}¢`;
}

/**
 * Format price change with sign and color indicator
 */
export function formatPriceChange(change: number): {
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.001;
  const sign = isPositive ? '+' : '';
  return {
    text: isNeutral ? '0.0%' : `${sign}${(change * 100).toFixed(1)}%`,
    isPositive,
    isNeutral,
  };
}

/**
 * Format large numbers compactly
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format USD currency
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  // Handle null/undefined/invalid dates
  if (!date) {
    return 'N/A';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is invalid
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return 'N/A';
  }

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'Today';
    if (absDays === 1) return 'Yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `In ${Math.floor(diffDays / 30)} months`;
  return d.toLocaleDateString();
}

/**
 * Format date as short string
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  // Handle null/undefined/invalid dates
  if (!date) {
    return 'N/A';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is invalid
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return 'N/A';
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format timestamp for charts
 */
export function formatChartTime(timestamp: number, range: string): string {
  const d = new Date(timestamp);
  
  switch (range) {
    case '1H':
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    case '24H':
      return d.toLocaleTimeString('en-US', { hour: 'numeric' });
    case '7D':
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    case '30D':
    case 'ALL':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse URL-safe ID
 */
export function encodeMarketId(id: string): string {
  return encodeURIComponent(id);
}

export function decodeMarketId(encoded: string): string {
  return decodeURIComponent(encoded);
}
