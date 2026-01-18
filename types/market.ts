/**
 * Market Types for Polymarket Data
 */

export interface Market {
  id: string;
  question: string;
  slug: string;
  category: string;
  endDate: string;
  volume: number;
  volume24hr?: number;
  liquidity: number;
  outcomes: MarketOutcome[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  resolutionOutcome?: string;
  imageUrl?: string;
  description?: string;
  tags?: string[];
  // Additional fields from Polymarket API
  featured?: boolean;
  new?: boolean;
  restricted?: boolean;
  resolutionSource?: string;
  startDate?: string;
  marketMakerAddress?: string;
  // Price change fields
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  // Orderbook data
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  // Internal field for URL generation
  conditionId?: string;
  // Event slug for nested URL format: /event/{eventSlug}/{marketSlug}
  eventSlug?: string;
}

export interface MarketOutcome {
  id: string;
  name: string; // "Yes" or "No" typically
  price: number; // 0-1 probability
  priceChange24h: number; // percentage change
}

export interface MarketWithHistory extends Market {
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface MarketCategory {
  id: string;
  label: string;
  count?: number;
}

export interface MarketSearchParams {
  query?: string;
  category?: string;
  sortBy?: 'volume' | 'recent' | 'volatility' | 'change';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MarketSearchResponse {
  markets: Market[];
  total: number;
  hasMore: boolean;
}

export type TimeRange = '1H' | '24H' | '7D' | '30D' | 'ALL';

export interface HistoryParams {
  marketId: string;
  range: TimeRange;
}

// Sparkline data for market cards
export interface SparklineData {
  prices: number[];
  change24h: number;
  isUp: boolean;
}

// Categories for filtering
export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: 'all', label: 'All Markets' },
  { id: 'politics', label: 'Politics' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'sports', label: 'Sports' },
  { id: 'pop-culture', label: 'Pop Culture' },
  { id: 'business', label: 'Business' },
  { id: 'science', label: 'Science' },
  { id: 'world', label: 'World' },
];
