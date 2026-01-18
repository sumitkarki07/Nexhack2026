/**
 * Optimized Polymarket API Client
 * Fetches real-time data from Polymarket Gamma API and CLOB API
 * 
 * Key optimizations:
 * - Direct pagination (no full dataset crawl)
 * - Single-flight request deduplication
 * - Stale-while-revalidate caching
 * - Concurrency-limited CLOB enrichment
 * 
 * Based on: https://docs.polymarket.com/quickstart/fetching-data
 */

import {
  Market,
  MarketOutcome,
  MarketSearchParams,
  MarketSearchResponse,
  PricePoint,
  TimeRange,
} from '@/types';
import {
  apiCache,
  CACHE_TTL,
  cacheKey,
  singleFlight,
  staleWhileRevalidate,
  clobLimiter,
} from './cache';

// Polymarket API endpoints
const GAMMA_API_URL = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';
const CLOB_API_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const REQUEST_TIMEOUT = 10000; // 10 seconds (reduced from 15)

// Response metadata for instrumentation
export interface FetchMeta {
  fetchedAt: number;
  cache: 'HIT' | 'MISS' | 'STALE';
  source: ('gamma' | 'clob')[];
  durationMs: number;
}

export interface MarketSearchResponseWithMeta extends MarketSearchResponse {
  meta: FetchMeta;
}

// Raw Gamma API response types
interface GammaMarketRaw {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource?: string;
  endDate: string;
  startDate?: string;
  liquidity: string | number;
  volume: string | number;
  volume24hr?: number;
  active: boolean;
  closed: boolean;
  marketMakerAddress?: string;
  createdAt: string;
  updatedAt: string;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  outcomes: string; // JSON string like "[\"Yes\", \"No\"]"
  outcomePrices: string; // JSON string like "[\"0.65\", \"0.35\"]"
  clobTokenIds?: string; // JSON string with token IDs
  category?: string;
  description?: string;
  image?: string;
  icon?: string;
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
  oneWeekPriceChange?: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
}

interface GammaEventRaw {
  id: string;
  slug: string;
  title: string;
  description?: string;
  active: boolean;
  closed: boolean;
  liquidity: string | number;
  volume: string | number;
  volume24hr?: number;
  markets?: GammaMarketRaw[];
  image?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; label: string; slug: string }>;
}

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'no-store', // Disable Next.js caching
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'PulseForge/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 1000;
        console.warn(`[Polymarket] Rate limited, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle server errors with retry
      if (response.status >= 500 && attempt < retries - 1) {
        const waitTime = (attempt + 1) * 500;
        console.warn(`[Polymarket] Server error ${response.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries - 1) {
        const waitTime = (attempt + 1) * 500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * Transform Gamma API market response to our Market type
 */
function transformGammaMarket(
  gamma: GammaMarketRaw,
  eventTitle?: string,
  eventTags?: Array<{ label: string }>,
  eventSlug?: string
): Market {
  let outcomes: MarketOutcome[] = [];
  let clobTokenIds: string[] = [];

  try {
    const outcomeNames = JSON.parse(gamma.outcomes || '["Yes", "No"]') as string[];
    const outcomePrices = JSON.parse(gamma.outcomePrices || '[0.5, 0.5]') as string[];

    if (gamma.clobTokenIds) {
      clobTokenIds = JSON.parse(gamma.clobTokenIds) as string[];
    }

    const priceChange24h = gamma.oneDayPriceChange || 0;

    outcomes = outcomeNames.map((name, i) => ({
      id: clobTokenIds[i] || `${gamma.id}-${i}`,
      name,
      price: parseFloat(outcomePrices[i]) || 0.5,
      priceChange24h: i === 0 ? priceChange24h : -priceChange24h,
    }));
  } catch {
    outcomes = [
      { id: `${gamma.id}-0`, name: 'Yes', price: 0.5, priceChange24h: 0 },
      { id: `${gamma.id}-1`, name: 'No', price: 0.5, priceChange24h: 0 },
    ];
  }

  // Determine category
  let category = gamma.category || 'other';
  const questionLower = gamma.question.toLowerCase();
  const titleLower = (eventTitle || '').toLowerCase();

  if (eventTags && eventTags.length > 0) {
    category = eventTags[0].label.toLowerCase();
  }

  if (category === 'other') {
    if (questionLower.includes('bitcoin') || questionLower.includes('crypto') ||
        questionLower.includes('eth') || questionLower.includes('btc') ||
        titleLower.includes('bitcoin') || titleLower.includes('crypto')) {
      category = 'crypto';
    } else if (questionLower.includes('trump') || questionLower.includes('election') ||
               questionLower.includes('president') || questionLower.includes('congress') ||
               questionLower.includes('senate') || questionLower.includes('governor')) {
      category = 'politics';
    } else if (questionLower.includes('nba') || questionLower.includes('nfl') ||
               questionLower.includes('mlb') || questionLower.includes('soccer') ||
               questionLower.includes('super bowl') || questionLower.includes('championship')) {
      category = 'sports';
    } else if (questionLower.includes('gdp') || questionLower.includes('inflation') ||
               questionLower.includes('fed') || questionLower.includes('interest rate') ||
               questionLower.includes('recession')) {
      category = 'economy';
    } else if (questionLower.includes('war') || questionLower.includes('ukraine') ||
               questionLower.includes('russia') || questionLower.includes('nato')) {
      category = 'world';
    }
  }

  const totalVolume = typeof gamma.volume === 'string' ? parseFloat(gamma.volume) : (gamma.volume || 0);

  let cleanSlug = gamma.slug || '';
  if (cleanSlug) {
    try {
      cleanSlug = decodeURIComponent(cleanSlug);
    } catch {
      // Use as-is
    }
    cleanSlug = cleanSlug.trim().replace(/^\/|\/$/g, '');
  }

  return {
    id: gamma.id || gamma.conditionId,
    question: gamma.question,
    slug: cleanSlug,
    category,
    endDate: gamma.endDate,
    volume: totalVolume,
    volume24hr: gamma.volume24hr || 0,
    liquidity: typeof gamma.liquidity === 'string' ? parseFloat(gamma.liquidity) : (gamma.liquidity || 0),
    outcomes,
    createdAt: gamma.createdAt,
    updatedAt: gamma.updatedAt,
    active: gamma.active,
    closed: gamma.closed,
    resolved: gamma.closed && !gamma.active,
    imageUrl: gamma.image || gamma.icon,
    description: gamma.description,
    tags: eventTags?.map(t => t.label) || [],
    featured: gamma.featured || false,
    new: gamma.new || false,
    restricted: gamma.restricted || false,
    resolutionSource: gamma.resolutionSource,
    startDate: gamma.startDate,
    marketMakerAddress: gamma.marketMakerAddress,
    priceChange1h: gamma.oneHourPriceChange || 0,
    priceChange24h: gamma.oneDayPriceChange || 0,
    priceChange7d: gamma.oneWeekPriceChange || 0,
    bestBid: gamma.bestBid,
    bestAsk: gamma.bestAsk,
    lastTradePrice: gamma.lastTradePrice,
    conditionId: gamma.conditionId,
    eventSlug: eventSlug,
  };
}

/**
 * Map our sortBy to Gamma API sort parameters
 */
function mapSortToGamma(sortBy: string, sortOrder: string): { sortBy: string; sortDirection: string } {
  const sortMap: Record<string, string> = {
    volume: 'volume',
    recent: 'startDate',
    change: 'oneDayPriceChange',
    volatility: 'oneDayPriceChange',
  };
  
  return {
    sortBy: sortMap[sortBy] || 'volume',
    sortDirection: sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

/**
 * OPTIMIZED: Fetch markets with direct pagination from Gamma API
 * When filtering by category, fetches multiple pages until enough matches are found
 */
async function fetchMarketsFromGamma(params: MarketSearchParams): Promise<{
  markets: Market[];
  total: number;
  hasMore: boolean;
}> {
  const {
    query,
    category,
    sortBy = 'volume',
    sortOrder = 'desc',
    limit = 50,
    offset = 0,
  } = params;

  const categoryLower = category && category !== 'all' ? category.toLowerCase() : null;
  const needsCategoryFilter = !!categoryLower;

  // When filtering by category, we need to fetch more pages to find matches
  // Since category filtering is client-side, we fetch multiple pages until we have enough
  const pageLimit = 100; // Gamma API max per page
  const maxPages = needsCategoryFilter ? 10 : 1; // Fetch up to 10 pages (1000 markets) when filtering
  let allRawMarkets: GammaMarketRaw[] = [];
  let currentOffset = offset;
  let pagesFetched = 0;

  // Fetch pages until we have enough results or hit max pages
  while (pagesFetched < maxPages) {
    const gammaParams = new URLSearchParams();
    gammaParams.set('active', 'true');
    gammaParams.set('closed', 'false');
    gammaParams.set('limit', String(pageLimit));
    gammaParams.set('offset', String(currentOffset));

    // Apply sorting
    const { sortBy: gammaSortBy, sortDirection } = mapSortToGamma(sortBy, sortOrder);
    gammaParams.set('sortBy', gammaSortBy);
    gammaParams.set('sortDirection', sortDirection);

    // Apply search query if present
    if (query && query.trim()) {
      gammaParams.set('_q', query.trim());
    }

    const url = `${GAMMA_API_URL}/markets?${gammaParams.toString()}`;
    
    if (pagesFetched === 0) {
      console.log(`[Polymarket] Fetching markets: ${url}`);
    } else {
      console.log(`[Polymarket] Fetching page ${pagesFetched + 1} for category filter (offset: ${currentOffset})`);
    }

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gamma API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawMarkets: GammaMarketRaw[] = Array.isArray(data) ? data : (data.data || data.results || []);

    if (rawMarkets.length === 0) {
      break; // No more markets
    }

    allRawMarkets.push(...rawMarkets);
    pagesFetched++;

    // If not filtering by category, we only need one page
    if (!needsCategoryFilter) {
      break;
    }

    // Transform and check if we have enough matches
    const transformed = allRawMarkets
      .filter(m => m.id && m.active && !m.closed)
      .map(m => transformGammaMarket(m));

    const filtered = transformed.filter(m => m.category === categoryLower);

    // If we have enough filtered results, stop fetching
    if (filtered.length >= limit + offset) {
      break;
    }

    // If we got fewer than pageLimit, we've reached the end
    if (rawMarkets.length < pageLimit) {
      break;
    }

    currentOffset += pageLimit;
  }

  // Transform all fetched markets
  let markets = allRawMarkets
    .filter(m => m.id && m.active && !m.closed)
    .map(m => transformGammaMarket(m));

  // Apply category filter client-side (Gamma API doesn't have category param)
  if (needsCategoryFilter) {
    markets = markets.filter(m => m.category === categoryLower);
  }

  // For search queries, apply additional client-side filtering for better results
  if (query && query.trim()) {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    markets = markets.filter(market => {
      const searchText = `${market.question} ${market.description || ''} ${market.category}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });
  }

  // Apply pagination to final filtered results
  const paginatedMarkets = markets.slice(offset, offset + limit);
  const hasMore = offset + limit < markets.length;

  // Estimate total based on how many we found
  const estimatedTotal = needsCategoryFilter
    ? Math.max(markets.length, 100) // For category filters, use actual count found
    : allRawMarkets.length >= pageLimit
    ? Math.max(currentOffset + pageLimit, 500) // Estimate if more might exist
    : markets.length; // Exact count if we got all

  if (needsCategoryFilter) {
    console.log(`[Polymarket] Category filter "${category}" found ${markets.length} matches after fetching ${pagesFetched} page(s)`);
  }

  return {
    markets: paginatedMarkets,
    total: estimatedTotal,
    hasMore,
  };
}

/**
 * Fetch total count of ALL markets with pagination (background only).
 * Avoids full transformation and keeps response fast.
 */
async function fetchAllMarketsCountFromGamma(): Promise<number> {
  const pageLimit = 100;
  let offset = 0;
  let totalCount = 0;
  let hasMore = true;

  while (hasMore) {
    const gammaParams = new URLSearchParams();
    gammaParams.set('active', 'true');
    gammaParams.set('closed', 'false');
    gammaParams.set('limit', String(pageLimit));
    gammaParams.set('offset', String(offset));

    const url = `${GAMMA_API_URL}/markets?${gammaParams.toString()}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gamma API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawMarkets: GammaMarketRaw[] = Array.isArray(data) ? data : (data.data || data.results || []);

    // If API returns a count, use it immediately
    const responseCount =
      typeof data?.count === 'number'
        ? data.count
        : typeof data?.total === 'number'
        ? data.total
        : undefined;
    if (responseCount !== undefined) {
      return responseCount;
    }

    totalCount += rawMarkets.length;

    if (rawMarkets.length < pageLimit) {
      hasMore = false;
    } else {
      offset += pageLimit;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return totalCount;
}

/**
 * Enrich markets with CLOB data (prices, volume) - with concurrency limiting
 * Only called for the returned page of markets, not all markets
 */
async function enrichWithCLOB(markets: Market[]): Promise<Market[]> {
  if (markets.length === 0) return markets;

  const enrichPromises = markets.map(market =>
    clobLimiter(async () => {
      const tokenId = market.outcomes[0]?.id;
      if (!tokenId || tokenId.includes('-')) {
        // Skip if no valid CLOB token ID
        return market;
      }

      try {
        const priceUrl = `${CLOB_API_URL}/price?token_id=${encodeURIComponent(tokenId)}&side=buy`;
        const response = await fetchWithTimeout(priceUrl, {}, 1);

        if (response.ok) {
          const data = await response.json();
          const price = parseFloat(data.price);
          if (!isNaN(price) && price > 0 && price <= 1) {
            market.outcomes[0].price = price;
            market.outcomes[1].price = 1 - price;
          }
        }
      } catch {
        // Silently ignore CLOB enrichment failures - use Gamma data
      }

      return market;
    })
  );

  return Promise.all(enrichPromises);
}

/**
 * Main markets fetch function - OPTIMIZED
 * Uses direct pagination, caching, and single-flight deduplication
 */
export async function fetchMarkets(
  params: MarketSearchParams = {}
): Promise<MarketSearchResponseWithMeta> {
  const {
    query,
    category,
    sortBy = 'volume',
    sortOrder = 'desc',
    limit = 50,
    offset = 0,
    all = false,
  } = params;

  const startTime = Date.now();
  const key = cacheKey('markets', query, category, sortBy, sortOrder, limit, offset, all ? 'all' : undefined);

  const shouldFetchAll = all === true && !query && (!category || category === 'all');

  // Use stale-while-revalidate for fast responses
  const { data: cached, status, fetchedAt } = await staleWhileRevalidate<{
    markets: Market[];
    total: number;
    hasMore: boolean;
  }>(
    key,
    async () => {
      // Always fetch only the requested page for speed
      const result = await fetchMarketsFromGamma(params);

      if (shouldFetchAll) {
        // Try to use cached total count for accurate totals
        const countKey = cacheKey('markets', 'all', 'count');
        const cachedCount = apiCache.get<number>(countKey);

        if (cachedCount && cachedCount > 0) {
          result.total = cachedCount;
          result.hasMore = offset + limit < cachedCount;
        } else {
          // Trigger background count refresh (single-flight)
          singleFlight(countKey, async () => {
            const count = await fetchAllMarketsCountFromGamma();
            apiCache.set(countKey, count, CACHE_TTL.MARKETS_ALL_COUNT);
            return count;
          }).catch(() => {
            // Ignore background failures
          });
        }
      }

      // Optionally enrich with CLOB data for live prices
      // Only enrich if we have few markets (to keep it fast)
      if (result.markets.length <= 50) {
        result.markets = await enrichWithCLOB(result.markets);
      }

      return result;
    },
    CACHE_TTL.MARKETS_LIST
  );

  const durationMs = Date.now() - startTime;
  const sources: ('gamma' | 'clob')[] = status === 'MISS' ? ['gamma', 'clob'] : ['gamma'];

  console.log(`[Polymarket] fetchMarkets completed in ${durationMs}ms (cache: ${status})`);

  return {
    markets: cached.markets,
    total: cached.total,
    hasMore: cached.hasMore,
    meta: {
      fetchedAt: fetchedAt ?? startTime,
      cache: status,
      source: sources,
      durationMs,
    },
  };
}

/**
 * Fetch single market detail from Gamma API
 * Also attempts to find the parent event for proper URL generation
 */
export async function fetchMarketDetail(id: string): Promise<Market | null> {
  const key = cacheKey('market', id);

  return singleFlight(key, async () => {
    const cached = apiCache.get<Market>(key);
    if (cached) return cached;

    try {
      // Try fetching by ID first
      let url = `${GAMMA_API_URL}/markets/${encodeURIComponent(id)}`;
      console.log('[Polymarket] Fetching market detail:', url);

      let response = await fetchWithTimeout(url);

      // If 404, try by slug
      if (response.status === 404) {
        url = `${GAMMA_API_URL}/markets?slug=${encodeURIComponent(id)}`;
        response = await fetchWithTimeout(url);

        if (response.ok) {
          const data = await response.json();
          const markets = Array.isArray(data) ? data : [data];
          if (markets.length > 0) {
            const market = transformGammaMarket(markets[0]);
            apiCache.set(key, market, CACHE_TTL.MARKET_DETAIL);
            return market;
          }
        }
        return null;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const gamma: GammaMarketRaw = await response.json();
      
      // Debug: log the raw slug data from API
      console.log('[Polymarket] Market detail raw data:', {
        id: gamma.id,
        slug: gamma.slug,
        conditionId: gamma.conditionId,
        question: gamma.question?.substring(0, 50),
      });
      
      const market = transformGammaMarket(gamma);

      // Don't try to look up the parent event - it causes incorrect data
      // The market's own slug should work with /event/{slug} format

      apiCache.set(key, market, CACHE_TTL.MARKET_DETAIL);
      return market;
    } catch (error) {
      console.error('[Polymarket] Market detail error:', error);

      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error(`Market "${id}" not found.`);
        }
        if (error.message.includes('timeout') || error.message.includes('aborted')) {
          throw new Error('Request timed out. Please try again.');
        }
      }

      throw error;
    }
  });
}

/**
 * Fetch all markets for an event
 */
export async function fetchEventMarkets(eventSlug: string): Promise<Market[]> {
  const key = cacheKey('eventMarkets', eventSlug);

  return singleFlight(key, async () => {
    const cached = apiCache.get<Market[]>(key);
    if (cached) return cached;

    try {
      const url = `${GAMMA_API_URL}/events?slug=${encodeURIComponent(eventSlug)}`;
      const response = await fetchWithTimeout(url);

      if (!response.ok) return [];

      const data = await response.json();
      const events = Array.isArray(data) ? data : [data];

      if (events.length === 0 || !events[0].markets) return [];

      const event = events[0];
      const markets = event.markets.map((m: GammaMarketRaw) =>
        transformGammaMarket(m, event.title, event.tags, event.slug)
      );

      apiCache.set(key, markets, CACHE_TTL.MARKET_DETAIL);
      return markets;
    } catch (error) {
      console.error('[Polymarket] Event markets error:', error);
      return [];
    }
  });
}

/**
 * Fetch price history for a market
 */
export async function fetchMarketHistory(
  marketId: string,
  range: TimeRange
): Promise<PricePoint[]> {
  const key = cacheKey('history', marketId, range);
  const cached = apiCache.get<PricePoint[]>(key);
  if (cached) return cached;

  try {
    const now = Date.now();
    const rangeConfig: Record<TimeRange, { fidelity: number; startTime: number; points: number }> = {
      '1H': { fidelity: 1, startTime: now - 60 * 60 * 1000, points: 60 },
      '24H': { fidelity: 15, startTime: now - 24 * 60 * 60 * 1000, points: 96 },
      '7D': { fidelity: 60, startTime: now - 7 * 24 * 60 * 60 * 1000, points: 168 },
      '30D': { fidelity: 360, startTime: now - 30 * 24 * 60 * 60 * 1000, points: 120 },
      ALL: { fidelity: 1440, startTime: now - 365 * 24 * 60 * 60 * 1000, points: 365 },
    };

    const config = rangeConfig[range];
    const market = await fetchMarketDetail(marketId);
    const tokenId = market?.outcomes[0]?.id;

    let history: PricePoint[] = [];

    const endpoints = [
      tokenId ? `${CLOB_API_URL}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${config.fidelity}m&fidelity=${config.fidelity}` : null,
      `${GAMMA_API_URL}/prices?market=${encodeURIComponent(marketId)}&fidelity=${config.fidelity}&startTs=${Math.floor(config.startTime / 1000)}&endTs=${Math.floor(now / 1000)}`,
      `${GAMMA_API_URL}/markets/${encodeURIComponent(marketId)}/prices?fidelity=${config.fidelity}`,
    ].filter(Boolean) as string[];

    for (const url of endpoints) {
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) continue;

        const data = await response.json();
        let rawPoints: Array<{ t?: number | string; p?: number | string; price?: number | string; timestamp?: number | string }> = [];

        if (data.history) rawPoints = data.history;
        else if (data.prices) rawPoints = data.prices;
        else if (Array.isArray(data)) rawPoints = data;

        history = rawPoints.map(point => {
          const timestamp = point.t || point.timestamp;
          const price = point.p || point.price;
          return {
            timestamp: typeof timestamp === 'number'
              ? (timestamp < 1e12 ? timestamp * 1000 : timestamp)
              : Date.parse(String(timestamp)),
            price: typeof price === 'number' ? price : parseFloat(String(price)),
          };
        }).filter(p => !isNaN(p.timestamp) && !isNaN(p.price) && p.price >= 0 && p.price <= 1);

        if (history.length > 0) break;
      } catch {
        continue;
      }
    }

    // Generate synthetic if no data
    if (history.length === 0 && market) {
      history = generateSyntheticHistory(
        market.outcomes[0]?.price || 0.5,
        market.outcomes[0]?.priceChange24h || 0,
        config.startTime,
        now,
        config.points
      );
    }

    history.sort((a, b) => a.timestamp - b.timestamp);

    if (history.length > 0) {
      apiCache.set(key, history, CACHE_TTL.PRICE_HISTORY);
    }

    return history;
  } catch (error) {
    console.error('[Polymarket] Price history error:', error);
    return [];
  }
}

/**
 * Generate synthetic price history
 */
function generateSyntheticHistory(
  currentPrice: number,
  priceChange24h: number,
  startTime: number,
  endTime: number,
  numPoints: number
): PricePoint[] {
  const history: PricePoint[] = [];
  const timeStep = (endTime - startTime) / numPoints;
  const timeRangeHours = (endTime - startTime) / (1000 * 60 * 60);
  const scaledChange = priceChange24h * (timeRangeHours / 24);
  const startPrice = Math.max(0.01, Math.min(0.99, currentPrice - scaledChange));
  const volatility = Math.abs(priceChange24h) * 0.5 + 0.01;

  for (let i = 0; i <= numPoints; i++) {
    const timestamp = startTime + timeStep * i;
    const progress = i / numPoints;
    const targetPrice = startPrice + (currentPrice - startPrice) * progress;
    const randomWalk = (Math.random() - 0.5) * volatility * (1 - progress * 0.5);
    let price = targetPrice + randomWalk;
    price = Math.max(0.01, Math.min(0.99, price));

    history.push({
      timestamp: Math.round(timestamp),
      price: Math.round(price * 1000) / 1000,
    });
  }

  if (history.length > 0) {
    history[history.length - 1].price = currentPrice;
  }

  return history;
}

/**
 * Fetch current price from CLOB API
 */
export async function fetchCurrentPrice(tokenId: string, side: 'buy' | 'sell' = 'buy'): Promise<number | null> {
  try {
    const url = `${CLOB_API_URL}/price?token_id=${encodeURIComponent(tokenId)}&side=${side}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price) || null;
  } catch (error) {
    console.error('[Polymarket] Price fetch error:', error);
    return null;
  }
}

/**
 * Fetch orderbook from CLOB API
 */
export async function fetchOrderbook(tokenId: string): Promise<{
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
} | null> {
  try {
    const url = `${CLOB_API_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }

    const data = await response.json();
    return {
      bids: data.bids || [],
      asks: data.asks || [],
    };
  } catch (error) {
    console.error('[Polymarket] Orderbook fetch error:', error);
    return null;
  }
}

/**
 * Fetch all available tags from Gamma API
 */
export async function fetchTags(): Promise<{ id: string; label: string; slug: string }[]> {
  const key = 'tags';
  const cached = apiCache.get<{ id: string; label: string; slug: string }[]>(key);
  if (cached) return cached;

  try {
    const url = `${GAMMA_API_URL}/tags?limit=100`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const tags = (Array.isArray(data) ? data : data.data || []).map((t: { id: string | number; label: string; slug: string }) => ({
      id: String(t.id) || '',
      label: t.label || '',
      slug: t.slug || '',
    }));

    apiCache.set(key, tags, CACHE_TTL.TAGS);
    return tags;
  } catch (error) {
    console.error('[Polymarket] Tags fetch error:', error);
    return [];
  }
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Get data mode status
 */
export function getDataMode(): 'live' {
  return 'live';
}

/**
 * Generate the correct Polymarket URL for a market
 * 
 * Polymarket URL format:
 * - https://polymarket.com/event/{slug} - works for both events and individual markets
 * 
 * The market's slug from the API is the primary identifier for URLs.
 */
export function getPolymarketUrl(
  market: Market | { slug?: string; id?: string; conditionId?: string; question?: string }
): string {
  const baseUrl = 'https://polymarket.com';

  const marketSlug = market.slug;
  const question = 'question' in market ? market.question : undefined;

  // Normalize slug for URL usage
  const normalizeSlug = (slug: string) =>
    encodeURIComponent(slug.trim().replace(/^\/+|\/+$/g, ''));

  // Primary: use market slug with /market/ (market-specific path)
  if (marketSlug && marketSlug.trim()) {
    const cleanSlug = normalizeSlug(marketSlug);
    return `${baseUrl}/market/${cleanSlug}`;
  }

  // Secondary: use search by question
  if (question) {
    return `${baseUrl}/?_q=${encodeURIComponent(question.substring(0, 100))}`;
  }

  return baseUrl;
}

/**
 * Get alternative URL formats to try if the primary doesn't work
 */
export function getPolymarketUrlAlternatives(
  market: Market | { slug?: string; id?: string; conditionId?: string; question?: string }
): string[] {
  const baseUrl = 'https://polymarket.com';
  const urls: string[] = [];

  const normalizeSlug = (slug: string) =>
    encodeURIComponent(slug.trim().replace(/^\/+|\/+$/g, ''));

  if (market.slug && market.slug.trim()) {
    const cleanSlug = normalizeSlug(market.slug);
    urls.push(`${baseUrl}/market/${cleanSlug}`);
    urls.push(`${baseUrl}/event/${cleanSlug}`);
  }

  const question = 'question' in market ? market.question : undefined;
  if (question) {
    urls.push(`${baseUrl}/?_q=${encodeURIComponent(question.substring(0, 100))}`);
  }

  return [...new Set(urls)];
}

/**
 * Fetch recent trades
 */
export async function fetchRecentTrades(tokenId: string, limit = 50): Promise<Array<{
  id: string;
  timestamp: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}> | null> {
  try {
    const url = `${CLOB_API_URL}/trades?token_id=${encodeURIComponent(tokenId)}&limit=${limit}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }

    const data = await response.json();
    const trades = Array.isArray(data) ? data : (data.trades || data.data || []);

    return trades.map((trade: { id?: string; trade_id?: string; timestamp?: number | string; price?: number | string; size?: number | string; side?: string }) => ({
      id: trade.id || trade.trade_id || '',
      timestamp: typeof trade.timestamp === 'number'
        ? (trade.timestamp < 1e12 ? trade.timestamp * 1000 : trade.timestamp)
        : Date.parse(String(trade.timestamp) || new Date().toISOString()),
      price: typeof trade.price === 'number' ? trade.price : parseFloat(String(trade.price) || '0'),
      size: typeof trade.size === 'number' ? trade.size : parseFloat(String(trade.size) || '0'),
      side: (trade.side || 'buy').toLowerCase() === 'sell' ? 'sell' as const : 'buy' as const,
    }));
  } catch (error) {
    console.error('[Polymarket] Recent trades fetch error:', error);
    return null;
  }
}

/**
 * Fetch market statistics
 */
export async function fetchMarketStats(marketId: string): Promise<{
  volume24h: number;
  volume7d: number;
  trades24h: number;
  uniqueTraders24h: number;
  liquidity: number;
  priceRange24h: { high: number; low: number };
  volatility24h: number;
} | null> {
  try {
    const market = await fetchMarketDetail(marketId);
    if (!market) return null;

    const tokenId = market.outcomes[0]?.id;
    if (!tokenId) return null;

    const trades = await fetchRecentTrades(tokenId, 1000);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const trades24h = trades?.filter(t => t.timestamp >= dayAgo) || [];
    const trades7d = trades?.filter(t => t.timestamp >= weekAgo) || [];

    const volume24h = trades24h.reduce((sum, t) => sum + (t.price * t.size), 0);
    const volume7d = trades7d.reduce((sum, t) => sum + (t.price * t.size), 0);

    const prices24h = trades24h.map(t => t.price);
    const priceRange24h = prices24h.length > 0
      ? { high: Math.max(...prices24h), low: Math.min(...prices24h) }
      : { high: market.outcomes[0]?.price || 0.5, low: market.outcomes[0]?.price || 0.5 };

    let volatility24h = 0;
    if (prices24h.length > 1) {
      const avgPrice = prices24h.reduce((sum, p) => sum + p, 0) / prices24h.length;
      const variance = prices24h.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices24h.length;
      volatility24h = Math.sqrt(variance) * 100;
    }

    const uniqueTraders24h = new Set(trades24h.map(t => t.id)).size;

    return {
      volume24h,
      volume7d,
      trades24h: trades24h.length,
      uniqueTraders24h,
      liquidity: market.liquidity,
      priceRange24h,
      volatility24h,
    };
  } catch (error) {
    console.error('[Polymarket] Market stats error:', error);
    return null;
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  gammaApi: boolean;
  clobApi: boolean;
  marketsCount: number;
  error?: string;
}> {
  try {
    let gammaApi = false;
    let marketsCount = 0;

    try {
      const response = await fetchWithTimeout(`${GAMMA_API_URL}/markets?active=true&closed=false&limit=1`);
      gammaApi = response.ok;

      if (response.ok) {
        const data = await response.json();
        const markets = Array.isArray(data) ? data : (data.data || data.results || []);
        marketsCount = markets.length;
      }
    } catch (error) {
      console.error('[Polymarket] Gamma API test failed:', error);
    }

    let clobApi = false;
    try {
      const response = await fetchWithTimeout(`${CLOB_API_URL}/trades?token_id=test&limit=1`, {}, 1);
      clobApi = response.status !== 404;
    } catch {
      clobApi = gammaApi;
    }

    return {
      connected: gammaApi || clobApi,
      gammaApi,
      clobApi,
      marketsCount,
    };
  } catch (error) {
    return {
      connected: false,
      gammaApi: false,
      clobApi: false,
      marketsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
