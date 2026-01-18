'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Brain,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { Market } from '@/types';

interface CounterArgumentsProps {
  market: Market;
  className?: string;
}

interface Argument {
  id: string;
  text: string;
  strength: 'strong' | 'moderate' | 'weak';
  category: 'data' | 'logic' | 'timing' | 'precedent';
}

interface CounterAnalysis {
  yesSide: {
    mainArguments: Argument[];
    risks: string[];
  };
  noSide: {
    mainArguments: Argument[];
    risks: string[];
  };
  devilsAdvocate: string;
  emotionalBiasWarning?: string;
}

// Generate counter arguments (this would call AI in production)
function generateCounterArguments(market: Market, position: 'yes' | 'no'): CounterAnalysis {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;
  
  const question = market.question.toLowerCase();
  
  // Generate contextual arguments based on question type
  const yesArguments: Argument[] = [];
  const noArguments: Argument[] = [];
  const yesRisks: string[] = [];
  const noRisks: string[] = [];

  // Political markets
  if (question.includes('trump') || question.includes('biden') || question.includes('election')) {
    yesArguments.push(
      { id: 'y1', text: 'Strong polling data supports this outcome', strength: 'strong', category: 'data' },
      { id: 'y2', text: 'Historical precedent from similar elections', strength: 'moderate', category: 'precedent' },
      { id: 'y3', text: 'Key endorsements and momentum shifts', strength: 'moderate', category: 'logic' }
    );
    noArguments.push(
      { id: 'n1', text: 'Polls have been wrong before (2016, 2020)', strength: 'strong', category: 'precedent' },
      { id: 'n2', text: 'Significant time remaining for events to shift', strength: 'moderate', category: 'timing' },
      { id: 'n3', text: 'Undecided voters typically break unpredictably', strength: 'moderate', category: 'data' }
    );
    yesRisks.push('Late-breaking news could shift momentum', 'Turnout models may be inaccurate');
    noRisks.push('Incumbency advantage often underestimated', 'Economic conditions favor this outcome');
  }
  // Crypto markets
  else if (question.includes('bitcoin') || question.includes('eth') || question.includes('crypto')) {
    yesArguments.push(
      { id: 'y1', text: 'Technical indicators show bullish pattern', strength: 'moderate', category: 'data' },
      { id: 'y2', text: 'Institutional adoption continues to grow', strength: 'strong', category: 'logic' },
      { id: 'y3', text: 'Historical halving cycles support this', strength: 'moderate', category: 'precedent' }
    );
    noArguments.push(
      { id: 'n1', text: 'Regulatory uncertainty remains high', strength: 'strong', category: 'logic' },
      { id: 'n2', text: 'Macro conditions could trigger selloff', strength: 'moderate', category: 'timing' },
      { id: 'n3', text: 'Past performance doesn\'t predict future', strength: 'moderate', category: 'precedent' }
    );
    yesRisks.push('Black swan events common in crypto', 'Leverage liquidations can cascade');
    noRisks.push('FOMO can drive irrational rallies', 'Supply shocks unpredictable');
  }
  // Generic markets
  else {
    yesArguments.push(
      { id: 'y1', text: 'Current trend supports this direction', strength: 'moderate', category: 'data' },
      { id: 'y2', text: 'Expert consensus aligns with YES', strength: 'moderate', category: 'logic' },
      { id: 'y3', text: 'Similar events resolved this way', strength: 'weak', category: 'precedent' }
    );
    noArguments.push(
      { id: 'n1', text: 'Unexpected variables could intervene', strength: 'moderate', category: 'timing' },
      { id: 'n2', text: 'Market may be overconfident', strength: 'moderate', category: 'logic' },
      { id: 'n3', text: 'Contrarian view has merit here', strength: 'weak', category: 'logic' }
    );
    yesRisks.push('Complexity makes prediction difficult', 'Key information may be missing');
    noRisks.push('Crowd often correct on basics', 'Time decay favors likely outcome');
  }

  // Generate devil's advocate based on position
  let devilsAdvocate = '';
  if (position === 'yes') {
    devilsAdvocate = `Before betting YES at ${(yesPrice * 100).toFixed(0)}%: Consider that you're paying a ${(yesPrice * 100).toFixed(0)} cent premium for each $1 potential payout. ` +
      `If the true probability is even 10% lower than the market price, you're making a losing bet. ` +
      `Ask yourself: What do I know that the market doesn't? If you can't answer confidently, reconsider.`;
  } else {
    devilsAdvocate = `Before betting NO at ${(noPrice * 100).toFixed(0)}%: The market has priced YES at ${(yesPrice * 100).toFixed(0)}%, suggesting collective wisdom sees it as more likely. ` +
      `Contrarian bets can be profitable but are often wrong. ` +
      `The burden of proof is on you to explain why the majority is mistaken.`;
  }

  // Add emotional bias warning for extreme prices
  let emotionalBiasWarning: string | undefined;
  if (yesPrice > 0.85 || yesPrice < 0.15) {
    emotionalBiasWarning = `⚠️ Markets at extreme prices (${(yesPrice * 100).toFixed(0)}% YES) can feel like "sure things" but still have significant upset potential. The 2016 election and sports "locks" remind us that low-probability events happen.`;
  }

  return {
    yesSide: { mainArguments: yesArguments, risks: yesRisks },
    noSide: { mainArguments: noArguments, risks: noRisks },
    devilsAdvocate,
    emotionalBiasWarning,
  };
}

export function CounterArguments({ market, className = '' }: CounterArgumentsProps) {
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CounterAnalysis | null>(null);
  const [expanded, setExpanded] = useState(false);

  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalysis(generateCounterArguments(market, selectedPosition));
    setLoading(false);
    setExpanded(true);
  }, [market, selectedPosition]);

  const strengthColors = {
    strong: 'bg-bullish/20 text-bullish border-bullish/30',
    moderate: 'bg-warning/20 text-warning border-warning/30',
    weak: 'bg-text-secondary/20 text-text-secondary border-border',
  };

  const categoryIcons = {
    data: '📊',
    logic: '🧠',
    timing: '⏰',
    precedent: '📜',
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
          <Scale size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Devil&apos;s Advocate</h3>
          <p className="text-xs text-text-secondary">Before you bet, consider the other side</p>
        </div>
      </div>

      {/* Position selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSelectedPosition('yes');
            setAnalysis(null);
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            selectedPosition === 'yes'
              ? 'bg-bullish text-white shadow-lg shadow-bullish/30'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <ThumbsUp size={16} />
          Thinking YES
        </button>
        <button
          onClick={() => {
            setSelectedPosition('no');
            setAnalysis(null);
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            selectedPosition === 'no'
              ? 'bg-bearish text-white shadow-lg shadow-bearish/30'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <ThumbsDown size={16} />
          Thinking NO
        </button>
      </div>

      {/* Generate button or Results */}
      {!analysis ? (
        <Button
          variant="primary"
          onClick={loadAnalysis}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Analyzing arguments...
            </>
          ) : (
            <>
              <Brain size={14} className="mr-2" />
              Challenge My Thinking
            </>
          )}
        </Button>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Devil's Advocate Warning */}
            <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={16} className="text-rose-500" />
                <span className="font-semibold text-rose-400">Devil&apos;s Advocate</span>
              </div>
              <p className="text-sm text-text-primary">{analysis.devilsAdvocate}</p>
            </div>

            {/* Emotional Bias Warning */}
            {analysis.emotionalBiasWarning && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
                <p className="text-sm text-warning">{analysis.emotionalBiasWarning}</p>
              </div>
            )}

            {/* Arguments for/against */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Arguments for your position */}
              <div className="bg-surface-elevated rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {selectedPosition === 'yes' ? (
                    <TrendingUp size={14} className="text-bullish" />
                  ) : (
                    <TrendingDown size={14} className="text-bearish" />
                  )}
                  <span className="text-sm font-medium text-text-primary">
                    Why {selectedPosition.toUpperCase()} might win
                  </span>
                </div>
                <div className="space-y-2">
                  {(selectedPosition === 'yes' ? analysis.yesSide : analysis.noSide).mainArguments.map((arg) => (
                    <div
                      key={arg.id}
                      className={`p-2 rounded-lg border ${strengthColors[arg.strength]}`}
                    >
                      <div className="flex items-center gap-1 text-xs mb-1">
                        <span>{categoryIcons[arg.category]}</span>
                        <span className="capitalize">{arg.strength}</span>
                      </div>
                      <p className="text-xs">{arg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arguments against your position */}
              <div className="bg-surface-elevated rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {selectedPosition === 'yes' ? (
                    <TrendingDown size={14} className="text-bearish" />
                  ) : (
                    <TrendingUp size={14} className="text-bullish" />
                  )}
                  <span className="text-sm font-medium text-text-primary">
                    Why {selectedPosition === 'yes' ? 'NO' : 'YES'} might win
                  </span>
                </div>
                <div className="space-y-2">
                  {(selectedPosition === 'yes' ? analysis.noSide : analysis.yesSide).mainArguments.map((arg) => (
                    <div
                      key={arg.id}
                      className={`p-2 rounded-lg border ${strengthColors[arg.strength]}`}
                    >
                      <div className="flex items-center gap-1 text-xs mb-1">
                        <span>{categoryIcons[arg.category]}</span>
                        <span className="capitalize">{arg.strength}</span>
                      </div>
                      <p className="text-xs">{arg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risks for your position */}
            <div className="bg-surface-elevated rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-warning" />
                <span className="text-sm font-medium text-text-primary">
                  Key Risks for {selectedPosition.toUpperCase()} Position
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedPosition === 'yes' ? analysis.yesSide : analysis.noSide).risks.map((risk, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-warning/10 text-warning">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAnalysis}
              className="w-full"
            >
              <RefreshCw size={12} className="mr-2" />
              Regenerate Analysis
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Bottom advice */}
      <p className="text-xs text-text-secondary mt-4 pt-4 border-t border-border">
        💡 The best bettors constantly challenge their assumptions. 
        If you can&apos;t articulate the counter-argument, you may not fully understand the bet.
      </p>
    </Card>
  );
}
