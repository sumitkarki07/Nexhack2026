'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  AlertCircle,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatCompactNumber, formatPrice } from '@/lib/formatters';
import { Market, PricePoint } from '@/types';

interface CrowdWisdomProps {
  market: Market;
  priceHistory?: PricePoint[];
  className?: string;
}

interface WisdomMetrics {
  yesBettors: number;
  noBettors: number;
  yesPercentage: number;
  noPercentage: number;
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  volumeChange24h: number;
  smartMoneySignal: 'bullish' | 'bearish' | 'neutral';
  smartMoneyConfidence: number;
  liquidityDepth: 'deep' | 'medium' | 'shallow';
  consensusStrength: number;
  momentum: number;
}

export function CrowdWisdom({ market, priceHistory = [], className = '' }: CrowdWisdomProps) {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;

  const metrics = useMemo((): WisdomMetrics => {
    // Estimate bettors based on volume and average bet size assumption
    const avgBetSize = 50; // Assumed average
    const totalBettors = Math.floor(market.volume / avgBetSize);
    const yesBettors = Math.floor(totalBettors * yesPrice);
    const noBettors = totalBettors - yesBettors;

    // Calculate volume trend from price history
    let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let volumeChange24h = 0;

    if (priceHistory.length > 10) {
      const recent = priceHistory.slice(-10);
      const older = priceHistory.slice(-20, -10);
      
      if (recent.length && older.length) {
        const recentAvg = recent.reduce((s, p) => s + (p.volume || 0), 0) / recent.length;
        const olderAvg = older.reduce((s, p) => s + (p.volume || 0), 0) / older.length;
        
        if (olderAvg > 0) {
          volumeChange24h = ((recentAvg - olderAvg) / olderAvg) * 100;
          if (volumeChange24h > 10) volumeTrend = 'increasing';
          else if (volumeChange24h < -10) volumeTrend = 'decreasing';
        }
      }
    }

    // Smart money signal based on large volume moves
    let smartMoneySignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let smartMoneyConfidence = 50;

    if (priceHistory.length > 5) {
      const recentPrices = priceHistory.slice(-5);
      const priceChange = recentPrices[recentPrices.length - 1]?.price - recentPrices[0]?.price;
      
      if (priceChange > 0.05) {
        smartMoneySignal = 'bullish';
        smartMoneyConfidence = Math.min(90, 50 + (priceChange * 200));
      } else if (priceChange < -0.05) {
        smartMoneySignal = 'bearish';
        smartMoneyConfidence = Math.min(90, 50 + (Math.abs(priceChange) * 200));
      }
    }

    // Liquidity depth
    let liquidityDepth: 'deep' | 'medium' | 'shallow' = 'medium';
    if (market.liquidity > 100000) liquidityDepth = 'deep';
    else if (market.liquidity < 10000) liquidityDepth = 'shallow';

    // Consensus strength (how far from 50/50)
    const consensusStrength = Math.abs(yesPrice - 0.5) * 200;

    // Momentum from recent price changes
    let momentum = 0;
    if (priceHistory.length > 2) {
      const recentPrices = priceHistory.slice(-10);
      if (recentPrices.length >= 2) {
        momentum = (recentPrices[recentPrices.length - 1]?.price - recentPrices[0]?.price) * 100;
      }
    }

    return {
      yesBettors,
      noBettors,
      yesPercentage: yesPrice * 100,
      noPercentage: noPrice * 100,
      volumeTrend,
      volumeChange24h,
      smartMoneySignal,
      smartMoneyConfidence,
      liquidityDepth,
      consensusStrength,
      momentum,
    };
  }, [market, priceHistory, yesPrice, noPrice]);

  const volumeTrendColors = {
    increasing: 'text-bullish',
    decreasing: 'text-bearish',
    stable: 'text-text-secondary',
  };

  const smartMoneyColors = {
    bullish: 'text-bullish bg-bullish/10',
    bearish: 'text-bearish bg-bearish/10',
    neutral: 'text-text-secondary bg-surface-elevated',
  };

  const liquidityColors = {
    deep: 'text-bullish',
    medium: 'text-warning',
    shallow: 'text-bearish',
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <Users size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Crowd Wisdom</h3>
          <p className="text-xs text-text-secondary">What the market thinks</p>
        </div>
      </div>

      {/* YES/NO Distribution Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-bullish" />
            <span className="font-medium text-bullish">YES</span>
            <span className="text-text-secondary">{metrics.yesPercentage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">{metrics.noPercentage.toFixed(1)}%</span>
            <span className="font-medium text-bearish">NO</span>
            <TrendingDown size={14} className="text-bearish" />
          </div>
        </div>
        
        <div className="h-4 bg-bearish rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.yesPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-0 top-0 h-full bg-bullish rounded-l-full"
          />
          {/* Marker at 50% */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/30" />
        </div>

        {/* Bettor counts */}
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>~{formatCompactNumber(metrics.yesBettors)} bettors</span>
          <span>~{formatCompactNumber(metrics.noBettors)} bettors</span>
        </div>
      </div>

      {/* Key Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Smart Money Signal */}
        <div className={`rounded-xl p-3 ${smartMoneyColors[metrics.smartMoneySignal]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} />
            <span className="text-xs font-medium">Smart Money</span>
          </div>
          <p className="text-lg font-bold capitalize">{metrics.smartMoneySignal}</p>
          <div className="mt-1 h-1.5 bg-background/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.smartMoneyConfidence}%` }}
              className={`h-full ${
                metrics.smartMoneySignal === 'bullish' ? 'bg-bullish' :
                metrics.smartMoneySignal === 'bearish' ? 'bg-bearish' : 'bg-text-secondary'
              }`}
            />
          </div>
        </div>

        {/* Volume Trend */}
        <div className="bg-surface-elevated rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={12} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-secondary">Volume Trend</span>
          </div>
          <p className={`text-lg font-bold capitalize ${volumeTrendColors[metrics.volumeTrend]}`}>
            {metrics.volumeTrend}
          </p>
          {metrics.volumeChange24h !== 0 && (
            <p className="text-xs text-text-secondary">
              {metrics.volumeChange24h > 0 ? '+' : ''}{metrics.volumeChange24h.toFixed(0)}% 24h
            </p>
          )}
        </div>

        {/* Liquidity Depth */}
        <div className="bg-surface-elevated rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={12} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-secondary">Liquidity</span>
          </div>
          <p className={`text-lg font-bold capitalize ${liquidityColors[metrics.liquidityDepth]}`}>
            {metrics.liquidityDepth}
          </p>
          <p className="text-xs text-text-secondary">
            ${formatCompactNumber(market.liquidity)}
          </p>
        </div>

        {/* Momentum */}
        <div className="bg-surface-elevated rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-secondary">Momentum</span>
          </div>
          <p className={`text-lg font-bold ${
            metrics.momentum > 2 ? 'text-bullish' :
            metrics.momentum < -2 ? 'text-bearish' : 'text-text-secondary'
          }`}>
            {metrics.momentum > 0 ? '+' : ''}{metrics.momentum.toFixed(1)}%
          </p>
          <p className="text-xs text-text-secondary">
            {metrics.momentum > 2 ? 'Gaining' : metrics.momentum < -2 ? 'Losing' : 'Flat'}
          </p>
        </div>
      </div>

      {/* Consensus Strength */}
      <div className="bg-surface-elevated rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Consensus Strength</span>
          <Badge variant={metrics.consensusStrength > 40 ? 'default' : 'secondary'}>
            {metrics.consensusStrength > 60 ? 'Strong' : 
             metrics.consensusStrength > 30 ? 'Moderate' : 'Weak'}
          </Badge>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.consensusStrength}%` }}
            className={`h-full ${
              metrics.consensusStrength > 60 ? 'bg-bullish' :
              metrics.consensusStrength > 30 ? 'bg-warning' : 'bg-text-secondary'
            }`}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {metrics.consensusStrength > 60 
            ? 'Market has strong conviction on the outcome.'
            : metrics.consensusStrength > 30
            ? 'Market is leaning but not fully convinced.'
            : 'Market is uncertain - close to 50/50 split.'}
        </p>
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-3 bg-surface rounded-lg border border-border">
        <p className="text-xs text-text-secondary">
          <AlertCircle size={10} className="inline mr-1" />
          <strong>Interpretation:</strong>{' '}
          {metrics.smartMoneySignal === 'bullish' && metrics.volumeTrend === 'increasing'
            ? 'Strong buying pressure with smart money flowing in. Bullish momentum.'
            : metrics.smartMoneySignal === 'bearish' && metrics.volumeTrend === 'increasing'
            ? 'Increased selling activity. Market sentiment turning negative.'
            : metrics.volumeTrend === 'decreasing'
            ? 'Interest fading. Wait for catalysts before betting.'
            : 'Market in wait-and-see mode. Watch for breaking news.'}
        </p>
      </div>
    </Card>
  );
}
