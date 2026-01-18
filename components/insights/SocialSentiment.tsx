'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Twitter,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  ExternalLink,
  Newspaper,
  AlertCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Market } from '@/types';

interface SocialSentimentProps {
  market: Market;
  className?: string;
}

interface SentimentData {
  overall: number; // -100 to +100
  breakdown: {
    twitter: { score: number; mentions: number; trending: boolean };
    reddit: { score: number; mentions: number; subreddits: string[] };
    news: { score: number; articles: number; sources: string[] };
  };
  topMentions: Array<{
    text: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
  }>;
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: number; // Change in last 24h
}

// Generate simulated social sentiment data
function generateSentimentData(market: Market): SentimentData {
  const question = market.question.toLowerCase();
  const yesPrice = market.outcomes[0]?.price || 0.5;
  
  // Base sentiment influenced by price
  let baseSentiment = (yesPrice - 0.5) * 100;
  
  // Add some randomness
  baseSentiment += (Math.random() - 0.5) * 40;
  
  // Category-specific adjustments
  if (question.includes('trump') || question.includes('election')) {
    // Political topics tend to be more divisive
    baseSentiment *= 0.8;
  } else if (question.includes('bitcoin') || question.includes('crypto')) {
    // Crypto tends to be more bullish on social media
    baseSentiment += 15;
  }

  const twitterScore = baseSentiment + (Math.random() - 0.5) * 30;
  const redditScore = baseSentiment + (Math.random() - 0.5) * 40;
  const newsScore = baseSentiment + (Math.random() - 0.5) * 20;

  // Generate top mentions
  const sentimentTypes: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
  const topMentions = [
    {
      text: baseSentiment > 20 
        ? `Looking very likely. The data strongly supports YES at these prices.`
        : baseSentiment < -20
        ? `Market seems overconfident. NO looks like better value here.`
        : `Still too close to call. Waiting for more clarity before betting.`,
      source: 'twitter',
      sentiment: (baseSentiment > 20 ? 'positive' : baseSentiment < -20 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
    },
    {
      text: question.includes('trump')
        ? `Polling analysis suggests the market may be mispricing this outcome.`
        : question.includes('bitcoin')
        ? `Technical indicators and on-chain data point to this being undervalued.`
        : `Interesting setup here. The risk/reward looks favorable.`,
      source: 'reddit',
      sentiment: sentimentTypes[Math.floor(Math.random() * sentimentTypes.length)],
      timestamp: new Date(Date.now() - Math.random() * 7200000),
    },
    {
      text: `New developments could shift the odds significantly in coming weeks.`,
      source: 'news',
      sentiment: 'neutral' as const,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
    },
  ];

  return {
    overall: Math.round(Math.max(-100, Math.min(100, baseSentiment))),
    breakdown: {
      twitter: {
        score: Math.round(Math.max(-100, Math.min(100, twitterScore))),
        mentions: Math.floor(100 + Math.random() * 5000),
        trending: Math.random() > 0.7,
      },
      reddit: {
        score: Math.round(Math.max(-100, Math.min(100, redditScore))),
        mentions: Math.floor(50 + Math.random() * 500),
        subreddits: ['r/predictions', 'r/polymarket', question.includes('crypto') ? 'r/cryptocurrency' : 'r/news'].slice(0, 2 + Math.floor(Math.random() * 2)),
      },
      news: {
        score: Math.round(Math.max(-100, Math.min(100, newsScore))),
        articles: Math.floor(5 + Math.random() * 50),
        sources: ['Reuters', 'Bloomberg', 'AP News', 'WSJ', 'NYT'].slice(0, 2 + Math.floor(Math.random() * 3)),
      },
    },
    topMentions,
    trend: baseSentiment > 15 ? 'bullish' : baseSentiment < -15 ? 'bearish' : 'neutral',
    momentum: Math.round((Math.random() - 0.5) * 40),
  };
}

export function SocialSentiment({ market, className = '' }: SocialSentimentProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SentimentData | null>(null);

  const loadSentiment = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setData(generateSentimentData(market));
    setLoading(false);
  }, [market]);

  const sentimentColor = (score: number) => {
    if (score > 30) return 'text-bullish';
    if (score > 10) return 'text-emerald-400';
    if (score < -30) return 'text-bearish';
    if (score < -10) return 'text-rose-400';
    return 'text-text-secondary';
  };

  const sentimentBg = (score: number) => {
    if (score > 30) return 'bg-bullish/10';
    if (score > 10) return 'bg-emerald-500/10';
    if (score < -30) return 'bg-bearish/10';
    if (score < -10) return 'bg-rose-500/10';
    return 'bg-surface-elevated';
  };

  const trendIcon = useMemo(() => {
    if (!data) return null;
    if (data.trend === 'bullish') return <TrendingUp size={16} className="text-bullish" />;
    if (data.trend === 'bearish') return <TrendingDown size={16} className="text-bearish" />;
    return <Minus size={16} className="text-text-secondary" />;
  }, [data]);

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
          <MessageCircle size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">Social Sentiment</h3>
          <p className="text-xs text-text-secondary">What people are saying online</p>
        </div>
        {data && (
          <Button variant="ghost" size="sm" onClick={loadSentiment} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
        )}
      </div>

      {/* Content */}
      {!data && !loading ? (
        <Button
          variant="primary"
          onClick={loadSentiment}
          className="w-full"
        >
          <Sparkles size={14} className="mr-2" />
          Analyze Social Sentiment
        </Button>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">Scanning social media...</p>
        </div>
      ) : data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Overall Sentiment */}
          <div className={`rounded-xl p-4 ${sentimentBg(data.overall)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Overall Sentiment</span>
              <div className="flex items-center gap-2">
                {trendIcon}
                <Badge variant="secondary" className={`${sentimentColor(data.overall)} bg-background/50`}>
                  {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold ${sentimentColor(data.overall)}`}>
                {data.overall > 0 ? '+' : ''}{data.overall}
              </span>
              <div className="flex-1">
                <div className="h-3 bg-background/50 rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/30" />
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${50 + data.overall / 2}%` }}
                    className={`h-full ${data.overall >= 0 ? 'bg-bullish' : 'bg-bearish'}`}
                    style={{ marginLeft: data.overall < 0 ? `${50 + data.overall / 2}%` : '0' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
                </div>
              </div>
            </div>

            {/* 24h Momentum */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-text-secondary">24h Change:</span>
              <span className={data.momentum > 0 ? 'text-bullish' : data.momentum < 0 ? 'text-bearish' : 'text-text-secondary'}>
                {data.momentum > 0 ? '+' : ''}{data.momentum} points
              </span>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {/* Twitter */}
            <div className="bg-surface-elevated rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Twitter size={14} className="text-sky-400" />
                <span className="text-xs font-medium text-text-primary">Twitter</span>
              </div>
              <p className={`text-xl font-bold ${sentimentColor(data.breakdown.twitter.score)}`}>
                {data.breakdown.twitter.score > 0 ? '+' : ''}{data.breakdown.twitter.score}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {data.breakdown.twitter.mentions.toLocaleString()} mentions
              </p>
              {data.breakdown.twitter.trending && (
                <Badge variant="default" className="mt-2 text-xs bg-sky-500/20 text-sky-400">
                  🔥 Trending
                </Badge>
              )}
            </div>

            {/* Reddit */}
            <div className="bg-surface-elevated rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Hash size={14} className="text-orange-500" />
                <span className="text-xs font-medium text-text-primary">Reddit</span>
              </div>
              <p className={`text-xl font-bold ${sentimentColor(data.breakdown.reddit.score)}`}>
                {data.breakdown.reddit.score > 0 ? '+' : ''}{data.breakdown.reddit.score}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {data.breakdown.reddit.mentions} posts
              </p>
              <p className="text-xs text-text-secondary truncate" title={data.breakdown.reddit.subreddits.join(', ')}>
                {data.breakdown.reddit.subreddits[0]}
              </p>
            </div>

            {/* News */}
            <div className="bg-surface-elevated rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Newspaper size={14} className="text-purple-400" />
                <span className="text-xs font-medium text-text-primary">News</span>
              </div>
              <p className={`text-xl font-bold ${sentimentColor(data.breakdown.news.score)}`}>
                {data.breakdown.news.score > 0 ? '+' : ''}{data.breakdown.news.score}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {data.breakdown.news.articles} articles
              </p>
              <p className="text-xs text-text-secondary truncate" title={data.breakdown.news.sources.join(', ')}>
                {data.breakdown.news.sources[0]}
              </p>
            </div>
          </div>

          {/* Top Mentions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Recent Mentions</p>
            {data.topMentions.map((mention, idx) => (
              <div key={idx} className="bg-surface-elevated rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {mention.source === 'twitter' && <Twitter size={12} className="text-sky-400" />}
                  {mention.source === 'reddit' && <Hash size={12} className="text-orange-500" />}
                  {mention.source === 'news' && <Newspaper size={12} className="text-purple-400" />}
                  <span className="text-xs text-text-secondary capitalize">{mention.source}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      mention.sentiment === 'positive' ? 'bg-bullish/20 text-bullish' :
                      mention.sentiment === 'negative' ? 'bg-bearish/20 text-bearish' :
                      'bg-surface text-text-secondary'
                    }`}
                  >
                    {mention.sentiment}
                  </Badge>
                </div>
                <p className="text-sm text-text-primary">&quot;{mention.text}&quot;</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-surface rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle size={12} className="text-text-secondary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                Social sentiment is simulated for demonstration. Real data would require API integrations 
                with Twitter, Reddit, and news services.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
