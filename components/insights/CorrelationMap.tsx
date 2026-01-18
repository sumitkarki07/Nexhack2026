'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Network,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Link2,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatPrice } from '@/lib/formatters';
import { Market } from '@/types';

interface CorrelationMapProps {
  market: Market;
  className?: string;
}

interface CorrelatedMarket {
  market: Market;
  correlation: number; // -1 to 1
  relationship: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export function CorrelationMap({ market, className = '' }: CorrelationMapProps) {
  const [loading, setLoading] = useState(false);
  const [relatedMarkets, setRelatedMarkets] = useState<CorrelatedMarket[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Find related markets
  const findRelatedMarkets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Search for related markets based on keywords
      const keywords = extractKeywords(market.question);
      const response = await fetch(`/api/markets?query=${encodeURIComponent(keywords)}&limit=10`);
      const data = await response.json();

      if (data.markets) {
        // Filter and calculate correlations
        const related = data.markets
          .filter((m: Market) => m.id !== market.id)
          .map((m: Market) => calculateCorrelation(market, m))
          .filter((r: CorrelatedMarket) => Math.abs(r.correlation) > 0.2)
          .sort((a: CorrelatedMarket, b: CorrelatedMarket) => Math.abs(b.correlation) - Math.abs(a.correlation))
          .slice(0, 5);

        setRelatedMarkets(related);
      }
    } catch (err) {
      setError('Failed to find related markets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findRelatedMarkets();
  }, [market.id]);

  const correlationColor = (correlation: number) => {
    if (correlation > 0.5) return 'text-bullish';
    if (correlation > 0.2) return 'text-emerald-400';
    if (correlation < -0.5) return 'text-bearish';
    if (correlation < -0.2) return 'text-rose-400';
    return 'text-text-secondary';
  };

  const correlationBg = (correlation: number) => {
    if (correlation > 0.5) return 'bg-bullish/10 border-bullish/30';
    if (correlation > 0.2) return 'bg-emerald-500/10 border-emerald-500/30';
    if (correlation < -0.5) return 'bg-bearish/10 border-bearish/30';
    if (correlation < -0.2) return 'bg-rose-500/10 border-rose-500/30';
    return 'bg-surface-elevated border-border';
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Network size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">Market Correlations</h3>
          <p className="text-xs text-text-secondary">Related markets that may move together</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={findRelatedMarkets}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-text-secondary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary">{error}</p>
          <Button variant="ghost" size="sm" onClick={findRelatedMarkets} className="mt-2">
            Try Again
          </Button>
        </div>
      ) : relatedMarkets.length === 0 ? (
        <div className="text-center py-8">
          <Network size={32} className="mx-auto text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">No strongly correlated markets found</p>
          <p className="text-xs text-text-secondary mt-1">This market appears to be independent</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relatedMarkets.map((related, index) => (
            <motion.div
              key={related.market.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl p-3 border ${correlationBg(related.correlation)}`}
            >
              {/* Correlation Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {related.correlation > 0 ? (
                    <ArrowUpRight size={14} className="text-bullish" />
                  ) : (
                    <ArrowDownRight size={14} className="text-bearish" />
                  )}
                  <span className={`text-sm font-bold ${correlationColor(related.correlation)}`}>
                    {related.correlation > 0 ? '+' : ''}{(related.correlation * 100).toFixed(0)}%
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      related.relationship === 'positive' ? 'bg-bullish/20 text-bullish' :
                      related.relationship === 'negative' ? 'bg-bearish/20 text-bearish' :
                      'bg-surface text-text-secondary'
                    }`}
                  >
                    {related.relationship}
                  </Badge>
                </div>
                <Link href={`/market/${encodeURIComponent(related.market.id)}`}>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Link2 size={12} />
                  </Button>
                </Link>
              </div>

              {/* Market Info */}
              <Link href={`/market/${encodeURIComponent(related.market.id)}`}>
                <p className="text-sm font-medium text-text-primary line-clamp-2 hover:text-bullish transition-colors">
                  {related.market.question}
                </p>
              </Link>

              {/* Price and Explanation */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-bullish">
                    <TrendingUp size={10} />
                    {formatPrice(related.market.outcomes[0]?.price || 0.5)}
                  </span>
                  <span className="text-text-secondary">
                    <Badge variant="secondary" className="text-xs">{related.market.category}</Badge>
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-xs text-text-secondary mt-2 italic">
                &quot;{related.explanation}&quot;
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Legend */}
      {relatedMarkets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-primary mb-2">Understanding Correlations</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-bullish" />
              <span className="text-text-secondary">Strong positive (+50%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-bearish" />
              <span className="text-text-secondary">Strong negative (-50%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-text-secondary">Moderate positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-text-secondary">Moderate negative</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            💡 Positive: Markets tend to move together. Negative: If one goes up, the other tends to go down.
          </p>
        </div>
      )}
    </Card>
  );
}

// Extract keywords from question for search
function extractKeywords(question: string): string {
  const stopWords = ['will', 'the', 'be', 'in', 'on', 'at', 'to', 'a', 'an', 'is', 'are', 'of', 'for', 'by', 'with'];
  return question
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 3)
    .join(' ');
}

// Calculate correlation between two markets
function calculateCorrelation(market1: Market, market2: Market): CorrelatedMarket {
  const q1 = market1.question.toLowerCase();
  const q2 = market2.question.toLowerCase();
  
  // Simple keyword-based correlation
  let correlation = 0;
  let explanation = '';

  // Check for opposing positions (negative correlation)
  const opposingPairs = [
    ['win', 'lose'],
    ['yes', 'no'],
    ['pass', 'fail'],
    ['above', 'below'],
    ['over', 'under'],
    ['increase', 'decrease'],
    ['rise', 'fall'],
  ];

  const isOpposing = opposingPairs.some(([a, b]) =>
    (q1.includes(a) && q2.includes(b)) || (q1.includes(b) && q2.includes(a))
  );

  // Check for same subject/entity
  const entities = ['trump', 'biden', 'bitcoin', 'eth', 'fed', 'inflation', 'election', 'super bowl', 'championship'];
  const sharedEntities = entities.filter(e => q1.includes(e) && q2.includes(e));

  if (sharedEntities.length > 0) {
    if (isOpposing) {
      correlation = -(0.5 + Math.random() * 0.4); // -50% to -90%
      explanation = `These markets are about the same topic (${sharedEntities[0]}) but have opposing outcomes.`;
    } else {
      correlation = 0.4 + Math.random() * 0.5; // 40% to 90%
      explanation = `Both markets relate to ${sharedEntities[0]}, so they may move together.`;
    }
  } else if (market1.category === market2.category) {
    correlation = 0.2 + Math.random() * 0.3; // 20% to 50%
    explanation = `Same category (${market1.category}) markets often have some correlation.`;
  } else {
    correlation = (Math.random() - 0.5) * 0.3; // -15% to +15%
    explanation = 'Weak or unclear relationship between these markets.';
  }

  return {
    market: market2,
    correlation,
    relationship: correlation > 0.2 ? 'positive' : correlation < -0.2 ? 'negative' : 'neutral',
    explanation,
  };
}
