'use client';

import { motion } from 'framer-motion';
import {
  Newspaper,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Market } from '@/types';
import { useMarketNews } from '@/hooks/useMarketNews';
import { formatRelativeDate } from '@/lib/formatters';

interface MarketNewsProps {
  market: Market;
  className?: string;
}

export function MarketNews({ market, className = '' }: MarketNewsProps) {
  const { articles, loading, error, refetch } = useMarketNews(market.id);

  const sentimentColors = {
    positive: 'text-bullish bg-bullish/10',
    negative: 'text-bearish bg-bearish/10',
    neutral: 'text-text-secondary bg-surface-elevated',
  };

  const sentimentIcons = {
    positive: <TrendingUp size={12} className="text-bullish" />,
    negative: <TrendingDown size={12} className="text-bearish" />,
    neutral: <Minus size={12} className="text-text-secondary" />,
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <Newspaper size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">Market News</h3>
          <p className="text-xs text-text-secondary">Recent articles related to this market</p>
        </div>
        {articles.length > 0 && (
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
        )}
      </div>

      {/* Content */}
      {loading && articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">Fetching news articles...</p>
        </div>
      ) : error && articles.length === 0 ? (
        <div className="p-4 bg-bearish/10 border border-bearish/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-bearish flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-bearish font-medium">Failed to fetch news</p>
              <p className="text-xs text-text-secondary mt-0.5">{error}</p>
              <Button variant="secondary" size="sm" onClick={refetch} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-4 bg-surface-elevated rounded-lg text-center">
          <Newspaper size={32} className="mx-auto text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary mb-1">No news articles found</p>
          <p className="text-xs text-text-secondary">
            {error ? (
              <>API Error: {error}. Check server logs for details.</>
            ) : (
              <>No credible market-moving news found for this market. Try refreshing or check NEWS_API_KEY configuration.</>
            )}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {articles.map((article, index) => (
            <motion.a
              key={article.url || index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block p-3 bg-surface-elevated rounded-lg border border-border hover:border-bullish/50 transition-all group"
            >
              {/* Article Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${sentimentColors[article.sentiment]}`}
                  >
                    {sentimentIcons[article.sentiment]}
                    <span className="ml-1 capitalize">{article.sentiment}</span>
                  </Badge>
                  <span className="text-xs text-text-secondary truncate">
                    {article.source}
                  </span>
                </div>
                <ExternalLink size={12} className="text-text-secondary group-hover:text-bullish flex-shrink-0" />
              </div>

              {/* Article Title */}
              <h4 className="font-medium text-text-primary text-sm mb-1 line-clamp-2 group-hover:text-bullish transition-colors">
                {article.title}
              </h4>

              {/* Article Description */}
              {article.description && (
                <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                  {article.description}
                </p>
              )}

              {/* Article Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {formatRelativeDate(new Date(article.publishedAt))}
                </span>
                {article.relevanceScore && (
                  <span className="text-xs text-text-secondary">
                    {Math.round(article.relevanceScore * 100)}% relevant
                  </span>
                )}
              </div>
            </motion.a>
          ))}
        </motion.div>
      )}

      {/* Footer */}
      {articles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-secondary text-center">
            News powered by Perigon API • {articles.length} credible article{articles.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}
    </Card>
  );
}

