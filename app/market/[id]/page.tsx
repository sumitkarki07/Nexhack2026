'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, Activity, ExternalLink, Share2, Sparkles, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';
import { PriceChart } from '@/components/charts';
import { StrategyBuilder } from '@/components/strategy';
import { PortfolioSimulator } from '@/components/simulator';
import { ScannerPanel, ClusterBuilder } from '@/components/scanner';
import { GeminiBrief, SedaComposer, ResearchModal } from '@/components/research';
import {
  CrowdWisdom,
  HistoricalAccuracy,
  CounterArguments,
  ResolutionTracker,
  ConfidenceMeter,
  ELI5Explainer,
  QuickCompare,
  CorrelationMap,
  SocialSentiment,
  SmartAlerts,
} from '@/components/insights';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton } from '@/components/ui';
import { useMarketDetail, useSavedResearch } from '@/hooks';
import { useStrategy } from '@/context';
import { formatPrice, formatCompactNumber, formatRelativeDate, formatPriceChange } from '@/lib/formatters';
import { getPolymarketUrl } from '@/lib/polymarket';
import {
  GeminiBrief as GeminiBriefType,
  GeminiError,
  MarketCluster,
  ScannerConfig,
  SedaPost,
  StrategyAnalysis,
} from '@/types';

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = typeof params.id === 'string' ? decodeURIComponent(params.id) : null;

  // Fetch market data
  const { market, priceHistory, loading, historyLoading, error, timeRange, setTimeRange } =
    useMarketDetail(marketId);

  // AI brief state
  const [brief, setBrief] = useState<GeminiBriefType | null>(null);
  const [briefError, setBriefError] = useState<GeminiError | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Scanner state
  const [scannerLoading, setScannerLoading] = useState(false);

  // Strategy analysis for Seda composer
  const [strategyAnalysis, setStrategyAnalysis] = useState<StrategyAnalysis | null>(null);

  // Research modal state
  const [showResearchModal, setShowResearchModal] = useState(false);

  // Saved research
  const { isMarketSaved } = useSavedResearch();
  const isSaved = marketId ? isMarketSaved(marketId) : false;

  // Context
  const {
    state: { clusterMarkets, scannerResult },
    addToCluster,
    removeFromCluster,
    clearCluster,
    setScannerResult,
    saveDraft,
  } = useStrategy();

  // Generate AI brief
  const generateBrief = useCallback(async () => {
    if (!market) return;

    try {
      setBriefLoading(true);
      setBriefError(null);

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          priceHistory,
          scannerFlags: scannerResult?.flags || [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBrief(data.brief);
      } else {
        setBriefError(data.error);
      }
    } catch (err) {
      setBriefError({
        code: 'API_ERROR',
        message: 'Failed to generate brief. Please try again.',
      });
    } finally {
      setBriefLoading(false);
    }
  }, [market, priceHistory, scannerResult]);

  // Handle scanner
  const handleScan = useCallback(
    async (cluster: MarketCluster, config: ScannerConfig) => {
      try {
        setScannerLoading(true);

        const response = await fetch('/api/scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cluster, config }),
        });

        if (!response.ok) throw new Error('Scan failed');

        const result = await response.json();
        setScannerResult(result);
      } catch (error) {
        console.error('Scanner error:', error);
      } finally {
        setScannerLoading(false);
      }
    },
    [setScannerResult]
  );

  // Handle save Seda post
  const handleSaveSedaPost = useCallback(
    (post: SedaPost) => {
      if (!market) return;
      saveDraft({
        marketId: market.id,
        marketQuestion: market.question,
        brief: brief || undefined,
        sedaPost: post,
        notes: '',
      });
    },
    [market, brief, saveDraft]
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-80 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !market) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Market Not Found</h2>
          <p className="text-text-secondary mb-4">{error || 'Unable to load market data'}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Markets
          </Button>
        </Card>
      </div>
    );
  }

  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;
  const priceChangeInfo = formatPriceChange(market.outcomes[0]?.priceChange24h || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} className="mr-1" />
        Back to Markets
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">{market.category}</Badge>
              {market.active && !market.closed && <Badge variant="live">LIVE</Badge>}
              {isSaved && (
                <Badge variant="secondary" className="bg-warning/20 text-warning">
                  <BookmarkCheck size={12} className="mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{market.question}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {(() => {
                  const endDate = new Date(market.endDate);
                  const hasEnded = endDate.getTime() < Date.now();
                  return hasEnded ? 'Ended' : 'Ends';
                })()} {formatRelativeDate(market.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign size={14} />
                ${formatCompactNumber(market.volume)} volume
              </span>
              <span className="flex items-center gap-1">
                <Activity size={14} />
                ${formatCompactNumber(market.liquidity)} liquidity
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {/* Research Button - Primary Action */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowResearchModal(true)}
              className="bg-gradient-to-r from-bullish to-bullish-hover"
            >
              <Sparkles size={14} className="mr-1" />
              Research This
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (clusterMarkets.some((m) => m.id === market.id)) {
                  removeFromCluster(market.id);
                } else {
                  addToCluster(market);
                }
              }}
            >
              {clusterMarkets.some((m) => m.id === market.id) ? 'Remove from Cluster' : 'Add to Cluster'}
            </Button>
            <a
              href={getPolymarketUrl(market)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                // Debug: log market data for URL generation
                console.log('[Polymarket Link] Market data:', {
                  id: market?.id,
                  slug: market?.slug,
                  conditionId: market?.conditionId,
                  eventSlug: market?.eventSlug,
                  generatedUrl: getPolymarketUrl(market),
                });
              }}
            >
              <Button variant="secondary" size="sm">
                <ExternalLink size={14} className="mr-1" />
                Polymarket
              </Button>
            </a>
          </div>
        </div>

        {/* Price summary */}
        <div className="flex items-center gap-6 mt-4 p-4 bg-surface rounded-xl border border-border">
          <div>
            <p className="text-xs text-text-secondary uppercase mb-1">Yes Price</p>
            <p className="text-2xl font-bold text-bullish">{formatPrice(yesPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase mb-1">No Price</p>
            <p className="text-2xl font-bold text-bearish">{formatPrice(noPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase mb-1">24h Change</p>
            <p
              className={`text-xl font-bold ${
                priceChangeInfo.isPositive
                  ? 'text-success'
                  : priceChangeInfo.isNeutral
                  ? 'text-text-secondary'
                  : 'text-bearish'
              }`}
            >
              {priceChangeInfo.text}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main content: Chart + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Price chart (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <PriceChart
            data={priceHistory}
            range={timeRange}
            onRangeChange={setTimeRange}
            loading={historyLoading}
          />
        </div>

        {/* Right: Tabs (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="strategy">
            <TabsList className="mb-4">
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="scanner">Scanner</TabsTrigger>
              <TabsTrigger value="brief">AI Brief</TabsTrigger>
              <TabsTrigger value="seda">Seda</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy">
              <StrategyBuilder
                market={market}
                onAddToResearch={(analysis) => {
                  // Save strategy analysis for Seda composer
                  setStrategyAnalysis(analysis);
                  // Trigger AI research modal to generate research brief
                  setShowResearchModal(true);
                }}
              />
            </TabsContent>

            <TabsContent value="scanner">
              <div className="space-y-4">
                <ClusterBuilder
                  markets={clusterMarkets}
                  onScan={handleScan}
                  onRemoveMarket={removeFromCluster}
                  onClear={clearCluster}
                />
                {(scannerResult || scannerLoading) && (
                  <ScannerPanel result={scannerResult} loading={scannerLoading} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="brief">
              <GeminiBrief
                brief={brief}
                error={briefError}
                loading={briefLoading}
                market={market}
                onGenerate={generateBrief}
                onRetry={generateBrief}
              />
            </TabsContent>

            <TabsContent value="seda">
              <SedaComposer
                market={market}
                brief={brief}
                scannerResult={scannerResult}
                strategyAnalysis={strategyAnalysis}
                onSave={handleSaveSedaPost}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Description */}
      {market.description && (
        <Card padding="md" className="mt-6">
          <h3 className="text-sm font-medium text-text-primary mb-2">Description</h3>
          <p className="text-sm text-text-secondary">{market.description}</p>
        </Card>
      )}

      {/* Smart Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-bullish" />
          Smart Decision Tools
        </h2>
        
        {/* Top Row: Alerts + Simulator + ELI5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SmartAlerts market={market} />
          <PortfolioSimulator market={market} />
          <ELI5Explainer market={market} />
        </div>

        {/* Second Row: Crowd Wisdom + Historical + Counter Arguments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <CrowdWisdom market={market} priceHistory={priceHistory} />
          <HistoricalAccuracy market={market} />
          <CounterArguments market={market} />
        </div>

        {/* Third Row: Resolution Tracker + Confidence + Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <ResolutionTracker market={market} />
          <ConfidenceMeter market={market} priceHistory={priceHistory} />
          <SocialSentiment market={market} />
        </div>

        {/* Fourth Row: Compare + Correlations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickCompare market={market} />
          <CorrelationMap market={market} />
        </div>
      </motion.div>

      {/* Research Modal */}
      <ResearchModal
        isOpen={showResearchModal}
        onClose={() => setShowResearchModal(false)}
        market={market}
      />
    </div>
  );
}
