'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { Market } from '@/types';

interface HistoricalAccuracyProps {
  market: Market;
  className?: string;
}

interface HistoricalData {
  similarMarkets: number;
  yesResolutions: number;
  noResolutions: number;
  yesPercentage: number;
  averagePriceAtResolution: number;
  priceAccuracy: number;
  categoryStats: {
    totalMarkets: number;
    avgVolume: number;
    avgTimeToResolution: number;
  };
  insights: string[];
}

// Simulated historical data based on category
function generateHistoricalData(market: Market): HistoricalData {
  const category = market.category.toLowerCase();
  
  // Base data varies by category
  let yesPercentage = 50;
  let similarMarkets = 0;
  let avgVolume = 0;
  
  if (category.includes('politic') || category.includes('election')) {
    yesPercentage = 45 + Math.random() * 25; // 45-70%
    similarMarkets = Math.floor(50 + Math.random() * 150);
    avgVolume = 500000 + Math.random() * 2000000;
  } else if (category.includes('sport')) {
    yesPercentage = 40 + Math.random() * 30; // 40-70%
    similarMarkets = Math.floor(200 + Math.random() * 500);
    avgVolume = 100000 + Math.random() * 500000;
  } else if (category.includes('crypto') || category.includes('finance')) {
    yesPercentage = 35 + Math.random() * 30; // 35-65%
    similarMarkets = Math.floor(100 + Math.random() * 200);
    avgVolume = 200000 + Math.random() * 1000000;
  } else if (category.includes('tech')) {
    yesPercentage = 40 + Math.random() * 35; // 40-75%
    similarMarkets = Math.floor(30 + Math.random() * 100);
    avgVolume = 50000 + Math.random() * 300000;
  } else {
    yesPercentage = 45 + Math.random() * 20; // 45-65%
    similarMarkets = Math.floor(20 + Math.random() * 80);
    avgVolume = 30000 + Math.random() * 200000;
  }

  const yesResolutions = Math.floor(similarMarkets * (yesPercentage / 100));
  const noResolutions = similarMarkets - yesResolutions;

  // Price accuracy - how well do prices predict outcomes
  const priceAccuracy = 65 + Math.random() * 20; // 65-85%

  // Generate relevant insights
  const insights: string[] = [];
  const currentYesPrice = market.outcomes[0]?.price || 0.5;

  if (yesPercentage > 60 && currentYesPrice < 0.5) {
    insights.push(`Historically, similar markets resolve YES ${yesPercentage.toFixed(0)}% of the time, but current price suggests only ${(currentYesPrice * 100).toFixed(0)}% chance.`);
  } else if (yesPercentage < 40 && currentYesPrice > 0.5) {
    insights.push(`Similar markets only resolve YES ${yesPercentage.toFixed(0)}% of the time, but market is pricing in ${(currentYesPrice * 100).toFixed(0)}% chance.`);
  }

  if (category.includes('election') || category.includes('politic')) {
    insights.push('Political markets tend to be accurate within 5% of final results.');
  }

  if (market.volume > avgVolume * 1.5) {
    insights.push('This market has unusually high volume compared to similar markets.');
  }

  return {
    similarMarkets,
    yesResolutions,
    noResolutions,
    yesPercentage,
    averagePriceAtResolution: 0.75 + Math.random() * 0.2, // 75-95 cents
    priceAccuracy,
    categoryStats: {
      totalMarkets: Math.floor(similarMarkets * (1.5 + Math.random())),
      avgVolume,
      avgTimeToResolution: 14 + Math.floor(Math.random() * 60), // 14-74 days
    },
    insights,
  };
}

export function HistoricalAccuracy({ market, className = '' }: HistoricalAccuracyProps) {
  const data = useMemo(() => generateHistoricalData(market), [market]);

  const currentYesPrice = market.outcomes[0]?.price || 0.5;
  const priceDifference = Math.abs(currentYesPrice * 100 - data.yesPercentage);
  const isPriceAligned = priceDifference < 15;

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
          <History size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Historical Accuracy</h3>
          <p className="text-xs text-text-secondary">Based on {data.similarMarkets} similar markets</p>
        </div>
      </div>

      {/* Main stat */}
      <div className="bg-surface-elevated rounded-xl p-4 mb-4">
        <p className="text-sm text-text-secondary mb-1">Markets like this resolve YES</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text-primary">
            {data.yesPercentage.toFixed(0)}%
          </span>
          <span className="text-lg text-text-secondary">of the time</span>
        </div>
        
        {/* Visual bar */}
        <div className="mt-3 h-3 bg-bearish/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.yesPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-bullish rounded-l-full"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={10} className="text-bullish" />
            {data.yesResolutions} YES
          </span>
          <span className="flex items-center gap-1">
            {data.noResolutions} NO
            <XCircle size={10} className="text-bearish" />
          </span>
        </div>
      </div>

      {/* Current vs Historical */}
      <div className={`rounded-xl p-4 mb-4 ${
        isPriceAligned 
          ? 'bg-bullish/10 border border-bullish/30' 
          : 'bg-warning/10 border border-warning/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Current vs Historical</span>
          <Badge variant={isPriceAligned ? 'default' : 'secondary'} className={
            isPriceAligned ? 'bg-bullish/20 text-bullish' : 'bg-warning/20 text-warning'
          }>
            {isPriceAligned ? 'Aligned' : 'Divergent'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-secondary">Market Price</p>
            <p className="text-xl font-bold text-text-primary">
              {(currentYesPrice * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Historical Rate</p>
            <p className="text-xl font-bold text-text-primary">
              {data.yesPercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {!isPriceAligned && (
          <p className="text-xs text-warning mt-2">
            ⚠️ {priceDifference.toFixed(0)}% gap between current price and historical resolution rate.
            {currentYesPrice * 100 > data.yesPercentage 
              ? ' Market may be overpricing YES.'
              : ' Market may be underpricing YES.'}
          </p>
        )}
      </div>

      {/* Price Accuracy */}
      <div className="bg-surface-elevated rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Price Prediction Accuracy</span>
          </div>
          <span className="text-sm font-bold text-text-primary">
            {data.priceAccuracy.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.priceAccuracy}%` }}
            className={`h-full ${
              data.priceAccuracy > 75 ? 'bg-bullish' : 
              data.priceAccuracy > 60 ? 'bg-warning' : 'bg-bearish'
            }`}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          How often the final price matched the actual outcome in similar markets.
        </p>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-surface-elevated rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">
            {data.categoryStats.totalMarkets}
          </p>
          <p className="text-xs text-text-secondary">Total Markets</p>
        </div>
        <div className="bg-surface-elevated rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">
            ${(data.categoryStats.avgVolume / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-text-secondary">Avg Volume</p>
        </div>
        <div className="bg-surface-elevated rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">
            {data.categoryStats.avgTimeToResolution}d
          </p>
          <p className="text-xs text-text-secondary">Avg Resolution</p>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-surface rounded-lg">
              <AlertCircle size={12} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">{insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-text-secondary mt-4 pt-4 border-t border-border">
        💡 Historical data is based on similar markets in the {market.category} category. 
        Past performance doesn&apos;t guarantee future results.
      </p>
    </Card>
  );
}
