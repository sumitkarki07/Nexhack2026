'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Search,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  BookOpen,
  Shield,
  RefreshCw,
  HelpCircle,
  Clock,
  Target,
  Newspaper,
  ArrowUpRight,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Market } from '@/types';
import { Button, Badge } from '@/components/ui';
import { formatPrice, formatCompactNumber, formatRelativeDate } from '@/lib/formatters';
import { useSavedResearch } from '@/hooks';
import { getPolymarketUrl } from '@/lib/polymarket';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
}

type ResearchStep = 'idle' | 'gathering' | 'analyzing' | 'verifying' | 'complete' | 'error';

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

type VerificationStatus = 'verified' | 'partially_verified' | 'unverified' | 'pending';

interface VerificationCheck {
  id: string;
  name: string;
  description: string;
  status: VerificationStatus;
  confidence: number;
  source: string;
  timestamp: number;
  details?: string;
}

interface VerificationResult {
  overallStatus: VerificationStatus;
  overallConfidence: number;
  checks: VerificationCheck[];
  verifiedAt: number;
  sedaRequestId?: string;
  summary: string;
}

interface ResearchResult {
  summary: string;
  whatIsThisBet: string;
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskExplanation: string;
  confidence: number;
  confidenceExplanation: string;
  sources: { name: string; type: string; url?: string }[];
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  keyDates: string[];
  marketSentiment: string;
  recommendation: string;
  beginnerExplanation: string;
  newsArticles?: NewsArticle[];
  newsSummary?: string;
}

interface MarketData {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  slug: string;
}

export function ResearchModal({ isOpen, onClose, market }: ResearchModalProps) {
  const [step, setStep] = useState<ResearchStep>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBeginnerMode, setShowBeginnerMode] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  
  // Saved research hook
  const { saveResearch, isMarketSaved, removeResearch, getByMarketId } = useSavedResearch();
  const isSaved = market ? isMarketSaved(market.id) : false;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('idle');
      setProgress(0);
      setResult(null);
      setMarketData(null);
      setVerification(null);
      setError(null);
      setShowVerificationDetails(false);
    }
  }, [isOpen]);

  // Start research when modal opens
  const startResearch = useCallback(async () => {
    if (!market) {
      console.error('[ResearchModal] No market provided');
      setError('No market selected for research');
      setStep('error');
      return;
    }

    // Validate market has required fields
    if (!market.id || !market.question) {
      console.error('[ResearchModal] Invalid market data:', market);
      setError('Invalid market data. Missing required fields.');
      setStep('error');
      return;
    }

    setStep('gathering');
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      // Simulate progress while API call is in progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 15;
          const newProgress = Math.min(prev + increment, 90);
          
          // Update step based on progress
          if (newProgress >= 60) setStep('verifying');
          else if (newProgress >= 30) setStep('analyzing');
          
          return newProgress;
        });
      }, 500);

      // Prepare market data for API
      const marketPayload = {
        id: market.id,
        question: market.question,
        category: market.category || 'other',
        outcomes: (market.outcomes || []).map(o => ({
          id: o.id,
          name: o.name,
          price: o.price,
          priceChange24h: o.priceChange24h || 0,
        })),
        volume: market.volume || 0,
        liquidity: market.liquidity || 0,
        endDate: market.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        slug: market.slug || '',
        description: market.description || '',
        active: market.active !== undefined ? market.active : true,
        closed: market.closed !== undefined ? market.closed : false,
        resolved: market.resolved !== undefined ? market.resolved : false,
      };

      console.log('[ResearchModal] Sending request with market:', marketPayload);

      // Make API call - pass market data to avoid refetching
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          market: marketPayload,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ResearchModal] API error:', response.status, errorData);
        throw new Error(errorData.message || errorData.error || `Failed to generate research (${response.status})`);
      }

      const data = await response.json();
      console.log('[ResearchModal] API response:', data);

      if (!data.success) {
        console.error('[ResearchModal] Research generation failed:', data);
        throw new Error(data.message || data.error || 'Research generation failed');
      }

      if (data.success) {
        setProgress(100);
        setStep('complete');
        setResult(data.research);
        setMarketData(data.market);
        if (data.verification) {
          setVerification(data.verification);
        }
      } else {
        throw new Error(data.error || 'Research generation failed');
      }
    } catch (err) {
      console.error('[ResearchModal] Error:', err);
      setStep('error');
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Log more details for debugging
      if (err instanceof Error && err.stack) {
        console.error('[ResearchModal] Error stack:', err.stack);
      }
    }
  }, [market]);

  // Auto-start research when modal opens
  useEffect(() => {
    if (isOpen && market && step === 'idle') {
      startResearch();
    }
  }, [isOpen, market, step, startResearch]);

  // Handle save/unsave
  const handleSaveToggle = useCallback(() => {
    if (!market || !result || !verification) return;
    
    if (isSaved) {
      const saved = getByMarketId(market.id);
      if (saved) {
        removeResearch(saved.id);
      }
    } else {
      saveResearch({
        marketId: market.id,
        marketQuestion: market.question,
        marketCategory: market.category,
        yesPrice: marketData?.yesPrice || market.outcomes[0]?.price || 0.5,
        noPrice: marketData?.noPrice || market.outcomes[1]?.price || 0.5,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        summary: result.summary,
        recommendation: result.recommendation,
        verificationStatus: verification.overallStatus,
      });
    }
  }, [market, marketData, result, verification, isSaved, saveResearch, removeResearch, getByMarketId]);

  if (!market) return null;

  const yesPrice = marketData?.yesPrice || market.outcomes[0]?.price || 0.5;
  const noPrice = marketData?.noPrice || market.outcomes[1]?.price || 0.5;
  const volume = marketData?.volume || market.volume || 0;
  const endDate = marketData?.endDate || market.endDate;

  const stepLabels: Record<ResearchStep, { label: string; icon: React.ReactNode }> = {
    idle: { label: 'Starting...', icon: <Loader2 className="animate-spin" size={16} /> },
    gathering: { label: 'Gathering market data from Polymarket...', icon: <Search className="animate-pulse" size={16} /> },
    analyzing: { label: 'Analyzing with AI...', icon: <Sparkles className="animate-pulse" size={16} /> },
    verifying: { label: 'Verifying and synthesizing...', icon: <Shield className="animate-pulse" size={16} /> },
    complete: { label: 'Research complete!', icon: <CheckCircle2 size={16} className="text-success" /> },
    error: { label: 'Research failed', icon: <AlertTriangle size={16} className="text-bearish" /> },
  };

  const riskColors = {
    low: 'text-success bg-success/10 border-success/20',
    medium: 'text-warning bg-warning/10 border-warning/20',
    high: 'text-bearish bg-bearish/10 border-bearish/20',
  };

  const riskLabels = {
    low: 'Lower Risk',
    medium: 'Medium Risk',
    high: 'Higher Risk',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-border bg-gradient-to-r from-bullish/5 to-transparent">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-bullish/10 rounded-lg">
                    <Sparkles size={20} className="text-bullish" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Smart Research</h2>
                    <p className="text-xs text-text-secondary">AI-powered market analysis</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mt-2">{market.question}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-border rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Progress Section */}
              {step !== 'complete' && step !== 'error' && (
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {stepLabels[step].icon}
                    <span className="text-sm font-medium text-text-primary">
                      {stepLabels[step].label}
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-bullish to-bullish-hover"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-text-secondary">
                    <span className={step === 'gathering' ? 'text-bullish' : ''}>Gather</span>
                    <span className={step === 'analyzing' ? 'text-bullish' : ''}>Analyze</span>
                    <span className={step === 'verifying' ? 'text-bullish' : ''}>Verify</span>
                    <span className={step === 'complete' ? 'text-bullish' : ''}>Done</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {step === 'error' && (
                <div className="bg-bearish/10 border border-bearish/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-bearish flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-1">Research Failed</h3>
                      <p className="text-sm text-text-secondary mb-3">{error}</p>
                      <Button variant="secondary" size="sm" onClick={startResearch}>
                        <RefreshCw size={14} className="mr-1" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seda Verification Status */}
              {verification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 border ${
                    verification.overallStatus === 'verified'
                      ? 'bg-success/5 border-success/20'
                      : verification.overallStatus === 'partially_verified'
                      ? 'bg-warning/5 border-warning/20'
                      : 'bg-bearish/5 border-bearish/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        verification.overallStatus === 'verified'
                          ? 'bg-success/10'
                          : verification.overallStatus === 'partially_verified'
                          ? 'bg-warning/10'
                          : 'bg-bearish/10'
                      }`}>
                        {verification.overallStatus === 'verified' ? (
                          <CheckCircle2 size={20} className="text-success" />
                        ) : verification.overallStatus === 'partially_verified' ? (
                          <Shield size={20} className="text-warning" />
                        ) : (
                          <AlertTriangle size={20} className="text-bearish" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-primary">
                            Seda Verification
                          </h3>
                          <Badge
                            size="sm"
                            className={
                              verification.overallStatus === 'verified'
                                ? 'bg-success/10 text-success border border-success/20'
                                : verification.overallStatus === 'partially_verified'
                                ? 'bg-warning/10 text-warning border border-warning/20'
                                : 'bg-bearish/10 text-bearish border border-bearish/20'
                            }
                          >
                            {verification.overallStatus === 'verified'
                              ? 'Verified'
                              : verification.overallStatus === 'partially_verified'
                              ? 'Partially Verified'
                              : 'Unverified'}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {verification.checks.filter(c => c.status === 'verified').length} of {verification.checks.length} checks passed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-text-primary">{verification.overallConfidence}%</p>
                        <p className="text-xs text-text-secondary">confidence</p>
                      </div>
                      <button
                        onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-border rounded-lg transition-colors"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${showVerificationDetails ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Verification Details */}
                  <AnimatePresence>
                    {showVerificationDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <p className="text-sm text-text-secondary mb-3">{verification.summary}</p>
                        <div className="space-y-2">
                          {verification.checks.map((check) => (
                            <div
                              key={check.id}
                              className="flex items-center justify-between bg-background rounded-lg p-2.5"
                            >
                              <div className="flex items-center gap-2">
                                {check.status === 'verified' ? (
                                  <CheckCircle2 size={14} className="text-success" />
                                ) : check.status === 'partially_verified' ? (
                                  <Shield size={14} className="text-warning" />
                                ) : (
                                  <AlertTriangle size={14} className="text-bearish" />
                                )}
                                <div>
                                  <p className="text-xs font-medium text-text-primary">{check.name}</p>
                                  {check.details && (
                                    <p className="text-xs text-text-secondary">{check.details}</p>
                                  )}
                                </div>
                              </div>
                              <Badge
                                size="sm"
                                className={`text-xs ${
                                  check.status === 'verified'
                                    ? 'bg-success/10 text-success'
                                    : check.status === 'partially_verified'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-bearish/10 text-bearish'
                                }`}
                              >
                                {check.confidence}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {verification.sedaRequestId && (
                          <p className="text-xs text-text-secondary mt-3 text-center">
                            Request ID: {verification.sedaRequestId}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Market Overview - Always show */}
              <div className="bg-background rounded-xl p-4">
                <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <DollarSign size={16} />
                  Market Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-secondary mb-1">YES Price</p>
                    <p className="text-xl font-bold text-bullish">{formatPrice(yesPrice)}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-secondary mb-1">NO Price</p>
                    <p className="text-xl font-bold text-bearish">{formatPrice(noPrice)}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-secondary mb-1">Volume</p>
                    <p className="text-lg font-bold text-text-primary">${formatCompactNumber(volume)}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3 border border-border">
                    <p className="text-xs text-text-secondary mb-1">Ends</p>
                    <p className="text-sm font-bold text-text-primary">{formatRelativeDate(endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Research Results */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Beginner Mode Toggle */}
                  <div className="flex items-center justify-between bg-background rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle size={16} className="text-bullish" />
                      <span className="text-sm font-medium text-text-primary">Beginner Mode</span>
                    </div>
                    <button
                      onClick={() => setShowBeginnerMode(!showBeginnerMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        showBeginnerMode ? 'bg-bullish' : 'bg-border'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          showBeginnerMode ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Beginner Explanation */}
                  {showBeginnerMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-bullish/10 border border-bullish/20 rounded-xl p-4"
                    >
                      <h3 className="text-sm font-medium text-bullish mb-2 flex items-center gap-2">
                        <HelpCircle size={16} />
                        Simple Explanation
                      </h3>
                      <p className="text-sm text-text-secondary">{result.beginnerExplanation}</p>
                      <p className="text-sm text-text-secondary mt-2">{result.whatIsThisBet}</p>
                    </motion.div>
                  )}

                  {/* Summary */}
                  <div className="bg-background rounded-xl p-4">
                    <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                      <BookOpen size={16} />
                      Summary
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Risk & Confidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Risk Assessment
                      </h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${riskColors[result.riskLevel]}`}>
                        <Target size={14} />
                        <span className="font-medium">{riskLabels[result.riskLevel]}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">{result.riskExplanation}</p>
                    </div>
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <Shield size={16} />
                        Analysis Confidence
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-bullish to-bullish-hover"
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-lg font-bold text-text-primary">{result.confidence}%</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">{result.confidenceExplanation}</p>
                    </div>
                  </div>

                  {/* Market Sentiment */}
                  <div className="bg-background rounded-xl p-4">
                    <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Users size={16} />
                      Market Sentiment
                    </h3>
                    <p className="text-sm text-text-secondary">{result.marketSentiment}</p>
                  </div>

                  {/* Key Points */}
                  <div className="bg-background rounded-xl p-4">
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-bullish mt-0.5 font-bold">{i + 1}.</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Dates */}
                  {result.keyDates.length > 0 && (
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Key Dates
                      </h3>
                      <ul className="space-y-2">
                        {result.keyDates.map((date, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <Clock size={14} className="text-warning mt-0.5 flex-shrink-0" />
                            {date}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related News */}
                  {result.newsArticles && result.newsArticles.length > 0 && (
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        <Newspaper size={16} />
                        Related News & Analysis
                      </h3>
                      <div className="space-y-3">
                        {result.newsArticles.map((article, i) => {
                          const sentimentColors = {
                            positive: 'border-l-success',
                            negative: 'border-l-bearish',
                            neutral: 'border-l-border',
                          };
                          return (
                            <div
                              key={i}
                              className={`bg-surface rounded-lg p-3 border border-border border-l-2 ${sentimentColors[article.sentiment]}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
                                    {article.title}
                                  </h4>
                                  {article.description && (
                                    <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                                      {article.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                                    <span className="font-medium">{article.source}</span>
                                    <span>•</span>
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                    <Badge
                                      size="sm"
                                      className={`text-xs ${
                                        article.sentiment === 'positive'
                                          ? 'bg-success/10 text-success'
                                          : article.sentiment === 'negative'
                                          ? 'bg-bearish/10 text-bearish'
                                          : 'bg-border text-text-secondary'
                                      }`}
                                    >
                                      {article.sentiment}
                                    </Badge>
                                  </div>
                                </div>
                                {article.url && article.url !== '#' && (
                                  <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-text-secondary hover:text-bullish hover:bg-bullish/10 rounded-lg transition-colors flex-shrink-0"
                                    title="Read article"
                                  >
                                    <ArrowUpRight size={16} />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {result.newsSummary && (
                        <p className="text-xs text-text-secondary mt-3 text-center">
                          {result.newsSummary}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Reasons to Consider
                      </h3>
                      <ul className="space-y-2">
                        {result.prosAndCons.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="text-success font-bold">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-background rounded-xl p-4">
                      <h3 className="text-sm font-medium text-bearish mb-3 flex items-center gap-2">
                        <TrendingDown size={16} />
                        Risks to Consider
                      </h3>
                      <ul className="space-y-2">
                        {result.prosAndCons.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="text-bearish font-bold">−</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-gradient-to-r from-bullish/10 via-bullish/5 to-transparent border border-bullish/20 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-bullish mb-2 flex items-center gap-2">
                      <Sparkles size={16} />
                      Research Summary
                    </h3>
                    <p className="text-sm text-text-secondary">{result.recommendation}</p>
                  </div>

                  {/* Sources */}
                  <div className="bg-background rounded-xl p-4">
                    <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                      <Shield size={16} />
                      Data Sources
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((source, i) => (
                        <Badge key={i} variant="default" size="sm" className="flex items-center gap-1">
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-bullish"
                            >
                              {source.name}
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            source.name
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary">
                  ⚠️ Not financial advice. Always do your own research.
                </p>
                <div className="flex gap-2">
                  {/* Save/Bookmark Button */}
                  {result && verification && (
                    <Button
                      variant={isSaved ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={handleSaveToggle}
                      className={isSaved ? 'bg-warning hover:bg-warning/90' : ''}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck size={14} className="mr-1" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} className="mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  {marketData && (
                    <a
                      href={getPolymarketUrl(marketData)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary" size="sm">
                        <ExternalLink size={14} className="mr-1" />
                        Polymarket
                      </Button>
                    </a>
                  )}
                  <Button variant="primary" size="sm" onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
