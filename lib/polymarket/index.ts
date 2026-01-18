export {
  fetchMarkets,
  fetchMarketDetail,
  fetchMarketHistory,
  fetchEventMarkets,
  fetchCurrentPrice,
  fetchOrderbook,
  fetchTags,
  fetchRecentTrades,
  fetchMarketStats,
  testConnection,
  getPolymarketUrl,
  getPolymarketUrlAlternatives,
  clearCache,
  getDataMode,
  type FetchMeta,
  type MarketSearchResponseWithMeta,
} from './client';

export * from './cache';
export * from './types';
