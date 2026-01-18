'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ChevronRight,
  Plus,
  X,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { ComparisonBarChart } from '@/components/charts';
import { formatPrice, formatCompactNumber } from '@/lib/formatters';
import { Market } from '@/types';

interface QuickCompareProps {
  market: Market;
  className?: string;
}

interface ComparisonMetric {
  label: string;
  market1Value: string | number;
  market2Value: string | number;
  market1Better: boolean | null;
  format?: 'price' | 'number' | 'percent' | 'text';
}

export function QuickCompare({ market, className = '' }: QuickCompareProps) {
  const [compareMarket, setCompareMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Search for markets
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/markets?query=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await response.json();
        // Filter out current market
        setSearchResults((data.markets || []).filter((m: Market) => m.id !== market.id));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, market.id]);

  // Generate comparison metrics
  const comparison = useMemo((): ComparisonMetric[] | null => {
    if (!compareMarket) return null;

    const m1YesPrice = market.outcomes[0]?.price || 0.5;
    const m2YesPrice = compareMarket.outcomes[0]?.price || 0.5;

    return [
      {
        label: 'YES Price',
        market1Value: formatPrice(m1YesPrice),
        market2Value: formatPrice(m2YesPrice),
        market1Better: null,
      },
      {
        label: 'Implied Probability',
        market1Value: `${(m1YesPrice * 100).toFixed(0)}%`,
        market2Value: `${(m2YesPrice * 100).toFixed(0)}%`,
        market1Better: null,
      },
      {
        label: 'Volume',
        market1Value: `$${formatCompactNumber(market.volume)}`,
        market2Value: `$${formatCompactNumber(compareMarket.volume)}`,
        market1Better: market.volume > compareMarket.volume,
      },
      {
        label: 'Liquidity',
        market1Value: `$${formatCompactNumber(market.liquidity)}`,
        market2Value: `$${formatCompactNumber(compareMarket.liquidity)}`,
        market1Better: market.liquidity > compareMarket.liquidity,
      },
      {
        label: 'Potential ROI (YES)',
        market1Value: `${(((1 / m1YesPrice) - 1) * 100).toFixed(0)}%`,
        market2Value: `${(((1 / m2YesPrice) - 1) * 100).toFixed(0)}%`,
        market1Better: m1YesPrice < m2YesPrice, // Lower price = higher ROI
      },
      {
        label: 'Category',
        market1Value: market.category,
        market2Value: compareMarket.category,
        market1Better: null,
      },
    ];
  }, [market, compareMarket]);

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg flex items-center justify-center">
          <GitCompare size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Quick Compare</h3>
          <p className="text-xs text-text-secondary">Compare with similar markets</p>
        </div>
      </div>

      {/* Current Market */}
      <div className="bg-surface-elevated rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default" className="text-xs">Current</Badge>
        </div>
        <p className="text-sm font-medium text-text-primary line-clamp-2">{market.question}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <TrendingUp size={10} className="text-bullish" />
            {formatPrice(market.outcomes[0]?.price || 0.5)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={10} />
            ${formatCompactNumber(market.volume)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center my-2">
        <ArrowRight size={16} className="text-text-secondary" />
        <span className="text-xs text-text-secondary mx-2">vs</span>
        <ArrowRight size={16} className="text-text-secondary rotate-180" />
      </div>

      {/* Compare Market Selection */}
      {!compareMarket ? (
        <div className="space-y-3">
          {!showSearch ? (
            <Button
              variant="secondary"
              onClick={() => setShowSearch(true)}
              className="w-full border-dashed"
            >
              <Plus size={14} className="mr-2" />
              Select Market to Compare
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a market..."
                leftIcon={loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                autoFocus
              />
              
              {searchResults.length > 0 && (
                <div className="bg-surface-elevated rounded-lg border border-border max-h-48 overflow-y-auto">
                  {searchResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCompareMarket(m);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full p-3 text-left hover:bg-surface transition-colors border-b border-border last:border-0"
                    >
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{m.question}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        <Badge variant="secondary" className="text-xs">{m.category}</Badge>
                        <span>{formatPrice(m.outcomes[0]?.price || 0.5)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Compare Market Card */}
            <div className="bg-surface-elevated rounded-xl p-3 relative">
              <button
                onClick={() => setCompareMarket(null)}
                className="absolute top-2 right-2 p-1 hover:bg-surface rounded-lg transition-colors"
              >
                <X size={14} className="text-text-secondary" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">Compare</Badge>
              </div>
              <p className="text-sm font-medium text-text-primary line-clamp-2 pr-6">{compareMarket.question}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} className="text-bullish" />
                  {formatPrice(compareMarket.outcomes[0]?.price || 0.5)}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={10} />
                  ${formatCompactNumber(compareMarket.volume)}
                </span>
              </div>
            </div>

            {/* Comparison Table */}
            {comparison && (
              <div className="space-y-3">
                <div className="bg-surface-elevated rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-xs text-text-secondary font-normal">Metric</th>
                        <th className="text-center p-2 text-xs text-text-secondary font-normal">Current</th>
                        <th className="text-center p-2 text-xs text-text-secondary font-normal">Compare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((metric, idx) => (
                        <tr key={metric.label} className={idx < comparison.length - 1 ? 'border-b border-border' : ''}>
                          <td className="p-2 text-text-secondary text-xs">{metric.label}</td>
                          <td className={`p-2 text-center font-medium ${
                            metric.market1Better === true ? 'text-bullish' :
                            metric.market1Better === false ? 'text-text-secondary' : 'text-text-primary'
                          }`}>
                            {metric.market1Value}
                          </td>
                          <td className={`p-2 text-center font-medium ${
                            metric.market1Better === false ? 'text-bullish' :
                            metric.market1Better === true ? 'text-text-secondary' : 'text-text-primary'
                          }`}>
                            {metric.market2Value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bar Chart Visualization */}
                <div className="bg-surface-elevated rounded-xl p-3 border border-border">
                  <ComparisonBarChart market1={market} market2={compareMarket} />
                </div>
              </div>
            )}

            {/* View Compare Market */}
            <Link href={`/market/${encodeURIComponent(compareMarket.id)}`}>
              <Button variant="secondary" size="sm" className="w-full">
                View {compareMarket.question.slice(0, 30)}...
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>

            {/* Change Comparison */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCompareMarket(null);
                setShowSearch(true);
              }}
              className="w-full"
            >
              <GitCompare size={12} className="mr-2" />
              Compare Different Market
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Tip */}
      <p className="text-xs text-text-secondary mt-4 pt-4 border-t border-border">
        💡 Compare similar markets to find better odds or spot pricing inefficiencies.
      </p>
    </Card>
  );
}
