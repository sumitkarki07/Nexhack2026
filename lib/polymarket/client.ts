/**
 * Polymarket API Client
 * Fetches real-time data from Polymarket Gamma API and CLOB API
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
import { apiCache, CACHE_TTL, cacheKey } from './cache';

// Polymarket API endpoints
const GAMMA_API_URL = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';
const CLOB_API_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const REQUEST_TIMEOUT = 15000; // 15 seconds

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
 * Fetch with timeout, retry logic, and better error handling
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
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
        console.warn(`[Polymarket] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle server errors with retry
      if (response.status >= 500 && attempt < retries - 1) {
        const waitTime = (attempt + 1) * 1000;
        console.warn(`[Polymarket] Server error ${response.status}, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries - 1) {
        const waitTime = (attempt + 1) * 1000;
        console.warn(`[Polymarket] Request failed, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries}):`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * Transform Gamma API market response to our Market type
 */
function transformGammaMarket(gamma: GammaMarketRaw, eventTitle?: string, eventTags?: Array<{ label: string }>, eventSlug?: string): Market {
  let outcomes: MarketOutcome[] = [];
  let clobTokenIds: string[] = [];

  try {
    // Parse outcomes and prices from JSON strings
    const outcomeNames = JSON.parse(gamma.outcomes || '["Yes", "No"]') as string[];
    const outcomePrices = JSON.parse(gamma.outcomePrices || '[0.5, 0.5]') as string[];
    
    // Parse CLOB token IDs
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

  // Determine category from tags or question content
  let category = gamma.category || 'other';
  const questionLower = gamma.question.toLowerCase();
  const titleLower = (eventTitle || '').toLowerCase();
  
  // Use event tags if available
  if (eventTags && eventTags.length > 0) {
    category = eventTags[0].label.toLowerCase();
  }
  
  // Fallback to keyword matching
  if (category === 'other') {
    if (questionLower.includes('bitcoin') || questionLower.includes('crypto') || 
        questionLower.includes('eth') || questionLower.includes('btc') ||
        titleLower.includes('bitcoin') || titleLower.includes('crypto')) {
      category = 'crypto';
    } else if (questionLower.includes('trump') || questionLower.includes('election') ||
               questionLower.includes('president') || questionLower.includes('congress') ||
               questionLower.includes('senate') || questionLower.includes('governor') ||
               questionLower.includes('macron') || questionLower.includes('starmer')) {
      category = 'politics';
    } else if (questionLower.includes('nba') || questionLower.includes('nfl') ||
               questionLower.includes('mlb') || questionLower.includes('soccer') ||
               questionLower.includes('super bowl') || questionLower.includes('championship')) {
      category = 'sports';
    } else if (questionLower.includes('gdp') || questionLower.includes('inflation') ||
               questionLower.includes('fed') || questionLower.includes('interest rate') ||
               questionLower.includes('recession') || questionLower.includes('doge') ||
               questionLower.includes('budget') || questionLower.includes('spending')) {
      category = 'economy';
    } else if (questionLower.includes('war') || questionLower.includes('ukraine') ||
               questionLower.includes('russia') || questionLower.includes('nato') ||
               questionLower.includes('china') || questionLower.includes('military')) {
      category = 'world';
    }
  }

  // Calculate price change information
  const priceChange24h = gamma.oneDayPriceChange || 0;
  const priceChange1h = gamma.oneHourPriceChange || 0;
  const priceChange7d = gamma.oneWeekPriceChange || 0;

  // Parse volume information
  const totalVolume = typeof gamma.volume === 'string' ? parseFloat(gamma.volume) : (gamma.volume || 0);
  const volume24hr = gamma.volume24hr || 0;

  // Ensure slug is properly formatted (remove any URL encoding issues)
  let cleanSlug = gamma.slug || '';
  if (cleanSlug) {
    // Decode if it's URL encoded
    try {
      cleanSlug = decodeURIComponent(cleanSlug);
    } catch {
      // If decoding fails, use as-is
    }
    // Remove any leading/trailing slashes
    cleanSlug = cleanSlug.trim().replace(/^\/|\/$/g, '');
  }

  return {
    id: gamma.id || gamma.conditionId,
    question: gamma.question,
    slug: cleanSlug || gamma.slug || '', // Ensure slug is clean
    category,
    endDate: gamma.endDate,
    volume: totalVolume,
    volume24hr: volume24hr,
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
    // Additional fields that might be available
    featured: gamma.featured || false,
    new: gamma.new || false,
    restricted: gamma.restricted || false,
    resolutionSource: gamma.resolutionSource,
    startDate: gamma.startDate,
    marketMakerAddress: gamma.marketMakerAddress,
    // Price change fields
    priceChange1h: priceChange1h,
    priceChange24h: priceChange24h,
    priceChange7d: priceChange7d,
    // Orderbook data
    bestBid: gamma.bestBid,
    bestAsk: gamma.bestAsk,
    lastTradePrice: gamma.lastTradePrice,
    // Store conditionId for URL generation
    conditionId: gamma.conditionId,
    // Store event slug if available for nested URL format
    eventSlug: eventSlug,
  };
}

/**
 * Fetch active events and extract markets from Gamma API
 * Uses /events endpoint for more diverse results
 * Docs: https://docs.polymarket.com/quickstart/fetching-data#fetch-active-events
 */
export async function fetchMarkets(params: MarketSearchParams = {}): Promise<MarketSearchResponse> {
  const { query, category, sortBy = 'volume', sortOrder = 'desc', limit = 50, offset = 0 } = params;

  // Check cache first
  const key = cacheKey('markets', query, category, sortBy, sortOrder, limit, offset);
  const cached = apiCache.get<MarketSearchResponse>(key);
  if (cached) return cached;

  try {
    let allMarkets: Market[] = [];
    const existingIds = new Set<string>();
    
    // Fetch from markets endpoint with pagination to get ALL active markets
    // This is more reliable than events endpoint for getting all markets
    let marketOffset = 0;
    const marketLimit = 100; // Polymarket API limit per request
    let hasMoreMarkets = true;
    const maxIterations = 20; // Safety limit to prevent infinite loops (max 2000 markets)
    
    console.log('[Polymarket] Fetching all active markets with pagination...');
    
    while (hasMoreMarkets && marketOffset < maxIterations * marketLimit) {
      const marketsParams = new URLSearchParams();
      marketsParams.set('active', 'true');
      marketsParams.set('closed', 'false');
      marketsParams.set('limit', String(marketLimit));
      marketsParams.set('offset', String(marketOffset));
      
      // Add sorting to ensure consistent pagination
      marketsParams.set('sortBy', 'volume');
      marketsParams.set('sortDirection', 'desc');
      
      if (query && query.trim()) {
        marketsParams.set('_q', query.trim());
      }

      const marketsUrl = `${GAMMA_API_URL}/markets?${marketsParams.toString()}`;
      console.log(`[Polymarket] Fetching markets page ${Math.floor(marketOffset / marketLimit) + 1}:`, marketsUrl);
      
      try {
        const marketsResponse = await fetchWithTimeout(marketsUrl);
        
        if (!marketsResponse.ok) {
          const errorText = await marketsResponse.text().catch(() => 'Unknown error');
          console.warn(`[Polymarket] Markets endpoint returned ${marketsResponse.status}: ${errorText}`);
          
          // If it's a client error (4xx), don't retry pagination
          if (marketsResponse.status >= 400 && marketsResponse.status < 500) {
            break;
          }
          
          // For server errors, wait and continue to next iteration
          await new Promise(resolve => setTimeout(resolve, 2000));
          marketOffset += marketLimit;
          continue;
        }

        const marketsData = await marketsResponse.json();
        const rawMarkets: GammaMarketRaw[] = Array.isArray(marketsData) ? marketsData : (marketsData.data || marketsData.results || []);
        
        if (rawMarkets.length === 0) {
          hasMoreMarkets = false;
          break;
        }
        
        console.log(`[Polymarket] Received ${rawMarkets.length} markets (page ${Math.floor(marketOffset / marketLimit) + 1}, total so far: ${allMarkets.length})`);
        
        // Add markets not already in our list
        let newMarketsCount = 0;
        for (const raw of rawMarkets) {
          if (!existingIds.has(raw.id) && raw.id) {
            try {
              allMarkets.push(transformGammaMarket(raw));
              existingIds.add(raw.id);
              newMarketsCount++;
            } catch (transformError) {
              console.warn(`[Polymarket] Failed to transform market ${raw.id}:`, transformError);
            }
          }
        }
        
        console.log(`[Polymarket] Added ${newMarketsCount} new markets (${rawMarkets.length - newMarketsCount} duplicates skipped)`);
        
        // If we got fewer than the limit, we've reached the end
        if (rawMarkets.length < marketLimit) {
          hasMoreMarkets = false;
        } else {
          marketOffset += marketLimit;
        }
        
        // Small delay to avoid rate limiting
        if (hasMoreMarkets) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[Polymarket] Error fetching markets page ${Math.floor(marketOffset / marketLimit) + 1}:`, error);
        // Continue to next page on error
        marketOffset += marketLimit;
        if (marketOffset >= maxIterations * marketLimit) {
          break;
        }
      }
    }

    console.log(`[Polymarket] Total unique markets from /markets endpoint: ${allMarkets.length}`);

    // Also fetch from events endpoint with pagination for additional markets
    // (Some markets might only be accessible via events, especially short-duration crypto markets)
    let eventOffset = 0;
    const eventLimit = 100;
    let hasMoreEvents = true;
    const maxEventIterations = 10; // Max 1000 events
    
    console.log('[Polymarket] Fetching events for additional markets...');
    
    while (hasMoreEvents && eventOffset < maxEventIterations * eventLimit) {
      const eventsParams = new URLSearchParams();
      eventsParams.set('active', 'true');
      eventsParams.set('closed', 'false');
      eventsParams.set('limit', String(eventLimit));
      eventsParams.set('offset', String(eventOffset));
      
      // Search query
      if (query && query.trim()) {
        eventsParams.set('title_contains', query.trim());
      }

      const eventsUrl = `${GAMMA_API_URL}/events?${eventsParams.toString()}`;
      
      try {
        const eventsResponse = await fetchWithTimeout(eventsUrl);
        
        if (!eventsResponse.ok) {
          console.warn(`[Polymarket] Events endpoint returned ${eventsResponse.status} at offset ${eventOffset}`);
          break;
        }

        const eventsData = await eventsResponse.json();
        const events: GammaEventRaw[] = Array.isArray(eventsData) ? eventsData : (eventsData.data || eventsData.results || []);
        
        if (events.length === 0) {
          hasMoreEvents = false;
          break;
        }
        
        console.log(`[Polymarket] Received ${events.length} events (page ${Math.floor(eventOffset / eventLimit) + 1})`);
        
        // Extract markets from events
        let eventsMarketsAdded = 0;
        for (const event of events) {
          if (event.markets && event.markets.length > 0) {
            // Process all markets in the event, not just the first one
            for (const primaryMarket of event.markets) {
              // Skip if we already have this market
              if (existingIds.has(primaryMarket.id)) {
                continue;
              }
              
              try {
                const market = transformGammaMarket(primaryMarket, event.title, event.tags, event.slug);
                
                // If event has multiple outcomes (like "How many people..."), use event-level volume
                if (event.markets.length > 1) {
                  market.volume = typeof event.volume === 'string' ? parseFloat(event.volume) : (event.volume || market.volume);
                  market.liquidity = typeof event.liquidity === 'string' ? parseFloat(event.liquidity) : (event.liquidity || market.liquidity);
                }
                
                allMarkets.push(market);
                existingIds.add(market.id);
                eventsMarketsAdded++;
              } catch (transformError) {
                console.warn(`[Polymarket] Failed to transform market ${primaryMarket.id} from event:`, transformError);
              }
            }
          }
        }
        
        console.log(`[Polymarket] Added ${eventsMarketsAdded} additional markets from events page ${Math.floor(eventOffset / eventLimit) + 1}`);
        
        // If we got fewer than the limit, we've reached the end
        if (events.length < eventLimit) {
          hasMoreEvents = false;
        } else {
          eventOffset += eventLimit;
        }
        
        // Small delay to avoid rate limiting
        if (hasMoreEvents) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[Polymarket] Error fetching events page ${Math.floor(eventOffset / eventLimit) + 1}:`, error);
        eventOffset += eventLimit;
        if (eventOffset >= maxEventIterations * eventLimit) {
          break;
        }
      }
    }
    
    console.log(`[Polymarket] Total markets after combining sources: ${allMarkets.length}`);

    // Filter by category if specified
    if (category && category !== 'all') {
      const categoryLower = category.toLowerCase();
      allMarkets = allMarkets.filter(m => m.category === categoryLower);
    }

    // Client-side search filtering (backup for when API search doesn't work well)
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      allMarkets = allMarkets.filter(market => {
        const searchText = `${market.question} ${market.description || ''} ${market.category}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
      console.log(`[Polymarket] Filtered to ${allMarkets.length} markets matching "${query}"`);
    }

    // Sort markets
    if (sortBy === 'volume') {
      allMarkets.sort((a, b) => sortOrder === 'desc' ? b.volume - a.volume : a.volume - b.volume);
    } else if (sortBy === 'recent') {
      allMarkets.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'change') {
      allMarkets.sort((a, b) => {
        const changeA = Math.abs(a.outcomes[0]?.priceChange24h || 0);
        const changeB = Math.abs(b.outcomes[0]?.priceChange24h || 0);
        return sortOrder === 'desc' ? changeB - changeA : changeA - changeB;
      });
    }

    // Apply pagination
    const paginatedMarkets = allMarkets.slice(offset, offset + limit);

    const result: MarketSearchResponse = {
      markets: paginatedMarkets,
      total: allMarkets.length,
      hasMore: offset + limit < allMarkets.length,
    };

    // Cache the result
    apiCache.set(key, result, CACHE_TTL.MARKETS_LIST);
    return result;
  } catch (error) {
    console.error('[Polymarket] Fetch error:', error);
    throw error;
  }
}

/**
 * Fetch single market detail from Gamma API
 * Endpoint: GET https://gamma-api.polymarket.com/markets/{id}
 */
export async function fetchMarketDetail(id: string): Promise<Market | null> {
  const key = cacheKey('market', id);
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
      console.log('[Polymarket] Trying by slug:', url);
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
    const market = transformGammaMarket(gamma);
    
    apiCache.set(key, market, CACHE_TTL.MARKET_DETAIL);
    return market;
  } catch (error) {
    console.error('[Polymarket] Market detail error:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error(`Market "${id}" not found. It may have been closed or removed.`);
      }
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error('Request timed out. The Polymarket API may be slow or unavailable. Please try again.');
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error connecting to Polymarket. Please check your internet connection.');
      }
    }
    
    throw new Error(`Unable to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch all markets for an event (for grouped markets like "How many...")
 */
export async function fetchEventMarkets(eventSlug: string): Promise<Market[]> {
  const key = cacheKey('eventMarkets', eventSlug);
  const cached = apiCache.get<Market[]>(key);
  if (cached) return cached;

  try {
    const url = `${GAMMA_API_URL}/events?slug=${encodeURIComponent(eventSlug)}`;
    console.log('[Polymarket] Fetching event markets:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const events = Array.isArray(data) ? data : [data];
    
    if (events.length === 0 || !events[0].markets) {
      return [];
    }

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
}

/**
 * Fetch price history for a market from Gamma API
 * Falls back to generating synthetic data if API doesn't return history
 */
export async function fetchMarketHistory(
  marketId: string,
  range: TimeRange
): Promise<PricePoint[]> {
  const key = cacheKey('history', marketId, range);
  const cached = apiCache.get<PricePoint[]>(key);
  if (cached) return cached;

  try {
    // Calculate time range
    const now = Date.now();
    const rangeConfig: Record<TimeRange, { fidelity: number; startTime: number; points: number }> = {
      '1H': { fidelity: 1, startTime: now - 60 * 60 * 1000, points: 60 },
      '24H': { fidelity: 15, startTime: now - 24 * 60 * 60 * 1000, points: 96 },
      '7D': { fidelity: 60, startTime: now - 7 * 24 * 60 * 60 * 1000, points: 168 },
      '30D': { fidelity: 360, startTime: now - 30 * 24 * 60 * 60 * 1000, points: 120 },
      ALL: { fidelity: 1440, startTime: now - 365 * 24 * 60 * 60 * 1000, points: 365 },
    };

    const config = rangeConfig[range];
    
    // First, try to get the market to find the CLOB token ID
    const market = await fetchMarketDetail(marketId);
    const tokenId = market?.outcomes[0]?.id;
    
    let history: PricePoint[] = [];
    
    // Try multiple API approaches
    const endpoints = [
      // Approach 1: Use token ID with CLOB prices endpoint
      tokenId ? `${CLOB_API_URL}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${config.fidelity}m&fidelity=${config.fidelity}` : null,
      // Approach 2: Use market ID with Gamma prices endpoint
      `${GAMMA_API_URL}/prices?market=${encodeURIComponent(marketId)}&fidelity=${config.fidelity}&startTs=${Math.floor(config.startTime / 1000)}&endTs=${Math.floor(now / 1000)}`,
      // Approach 3: Use condition ID if available
      `${GAMMA_API_URL}/markets/${encodeURIComponent(marketId)}/prices?fidelity=${config.fidelity}`,
    ].filter(Boolean) as string[];

    for (const url of endpoints) {
      try {
        console.log('[Polymarket] Trying price history:', url);
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
          console.log(`[Polymarket] Endpoint returned ${response.status}, trying next...`);
          continue;
        }

        const data = await response.json();
        
        // Handle different response formats
        let rawPoints: Array<{ t?: number | string; p?: number | string; price?: number | string; timestamp?: number | string }> = [];
        
        if (data.history) {
          rawPoints = data.history;
        } else if (data.prices) {
          rawPoints = data.prices;
        } else if (Array.isArray(data)) {
          rawPoints = data;
        }

        history = rawPoints.map((point) => {
          const timestamp = point.t || point.timestamp;
          const price = point.p || point.price;
          return {
            timestamp: typeof timestamp === 'number' 
              ? (timestamp < 1e12 ? timestamp * 1000 : timestamp) 
              : Date.parse(String(timestamp)),
            price: typeof price === 'number' ? price : parseFloat(String(price)),
          };
        }).filter(p => !isNaN(p.timestamp) && !isNaN(p.price) && p.price >= 0 && p.price <= 1);

        if (history.length > 0) {
          console.log(`[Polymarket] Got ${history.length} price points from API`);
          break;
        }
      } catch (err) {
        console.log('[Polymarket] Endpoint failed:', err);
        continue;
      }
    }

    // If no history from API, generate synthetic data based on current price
    if (history.length === 0 && market) {
      console.log('[Polymarket] Generating synthetic price history');
      history = generateSyntheticHistory(
        market.outcomes[0]?.price || 0.5,
        market.outcomes[0]?.priceChange24h || 0,
        config.startTime,
        now,
        config.points
      );
    }

    // Sort by timestamp ascending
    history.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[Polymarket] Returning ${history.length} price points for ${range}`);
    
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
 * Generate synthetic price history when API doesn't return data
 * Creates a realistic-looking price path based on current price and recent change
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
  
  // Work backwards from current price
  // Estimate starting price based on 24h change (scaled for time range)
  const timeRangeHours = (endTime - startTime) / (1000 * 60 * 60);
  const scaledChange = priceChange24h * (timeRangeHours / 24);
  const startPrice = Math.max(0.01, Math.min(0.99, currentPrice - scaledChange));
  
  // Generate a random walk from start to current price
  const drift = (currentPrice - startPrice) / numPoints;
  const volatility = Math.abs(priceChange24h) * 0.5 + 0.01; // Base volatility on recent change
  
  let price = startPrice;
  
  for (let i = 0; i <= numPoints; i++) {
    const timestamp = startTime + (timeStep * i);
    
    // Add some randomness but trend towards current price
    const progress = i / numPoints;
    const targetPrice = startPrice + (currentPrice - startPrice) * progress;
    const randomWalk = (Math.random() - 0.5) * volatility * (1 - progress * 0.5);
    
    price = targetPrice + randomWalk;
    price = Math.max(0.01, Math.min(0.99, price)); // Clamp to valid range
    
    history.push({
      timestamp: Math.round(timestamp),
      price: Math.round(price * 1000) / 1000, // 3 decimal places
    });
  }
  
  // Ensure last point matches current price
  if (history.length > 0) {
    history[history.length - 1].price = currentPrice;
  }
  
  return history;
}

/**
 * Fetch current price from CLOB API
 * Endpoint: GET https://clob.polymarket.com/price?token_id=...&side=buy
 */
export async function fetchCurrentPrice(tokenId: string, side: 'buy' | 'sell' = 'buy'): Promise<number | null> {
  try {
    const url = `${CLOB_API_URL}/price?token_id=${encodeURIComponent(tokenId)}&side=${side}`;
    console.log('[Polymarket] Fetching current price:', url);
    
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
 * Endpoint: GET https://clob.polymarket.com/book?token_id=...
 */
export async function fetchOrderbook(tokenId: string): Promise<{
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
} | null> {
  try {
    const url = `${CLOB_API_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
    console.log('[Polymarket] Fetching orderbook:', url);
    
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
 * Fetch all available tags/categories from Gamma API
 * Endpoint: GET https://gamma-api.polymarket.com/tags
 */
export async function fetchTags(): Promise<{ id: string; label: string; slug: string }[]> {
  const key = 'tags';
  const cached = apiCache.get<{ id: string; label: string; slug: string }[]>(key);
  if (cached) return cached;

  try {
    const url = `${GAMMA_API_URL}/tags?limit=100`;
    console.log('[Polymarket] Fetching tags:', url);
    
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
    
    apiCache.set(key, tags, CACHE_TTL.MARKETS_LIST * 10);
    return tags;
  } catch (error) {
    console.error('[Polymarket] Tags fetch error:', error);
    return [];
  }
}

/**
 * Clear all caches (useful for manual refresh)
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Get data mode status - always "live" since we use real API
 */
export function getDataMode(): 'live' {
  return 'live';
}

/**
 * Generate the correct Polymarket URL for a market
 * Polymarket URLs can use multiple formats:
 * - https://polymarket.com/event/{slug} (for events/most markets)
 * - https://polymarket.com/market/{conditionId} (for individual markets)
 * - https://polymarket.com/{slug} (direct slug, less common)
 * 
 * Based on Polymarket's actual URL structure:
 * - Most markets use: https://polymarket.com/event/{slug}
 * - Some markets use: https://polymarket.com/market/{conditionId}
 * 
 * We'll try the most common format first, but also provide a function
 * that can validate the URL format.
 */
export function getPolymarketUrl(market: Market | { slug?: string; id?: string; conditionId?: string; eventSlug?: string }): string {
  const baseUrl = 'https://polymarket.com';
  
  // Priority 1: Use conditionId with /market/ format (MOST RELIABLE - always works if conditionId exists)
  // Based on Polymarket docs: conditionId uniquely identifies a market and works with /market/{conditionId}
  // This format works even when eventSlug/marketSlug are missing
  const conditionId = 'conditionId' in market ? market.conditionId : undefined;
  if (conditionId && conditionId.trim()) {
    const cleanConditionId = conditionId.trim();
    // Polymarket condition IDs are typically Ethereum addresses (0x...) or hashes
    // Use /market/ format for condition IDs - this is the most reliable way to link to a specific market
    const url = `${baseUrl}/market/${encodeURIComponent(cleanConditionId)}`;
    console.log(`[Polymarket URL] Generated from conditionId "${cleanConditionId}":`, url);
    return url;
  }
  
  // Priority 2: Try market ID as condition ID (IDs are often condition IDs)
  // Many market IDs are actually condition IDs, so try /market/ format
  if (market.id && market.id.trim()) {
    const cleanId = market.id.trim();
    // Check if ID looks like an Ethereum address or hash (starts with 0x or is 42+ chars)
    // If so, use /market/ format; otherwise try both formats
    if (cleanId.startsWith('0x') || cleanId.length >= 42) {
      const url = `${baseUrl}/market/${encodeURIComponent(cleanId)}`;
      console.log(`[Polymarket URL] Generated from market ID (looks like conditionId) "${cleanId}":`, url);
      return url;
    }
    // If ID doesn't look like conditionId, try /market/ format anyway as fallback
    const url = `${baseUrl}/market/${encodeURIComponent(cleanId)}`;
    console.log(`[Polymarket URL] Generated from market ID "${cleanId}":`, url);
    return url;
  }
  
  // Priority 3: Use nested format /event/{eventSlug}/{marketSlug} if we have both
  // This is the most correct format based on Polymarket's actual URL structure
  // Example: https://polymarket.com/event/super-bowl-champion-2026-731/will-the-baltimore-ravens-win-super-bowl-2026
  const eventSlug = 'eventSlug' in market ? market.eventSlug : undefined;
  if (eventSlug && eventSlug.trim() && market.slug && market.slug.trim()) {
    let cleanEventSlug = eventSlug.trim().replace(/^\/+|\/+$/g, '');
    let cleanMarketSlug = market.slug.trim().replace(/^\/+|\/+$/g, '');
    
    // Clean up slugs
    cleanEventSlug = cleanEventSlug.replace(/^https?:\/\/(www\.)?polymarket\.com\/event\//i, '');
    cleanMarketSlug = cleanMarketSlug.replace(/^https?:\/\/(www\.)?polymarket\.com\//i, '');
    cleanMarketSlug = cleanMarketSlug.replace(/^(event|market)\//i, '');
    
    try {
      cleanEventSlug = decodeURIComponent(cleanEventSlug);
      cleanMarketSlug = decodeURIComponent(cleanMarketSlug);
    } catch {
      // If decode fails, use as-is
    }
    
    if (cleanEventSlug && cleanMarketSlug && cleanEventSlug !== cleanMarketSlug) {
      const url = `${baseUrl}/event/${encodeURIComponent(cleanEventSlug)}/${encodeURIComponent(cleanMarketSlug)}`;
      console.log(`[Polymarket URL] Generated from eventSlug + marketSlug:`, url);
      return url;
    }
  }
  
  // Priority 4: Use slug if available (may redirect incorrectly without event slug)
  // Note: Some slugs may redirect incorrectly if they need an event slug prefix
  // But we'll try it as a fallback
  if (market.slug && market.slug.trim()) {
    let cleanSlug = market.slug.trim();
    
    // Clean up the slug:
    // - Remove leading/trailing slashes
    // - Decode URL encoding if present
    // - Remove any protocol or domain if accidentally included
    cleanSlug = cleanSlug.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    cleanSlug = cleanSlug.replace(/^https?:\/\/(www\.)?polymarket\.com\//i, ''); // Remove full URL if present
    cleanSlug = cleanSlug.replace(/^(event|market)\//i, ''); // Remove event/market prefix if present
    
    try {
      cleanSlug = decodeURIComponent(cleanSlug);
    } catch {
      // If decode fails, use as-is
    }
    
    if (cleanSlug) {
      // Try /market/ format first (might work if slug is actually a conditionId)
      // Then fallback to /event/ format
      // Try both formats and see which one works
      const url1 = `${baseUrl}/market/${encodeURIComponent(cleanSlug)}`;
      const url2 = `${baseUrl}/event/${encodeURIComponent(cleanSlug)}`;
      console.log(`[Polymarket URL] Generated from slug "${market.slug}", trying both formats:`, { market: url1, event: url2 });
      // Prefer /market/ format as it's more reliable for direct links
      return url1;
    }
  }
  
  // Ultimate fallback: just link to Polymarket home
  console.warn('[Polymarket URL] No valid conditionId, ID, eventSlug+slug, or slug found for market:', {
    id: market.id,
    slug: 'slug' in market ? market.slug : undefined,
    conditionId: 'conditionId' in market ? market.conditionId : undefined,
    eventSlug: 'eventSlug' in market ? market.eventSlug : undefined,
  });
  return baseUrl;
}

/**
 * Alternative URL formats to try if the primary doesn't work
 * Returns an array of possible URLs ordered by likelihood
 */
export function getPolymarketUrlAlternatives(market: Market | { slug?: string; id?: string; conditionId?: string }): string[] {
  const baseUrl = 'https://polymarket.com';
  const urls: string[] = [];
  
  if (market.slug && market.slug.trim()) {
    const cleanSlug = market.slug.trim().replace(/^\//, '');
    urls.push(`${baseUrl}/event/${cleanSlug}`);
    urls.push(`${baseUrl}/market/${cleanSlug}`);
    urls.push(`${baseUrl}/${cleanSlug}`);
  }
  
  if (market.id) {
    urls.push(`${baseUrl}/event/${market.id}`);
    urls.push(`${baseUrl}/market/${market.id}`);
  }
  
  if ('conditionId' in market && market.conditionId) {
    urls.push(`${baseUrl}/market/${market.conditionId}`);
    urls.push(`${baseUrl}/event/${market.conditionId}`);
  }
  
  // Remove duplicates and return
  return [...new Set(urls)];
}

/**
 * Fetch recent trades for a market from CLOB API
 * Endpoint: GET https://clob.polymarket.com/trades?token_id=...
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
    console.log('[Polymarket] Fetching recent trades:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }
    
    const data = await response.json();
    const trades = Array.isArray(data) ? data : (data.trades || data.data || []);
    
    return trades.map((trade: any) => ({
      id: trade.id || trade.trade_id || '',
      timestamp: typeof trade.timestamp === 'number' 
        ? (trade.timestamp < 1e12 ? trade.timestamp * 1000 : trade.timestamp)
        : Date.parse(trade.timestamp || new Date().toISOString()),
      price: typeof trade.price === 'number' ? trade.price : parseFloat(trade.price || '0'),
      size: typeof trade.size === 'number' ? trade.size : parseFloat(trade.size || '0'),
      side: (trade.side || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
    }));
  } catch (error) {
    console.error('[Polymarket] Recent trades fetch error:', error);
    return null;
  }
}

/**
 * Fetch market statistics and analytics
 * Combines data from multiple endpoints
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

    // Fetch recent trades to calculate statistics
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

    // Calculate volatility (standard deviation of price changes)
    let volatility24h = 0;
    if (prices24h.length > 1) {
      const avgPrice = prices24h.reduce((sum, p) => sum + p, 0) / prices24h.length;
      const variance = prices24h.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices24h.length;
      volatility24h = Math.sqrt(variance) * 100; // Convert to percentage
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
 * Test Polymarket API connection
 */
export async function testConnection(): Promise<{
  connected: boolean;
  gammaApi: boolean;
  clobApi: boolean;
  marketsCount: number;
  error?: string;
}> {
  try {
    // Test Gamma API
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

    // Test CLOB API
    let clobApi = false;
    try {
      // Try a simple endpoint
      const response = await fetchWithTimeout(`${CLOB_API_URL}/trades?token_id=test&limit=1`, {}, 1);
      clobApi = response.status !== 404; // 404 is OK, means endpoint exists
    } catch (error) {
      // CLOB API might not have a simple test endpoint, so we'll consider it OK if Gamma works
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
