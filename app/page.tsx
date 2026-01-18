'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, X, Scan, RefreshCw, AlertCircle, Radio } from 'lucide-react';
import { MarketGrid, MarketSearch, CategoryPills } from '@/components/markets';
import { ClusterBuilder, ScannerPanel } from '@/components/scanner';
import { ResearchModal } from '@/components/research';
import { Button, Card, Badge, Modal } from '@/components/ui';
import { useMarkets } from '@/hooks';
import { useStrategy, useAuth } from '@/context';
import { Market, MarketCluster, ScannerConfig } from '@/types';
import { detectClusterType, extractThresholds } from '@/lib/math/scanner';
import { generateId } from '@/lib/utils';

export default function MarketsPage() {
  // Auth state
  const { user } = useAuth();
  
  // Search state - initialize with user interests if available
  const [query, setQuery] = useState('');
  const initialCategory = user?.interests && user.interests.length > 0 && !user.interests.includes('all')
    ? user.interests[0] // Use first interest as default
    : 'all';
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'volume' | 'recent' | 'volatility' | 'change' | 'trending'>('trending');

  // Update category when user interests change (after profile setup)
  useEffect(() => {
    if (user?.interests && user.interests.length > 0 && !user.interests.includes('all')) {
      setCategory(user.interests[0]);
    }
  }, [user?.interests]);

  // Handle category selection - if "trending" is selected, change sortBy instead
  const handleCategorySelect = useCallback((selectedCategory: string) => {
    if (selectedCategory === 'trending') {
      setSortBy('trending');
      setCategory('all'); // Reset category when trending is selected
    } else {
      setCategory(selectedCategory);
      // If currently sorting by trending, reset to volume when selecting a real category
      if (sortBy === 'trending') {
        setSortBy('volume');
      }
    }
  }, [sortBy]);

  // Cluster mode state
  const [clusterMode, setClusterMode] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  // Research modal state
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [researchMarket, setResearchMarket] = useState<Market | null>(null);

  // Fetch markets from live Polymarket API
  // When trending is selected, use 'all' category but 'trending' sort
  const effectiveCategory = sortBy === 'trending' ? 'all' : category;
  const { markets, loading, error, total, refetch, isLive } = useMarkets({
    query,
    category: effectiveCategory,
    sortBy,
    limit: 20,
    all: true,
  });

  // Strategy context for cluster management
  const {
    state: { clusterMarkets, scannerResult },
    addToCluster,
    removeFromCluster,
    clearCluster,
    setScannerResult,
  } = useStrategy();

  // Handle refresh with cache clear
  const handleRefresh = useCallback(() => {
    refetch(true); // Force refresh
  }, [refetch]);

  // Handle research button click
  const handleResearch = useCallback((market: Market) => {
    setResearchMarket(market);
    setShowResearchModal(true);
  }, []);

  // Handle add/remove from cluster (toggle behavior)
  const handleAddToCluster = useCallback((market: Market) => {
    if (clusterMarkets.some(m => m.id === market.id)) {
      removeFromCluster(market.id);
    } else {
      addToCluster(market);
    }
  }, [clusterMarkets, addToCluster, removeFromCluster]);

  // Handle scan
  const handleScan = useCallback(async (cluster: MarketCluster, config: ScannerConfig) => {
    try {
      setScannerLoading(true);
      setShowScannerModal(true);

      const response = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, config }),
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const result = await response.json();
      setScannerResult(result);
    } catch (error) {
      console.error('Scanner error:', error);
    } finally {
      setScannerLoading(false);
    }
  }, [setScannerResult]);

  // Generate sparkline data from price changes
  const sparklineData = useMemo(() => {
    const data: Record<string, number[]> = {};
    markets.forEach((market) => {
      const basePrice = market.outcomes[0]?.price || 0.5;
      const change = market.outcomes[0]?.priceChange24h || 0;
      const points = [];
      for (let i = 0; i < 12; i++) {
        const variation = (Math.random() - 0.5) * 0.02;
        const trend = (change / 12) * i;
        points.push(basePrice - change + trend + variation);
      }
      points.push(basePrice);
      data[market.id] = points;
    });
    return data;
  }, [markets]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Markets Explorer
          </h1>
          {isLive && !loading && (
            <Badge variant="live" className="flex items-center gap-1">
              <Radio size={10} className="animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-text-secondary">
            {loading 
              ? 'Fetching live data from Polymarket...'
              : `${total} active prediction markets from Polymarket`
            }
          </p>
          {!loading && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              className="text-text-secondary hover:text-text-primary"
            >
              <RefreshCw size={14} className="mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Card padding="md" className="border-bearish/30 bg-bearish/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-bearish flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-text-primary font-medium mb-1">Unable to fetch live data</h3>
                <p className="text-sm text-text-secondary mb-3">{error}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRefresh}>
                    <RefreshCw size={14} className="mr-1" />
                    Retry
                  </Button>
                  <a 
                    href="https://docs.polymarket.com/quickstart/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-bullish hover:underline self-center"
                  >
                    Polymarket API Docs
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <MarketSearch
          onSearch={setQuery}
          onSort={setSortBy}
          currentSort={sortBy}
        />
        <div className="flex items-center justify-between gap-4">
          <CategoryPills selected={category === 'trending' || sortBy === 'trending' ? 'trending' : category} onSelect={handleCategorySelect} />
          
          {/* Cluster mode toggle */}
          <Button
            variant={clusterMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setClusterMode(!clusterMode)}
            className="flex-shrink-0"
          >
            <Zap size={14} className="mr-1" />
            {clusterMode ? 'Exit Cluster Mode' : 'Build Cluster'}
          </Button>
        </div>
      </div>

      {/* Cluster builder panel (shown when in cluster mode) */}
      {clusterMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card padding="md" className="border-bullish/30 bg-bullish/5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={20} className="text-bullish" />
                  <h3 className="font-semibold text-text-primary">Cluster Mode Active</h3>
                  <Badge variant="bullish">{clusterMarkets.length}/10</Badge>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  {clusterMarkets.length === 0 
                    ? 'Click "Add to Cluster" on any market card below to start building your cluster. Select 2+ related markets to analyze for inefficiencies.'
                    : `Select ${clusterMarkets.length >= 2 ? 'more markets or ' : ''}click "Scan Cluster" to analyze these ${clusterMarkets.length} market${clusterMarkets.length !== 1 ? 's' : ''} for constraint violations and arbitrage opportunities.`
                  }
                </p>
                
                {/* Selected markets preview */}
                {clusterMarkets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {clusterMarkets.map((market) => (
                      <Badge key={market.id} variant="default" className="flex items-center gap-1">
                        {market.question.slice(0, 30)}...
                        <button
                          onClick={() => removeFromCluster(market.id)}
                          className="ml-1 hover:text-bearish"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {clusterMarkets.length >= 2 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        try {
                          const detectedType = detectClusterType(clusterMarkets);
                          const thresholds = extractThresholds(clusterMarkets);
                          
                          const cluster: MarketCluster = {
                            id: generateId(),
                            name: `Cluster (${detectedType})`,
                            markets: clusterMarkets,
                            clusterType: detectedType,
                            thresholdConfig: thresholds.length > 0 ? {
                              variable: 'Auto-detected',
                              thresholds: thresholds.map(t => ({
                                marketId: t.marketId,
                                operator: t.operator,
                                value: t.value,
                              })),
                            } : undefined,
                            createdAt: Date.now(),
                          };
                          
                          handleScan(cluster, {} as ScannerConfig);
                        } catch (error) {
                          console.error('Error building cluster:', error);
                          // Fallback to simple cluster
                          const cluster: MarketCluster = {
                            id: generateId(),
                            name: 'Quick Scan',
                            markets: clusterMarkets,
                            clusterType: 'custom',
                            createdAt: Date.now(),
                          };
                          handleScan(cluster, {} as ScannerConfig);
                        }
                      }}
                    >
                      <Scan size={14} className="mr-1" />
                      Scan Cluster ({clusterMarkets.length} markets)
                    </Button>
                  )}
                  {clusterMarkets.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCluster}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Market grid */}
      <MarketGrid
        markets={markets}
        loading={loading}
        onAddToCluster={clusterMode ? handleAddToCluster : undefined}
        onResearch={handleResearch}
        showAddButtons={clusterMode}
        selectedMarketIds={new Set(clusterMarkets.map(m => m.id))}
        sparklineData={sparklineData}
      />

      {/* Load more / info */}
      {markets.length > 0 && !loading && (
        <div className="text-center mt-8">
          <p className="text-sm text-text-secondary">
            Showing {markets.length} of {total} markets • Real-time data from{' '}
            <a 
              href="https://polymarket.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-bullish hover:underline"
            >
              Polymarket
            </a>
          </p>
        </div>
      )}

      {/* Scanner results modal */}
      <Modal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        title="Scanner Results"
        size="lg"
      >
        <ScannerPanel
          result={scannerResult}
          loading={scannerLoading}
        />
      </Modal>

      {/* Research modal */}
      <ResearchModal
        isOpen={showResearchModal}
        onClose={() => {
          setShowResearchModal(false);
          setResearchMarket(null);
        }}
        market={researchMarket}
      />
    </div>
  );
}
