'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GeminiBrief as GeminiBriefType, GeminiError, Market } from '@/types';
import { Button, Card, Badge, BriefSkeleton } from '@/components/ui';

interface GeminiBriefProps {
  brief: GeminiBriefType | null;
  error: GeminiError | null;
  loading?: boolean;
  market: Market;
  onGenerate: () => void;
  onRetry?: () => void;
}

export function GeminiBrief({
  brief,
  error,
  loading,
  market,
  onGenerate,
  onRetry,
}: GeminiBriefProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    checklist: false,
    variables: false,
    cases: false,
    debate: false,
    sources: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={20} className="text-bullish" />
          </motion.div>
          <span className="text-text-primary font-medium">Generating AI Brief...</span>
        </div>
        <BriefSkeleton />
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="text-center">
        <AlertCircle size={32} className="mx-auto text-bearish mb-3" />
        <h3 className="text-text-primary font-medium mb-2">Generation Failed</h3>
        <p className="text-sm text-text-secondary mb-4">{error.message}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        )}
      </Card>
    );
  }

  if (!brief) {
    return (
      <Card padding="lg" className="text-center">
        <Sparkles size={32} className="mx-auto text-text-secondary mb-3" />
        <h3 className="text-text-primary font-medium mb-2">AI Market Brief</h3>
        <p className="text-sm text-text-secondary mb-4">
          Generate an evidence-backed analysis powered by Gemini AI.
        </p>
        <Button variant="primary" onClick={onGenerate}>
          <Sparkles size={14} className="mr-2" />
          Generate Brief
        </Button>
      </Card>
    );
  }

  const impactIcons = {
    bullish: <TrendingUp size={12} className="text-success" />,
    bearish: <TrendingDown size={12} className="text-bearish" />,
    neutral: <Minus size={12} className="text-text-secondary" />,
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-300px)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 overflow-y-auto pr-2 flex-1"
        style={{ scrollbarWidth: 'thin' }}
      >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-bullish" />
          <h3 className="text-lg font-semibold text-text-primary">AI Brief</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="bullish">
            {brief.confidence}% confidence
          </Badge>
          <Button variant="ghost" size="sm" onClick={onGenerate}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Resolution Checklist */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('checklist')}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <h4 className="text-sm font-medium text-text-primary">Resolution Checklist</h4>
            <Badge variant="secondary" size="sm" className="ml-1 text-xs">
              {brief.resolutionChecklist.length}
            </Badge>
          </div>
          {expandedSections.checklist ? (
            <ChevronUp size={16} className="text-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-text-secondary" />
          )}
        </button>
        {expandedSections.checklist && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {brief.resolutionChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bullish mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </Card>

      {/* Key Variables */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('variables')}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-bullish" />
            <h4 className="text-sm font-medium text-text-primary">Key Variables</h4>
            <Badge variant="secondary" size="sm" className="ml-1 text-xs">
              {brief.keyVariables.length}
            </Badge>
          </div>
          {expandedSections.variables ? (
            <ChevronUp size={16} className="text-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-text-secondary" />
          )}
        </button>
        {expandedSections.variables && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {brief.keyVariables.map((variable, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-background rounded-lg p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{variable.name}</p>
                  <p className="text-xs text-text-secondary line-clamp-2">{variable.currentState}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {impactIcons[variable.directionOfImpact]}
                  <Badge
                    variant={
                      variable.importance === 'high'
                        ? 'error'
                        : variable.importance === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {variable.importance}
                  </Badge>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </Card>

      {/* Cases */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('cases')}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <h4 className="text-sm font-medium text-text-primary">Scenario Analysis</h4>
          {expandedSections.cases ? (
            <ChevronUp size={16} className="text-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-text-secondary" />
          )}
        </button>
        {expandedSections.cases && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1 font-medium">Base Case</p>
              <p className="text-sm text-text-primary line-clamp-4">{brief.baseCase}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-success/5 border border-success/20 rounded-lg p-2.5">
                <p className="text-xs text-success uppercase mb-1.5 font-medium">Bull Case</p>
                <p className="text-xs text-text-secondary line-clamp-4">{brief.bullCase}</p>
              </div>
              <div className="bg-bearish/5 border border-bearish/20 rounded-lg p-2.5">
                <p className="text-xs text-bearish uppercase mb-1.5 font-medium">Bear Case</p>
                <p className="text-xs text-text-secondary line-clamp-4">{brief.bearCase}</p>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* What Would Change My Mind */}
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle size={16} className="text-warning" />
          <h4 className="text-sm font-medium text-text-primary">What Would Change My Mind</h4>
        </div>
        <ul className="space-y-1.5">
          {brief.whatWouldChangeMyMind.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="text-warning mt-0.5">→</span>
              <span>{item}</span>
            </li>
          ))}
          {brief.whatWouldChangeMyMind.length > 3 && (
            <li className="text-xs text-text-secondary italic">
              +{brief.whatWouldChangeMyMind.length - 3} more factors...
            </li>
          )}
        </ul>
      </Card>

      {/* Debate Prompts */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('debate')}
          className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text-primary">Debate Prompts</h4>
            <Badge variant="secondary" size="sm" className="ml-1 text-xs">
              {brief.debatePrompts.length}
            </Badge>
          </div>
          {expandedSections.debate ? (
            <ChevronUp size={16} className="text-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-text-secondary" />
          )}
        </button>
        {expandedSections.debate && (
          <motion.ol
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {brief.debatePrompts.map((prompt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bullish font-mono flex-shrink-0">{i + 1}.</span>
                <span className="flex-1">{prompt}</span>
              </li>
            ))}
          </motion.ol>
        )}
      </Card>

      {/* Sources to Consult */}
      {brief.sourcesToConsult.length > 0 && (
        <Card padding="sm">
          <button
            onClick={() => toggleSection('sources')}
            className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity mb-2"
          >
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-text-primary">Suggested Sources</h4>
              <Badge variant="secondary" size="sm" className="ml-1 text-xs">
                {brief.sourcesToConsult.length}
              </Badge>
            </div>
            {expandedSections.sources ? (
              <ChevronUp size={16} className="text-text-secondary" />
            ) : (
              <ChevronDown size={16} className="text-text-secondary" />
            )}
          </button>
          {expandedSections.sources && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {brief.sourcesToConsult.map((source, i) => (
                <div key={i} className="flex items-center justify-between bg-background rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary line-clamp-1">{source.description}</p>
                    <p className="text-xs text-text-secondary">Type: {source.type}</p>
                  </div>
                  {source.searchQuery && (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(source.searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bullish hover:text-bullish-hover flex-shrink-0 ml-2"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </Card>
      )}

      {/* Confidence justification */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-text-secondary italic line-clamp-3">
          <span className="font-medium">Confidence:</span> {brief.confidenceJustification}
        </p>
      </div>
      </motion.div>
    </div>
  );
}
