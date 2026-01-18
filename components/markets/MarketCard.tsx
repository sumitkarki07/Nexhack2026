'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Plus, Search, Sparkles } from 'lucide-react';
import { Market } from '@/types';
import { Badge, Button } from '@/components/ui';
import { Sparkline } from './Sparkline';
import { formatPrice, formatPriceChange, formatCompactNumber, formatRelativeDate } from '@/lib/formatters';

interface MarketCardProps {
  market: Market;
  sparklineData?: number[];
  onAddToCluster?: (market: Market) => void;
  onResearch?: (market: Market) => void;
  showAddButton?: boolean;
  index?: number;
}

export function MarketCard({
  market,
  sparklineData = [],
  onAddToCluster,
  onResearch,
  showAddButton = false,
  index = 0,
}: MarketCardProps) {
  const yesOutcome = market.outcomes[0];
  const yesPrice = yesOutcome?.price || 0.5;
  const priceChange = yesOutcome?.priceChange24h || 0;
  const changeInfo = formatPriceChange(priceChange);

  const categoryColors: Record<string, string> = {
    crypto: 'bg-warning/10 text-warning',
    politics: 'bg-bullish/10 text-bullish',
    sports: 'bg-success/10 text-success',
    business: 'bg-purple-500/10 text-purple-400',
    science: 'bg-cyan-500/10 text-cyan-400',
    'pop-culture': 'bg-pink-500/10 text-pink-400',
    world: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/market/${encodeURIComponent(market.id)}`}>
        <div className="group bg-surface border border-border rounded-xl p-4 hover:border-text-secondary transition-all duration-200 cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <Badge
              className={categoryColors[market.category] || 'bg-border text-text-secondary'}
              size="sm"
            >
              {market.category}
            </Badge>
            {market.active && !market.closed && (
              <Badge variant="live" size="sm">
                LIVE
              </Badge>
            )}
          </div>

          {/* Question */}
          <h3 className="text-text-primary font-medium text-sm leading-snug mb-4 line-clamp-2 group-hover:text-bullish transition-colors">
            {market.question}
          </h3>

          {/* Price and Stats */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              {/* Yes Price */}
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Yes</p>
                <p className="text-xl font-bold text-bullish">{formatPrice(yesPrice)}</p>
              </div>

              {/* 24h Change */}
              <div>
                <p className="text-xs text-text-secondary mb-0.5">24h</p>
                <div className="flex items-center gap-1">
                  {changeInfo.isPositive ? (
                    <TrendingUp size={14} className="text-success" />
                  ) : !changeInfo.isNeutral ? (
                    <TrendingDown size={14} className="text-bearish" />
                  ) : null}
                  <span
                    className={`text-sm font-medium ${
                      changeInfo.isPositive
                        ? 'text-success'
                        : changeInfo.isNeutral
                        ? 'text-text-secondary'
                        : 'text-bearish'
                    }`}
                  >
                    {changeInfo.text}
                  </span>
                </div>
              </div>

              {/* Volume */}
              <div className="hidden sm:block">
                <p className="text-xs text-text-secondary mb-0.5">Volume</p>
                <p className="text-sm font-medium text-text-primary">
                  ${formatCompactNumber(market.volume)}
                </p>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-center gap-2">
              {sparklineData.length > 0 && (
                <Sparkline
                  data={sparklineData}
                  isUp={changeInfo.isPositive || changeInfo.isNeutral}
                  width={60}
                  height={24}
                />
              )}
            </div>
          </div>

          {/* Footer with end date and research button */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-text-secondary" />
              <span className="text-xs text-text-secondary">
                Ends {formatRelativeDate(market.endDate)}
              </span>
            </div>
            
            {/* Research button */}
            {onResearch && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResearch(market);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-bullish bg-bullish/10 hover:bg-bullish/20 rounded-lg transition-all duration-200 hover:scale-105"
                title="Research this market"
              >
                <Sparkles size={12} />
                <span>Research</span>
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cluster button (shown when in cluster mode) */}
      {showAddButton && onAddToCluster && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCluster(market);
          }}
          className="mt-2 w-full"
        >
          <Plus size={14} className="mr-1" />
          Add to Cluster
        </Button>
      )}
    </motion.div>
  );
}
