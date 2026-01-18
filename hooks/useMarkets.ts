'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Market, MarketSearchParams, MarketSearchResponse } from '@/types';

interface UseMarketsOptions extends MarketSearchParams {
  enabled?: boolean;
}

interface UseMarketsReturn {
  markets: Market[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refetch: (forceRefresh?: boolean) => void;
  loadMore: () => void;
  isLive: boolean;
}

export function useMarkets(options: UseMarketsOptions = {}): UseMarketsReturn {
  const {
    query,
    category,
    sortBy = 'volume',
    sortOrder = 'desc',
    limit = 50,
    enabled = true,
  } = options;

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const fetchIdRef = useRef(0);

  // Store current offset in ref for loadMore
  const offsetRef = useRef(0);
  offsetRef.current = offset;

  const fetchMarkets = useCallback(async (
    currentQuery: string | undefined,
    currentCategory: string | undefined,
    currentSortBy: string,
    currentSortOrder: string,
    currentLimit: number,
    resetOffset: boolean,
    forceRefresh: boolean
  ) => {
    if (!enabled) return;

    const fetchId = ++fetchIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = resetOffset ? 0 : offsetRef.current;
      const params = new URLSearchParams();
      if (currentQuery) params.set('query', currentQuery);
      if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
      params.set('sortBy', currentSortBy);
      params.set('sortOrder', currentSortOrder);
      params.set('limit', currentLimit.toString());
      params.set('offset', currentOffset.toString());
      
      // Force cache refresh
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      console.log('[useMarkets] Fetching:', `/api/markets?${params.toString()}`);

      const response = await fetch(`/api/markets?${params.toString()}`);
      
      // Check if this is still the latest request
      if (fetchId !== fetchIdRef.current) {
        console.log('[useMarkets] Request superseded, ignoring');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API returned ${response.status}`);
      }

      const data: MarketSearchResponse = await response.json();

      console.log(`[useMarkets] Received ${data.markets?.length || 0} markets (total: ${data.total})`);

      // Check if we got data
      if (!data.markets || data.markets.length === 0) {
        if (resetOffset) {
          setMarkets([]);
          setTotal(0);
          setHasMore(false);
        }
        setIsLive(true);
        return;
      }

      if (resetOffset) {
        setMarkets(data.markets);
        setOffset(data.markets.length);
      } else {
        setMarkets(prev => [...prev, ...data.markets]);
        setOffset(prev => prev + data.markets.length);
      }
      
      setTotal(data.total);
      setHasMore(data.hasMore);
      setIsLive(true);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMarkets] Error:', errorMessage);
      setError(`Failed to fetch from Polymarket: ${errorMessage}`);
      setIsLive(false);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  // Initial fetch and refetch on param changes
  useEffect(() => {
    fetchMarkets(query, category, sortBy, sortOrder, limit, true, false);
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit]);

  const refetch = useCallback((forceRefresh = false) => {
    fetchMarkets(query, category, sortBy, sortOrder, limit, true, forceRefresh);
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMarkets(query, category, sortBy, sortOrder, limit, false, false);
    }
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit, loading, hasMore]);

  return {
    markets,
    loading,
    error,
    hasMore,
    total,
    refetch,
    loadMore,
    isLive,
  };
}
