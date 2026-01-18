'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Newspaper,
  Users,
  Activity,
  Database,
  Star,
  Eye,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatCompactNumber } from '@/lib/formatters';
import { Market, PricePoint } from '@/types';

interface ConfidenceMeterProps {
  market: Market;
  priceHistory?: PricePoint[];
  newsCount?: number;
  verificationStatus?: 'verified' | 'partially_verified' | 'unverified';
  className?: string;
}

interface ConfidenceMetric {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  status: 'good' | 'moderate' | 'poor';
  description: string;
  icon: typeof CheckCircle2;
}

export function ConfidenceMeter({
  market,
  priceHistory = [],
  newsCount = 0,
  verificationStatus = 'unverified',
  className = '',
}: ConfidenceMeterProps) {
  const metrics = useMemo((): ConfidenceMetric[] => {
    const metricsList: ConfidenceMetric[] = [];

    // 1. News Sources
    const newsScore = Math.min(25, newsCount * 5);
    metricsList.push({
      id: 'news',
      label: 'News Sources',
      score: newsScore,
      maxScore: 25,
      status: newsScore >= 20 ? 'good' : newsScore >= 10 ? 'moderate' : 'poor',
      description: newsCount > 0 
        ? `${newsCount} news source${newsCount > 1 ? 's' : ''} verified`
        : 'No external news found',
      icon: Newspaper,
    });

    // 2. Market Activity
    const volumeScore = market.volume > 100000 ? 25 : market.volume > 10000 ? 20 : market.volume > 1000 ? 10 : 5;
    metricsList.push({
      id: 'activity',
      label: 'Market Activity',
      score: volumeScore,
      maxScore: 25,
      status: volumeScore >= 20 ? 'good' : volumeScore >= 15 ? 'moderate' : 'poor',
      description: `$${formatCompactNumber(market.volume)} trading volume`,
      icon: Activity,
    });

    // 3. Price History
    const historyScore = priceHistory.length > 50 ? 25 : priceHistory.length > 20 ? 20 : priceHistory.length > 10 ? 15 : 5;
    metricsList.push({
      id: 'history',
      label: 'Price History',
      score: historyScore,
      maxScore: 25,
      status: historyScore >= 20 ? 'good' : historyScore >= 15 ? 'moderate' : 'poor',
      description: `${priceHistory.length} data points available`,
      icon: Database,
    });

    // 4. Verification
    const verificationScore = verificationStatus === 'verified' ? 25 : verificationStatus === 'partially_verified' ? 15 : 5;
    metricsList.push({
      id: 'verification',
      label: 'Data Verified',
      score: verificationScore,
      maxScore: 25,
      status: verificationScore >= 20 ? 'good' : verificationScore >= 15 ? 'moderate' : 'poor',
      description: verificationStatus === 'verified' 
        ? 'All data sources verified'
        : verificationStatus === 'partially_verified'
        ? 'Some data verified'
        : 'Verification pending',
      icon: Shield,
    });

    return metricsList;
  }, [market, priceHistory, newsCount, verificationStatus]);

  const totalScore = metrics.reduce((sum, m) => sum + m.score, 0);
  const maxScore = metrics.reduce((sum, m) => sum + m.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const overallStatus = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'moderate' : 'poor';
  
  const statusColors = {
    excellent: 'text-bullish',
    good: 'text-bullish',
    moderate: 'text-warning',
    poor: 'text-bearish',
  };

  const statusLabels = {
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    poor: 'Limited',
  };

  const statusDescriptions = {
    excellent: 'High-quality information available. You can make a well-informed decision.',
    good: 'Good information quality. Most key factors are verifiable.',
    moderate: 'Some information gaps. Consider waiting for more data.',
    poor: 'Limited information. High uncertainty - bet with caution.',
  };

  const metricStatusColors = {
    good: 'text-bullish bg-bullish/10',
    moderate: 'text-warning bg-warning/10',
    poor: 'text-bearish bg-bearish/10',
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Eye size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Information Quality</h3>
          <p className="text-xs text-text-secondary">How reliable is the available data?</p>
        </div>
      </div>

      {/* Main Score */}
      <div className="bg-surface-elevated rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`text-4xl font-bold ${statusColors[overallStatus]}`}>
              {percentage}%
            </span>
            <Badge 
              variant="secondary" 
              className={`ml-2 ${statusColors[overallStatus]} ${
                overallStatus === 'excellent' || overallStatus === 'good' 
                  ? 'bg-bullish/10' 
                  : overallStatus === 'moderate' 
                  ? 'bg-warning/10' 
                  : 'bg-bearish/10'
              }`}
            >
              {statusLabels[overallStatus]}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">Score</p>
            <p className="text-sm font-bold text-text-primary">{totalScore}/{maxScore}</p>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="h-4 bg-background rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${
              overallStatus === 'excellent' || overallStatus === 'good'
                ? 'bg-gradient-to-r from-bullish to-emerald-400'
                : overallStatus === 'moderate'
                ? 'bg-gradient-to-r from-warning to-amber-400'
                : 'bg-gradient-to-r from-bearish to-rose-400'
            }`}
          />
          {/* Markers */}
          <div className="absolute top-0 left-1/4 h-full w-px bg-white/20" />
          <div className="absolute top-0 left-1/2 h-full w-px bg-white/20" />
          <div className="absolute top-0 left-3/4 h-full w-px bg-white/20" />
        </div>
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          <span>Poor</span>
          <span>Moderate</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>

        <p className="text-sm text-text-secondary mt-3">
          {statusDescriptions[overallStatus]}
        </p>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const fillPercentage = (metric.score / metric.maxScore) * 100;
          
          return (
            <div key={metric.id} className="bg-surface-elevated rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${metricStatusColors[metric.status]}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {metric.status === 'good' && <CheckCircle2 size={14} className="text-bullish" />}
                  {metric.status === 'moderate' && <AlertCircle size={14} className="text-warning" />}
                  {metric.status === 'poor' && <XCircle size={14} className="text-bearish" />}
                  <span className="text-xs text-text-secondary">
                    {metric.score}/{metric.maxScore}
                  </span>
                </div>
              </div>
              
              <div className="h-1.5 bg-background rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercentage}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`h-full ${
                    metric.status === 'good' ? 'bg-bullish' :
                    metric.status === 'moderate' ? 'bg-warning' : 'bg-bearish'
                  }`}
                />
              </div>
              
              <p className="text-xs text-text-secondary">{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-3 bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Star size={12} className="text-warning" />
          <span className="text-xs font-medium text-text-primary">Recommendation</span>
        </div>
        <p className="text-xs text-text-secondary">
          {overallStatus === 'excellent' || overallStatus === 'good'
            ? 'You have enough quality information to make an informed decision. Trust the data but stay updated on new developments.'
            : overallStatus === 'moderate'
            ? 'Consider waiting for more information before betting large amounts. Look for additional news sources and market activity.'
            : 'Information is limited. If you choose to bet, keep positions small and be prepared for unexpected outcomes.'}
        </p>
      </div>
    </Card>
  );
}
