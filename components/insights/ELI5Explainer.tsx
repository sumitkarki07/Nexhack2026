'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Lightbulb,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatPrice } from '@/lib/formatters';
import { Market } from '@/types';

interface ELI5ExplainerProps {
  market: Market;
  className?: string;
}

interface Explanation {
  id: string;
  question: string;
  simpleAnswer: string;
  analogy?: string;
  icon: typeof HelpCircle;
}

export function ELI5Explainer({ market, className = '' }: ELI5ExplainerProps) {
  const [expandedId, setExpandedId] = useState<string | null>('what-is-this');

  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;

  const explanations: Explanation[] = [
    {
      id: 'what-is-this',
      question: 'What is this bet about?',
      simpleAnswer: `This is a YES or NO question: "${market.question}"\n\nPeople are betting real money on whether this will happen or not. If you think YES, you buy YES shares. If you think NO, you buy NO shares.`,
      analogy: '🎰 Think of it like betting on a sports game, but instead of teams, you\'re betting on whether something in the real world will happen.',
      icon: HelpCircle,
    },
    {
      id: 'what-price-means',
      question: 'What do the prices mean?',
      simpleAnswer: `YES is at ${formatPrice(yesPrice)} (${(yesPrice * 100).toFixed(0)}¢)\nNO is at ${formatPrice(noPrice)} (${(noPrice * 100).toFixed(0)}¢)\n\nThis means the crowd thinks there's about a ${(yesPrice * 100).toFixed(0)}% chance this happens.`,
      analogy: `💡 If YES costs ${(yesPrice * 100).toFixed(0)}¢, the market is saying "we think there's a ${(yesPrice * 100).toFixed(0)}% chance this happens." The cheaper the price, the less likely people think it is.`,
      icon: DollarSign,
    },
    {
      id: 'how-win',
      question: 'How do I win money?',
      simpleAnswer: `If you're RIGHT:\n• Each share you bought pays out $1.00\n• You keep the difference as profit\n\nIf you're WRONG:\n• Your shares become worthless\n• You lose what you paid\n\nExample: Buy YES at ${(yesPrice * 100).toFixed(0)}¢, if you win you get $1.00 back. That's ${((1 - yesPrice) * 100).toFixed(0)}¢ profit per share!`,
      analogy: '🎯 It\'s like buying a lottery ticket that pays $1 if you win. The ticket price changes based on how likely people think you are to win.',
      icon: Target,
    },
    {
      id: 'yes-vs-no',
      question: 'Should I bet YES or NO?',
      simpleAnswer: `Bet YES if:\n• You think the event WILL happen\n• You think it's MORE likely than ${(yesPrice * 100).toFixed(0)}%\n\nBet NO if:\n• You think the event WON'T happen\n• You think YES is overpriced\n\nThe key is: Do you know something the crowd doesn't?`,
      analogy: '🤔 If everyone thinks a movie will be great, tickets are expensive. But if YOU know it\'s actually bad, you might bet against it.',
      icon: TrendingUp,
    },
    {
      id: 'when-resolved',
      question: 'When do I get paid?',
      simpleAnswer: `The market "resolves" when we know the real answer:\n• If you bet correctly: You get $1 per share\n• If you bet wrong: You get $0\n\nYou can also sell your shares BEFORE resolution if you change your mind or want to take profits early.`,
      analogy: '⏰ Like a sports bet - you don\'t know if you won until the game ends. But unlike sports, you can sell your bet to someone else before the game finishes.',
      icon: Clock,
    },
    {
      id: 'risks',
      question: 'What are the risks?',
      simpleAnswer: `Main risks:\n\n1. ❌ You could lose EVERYTHING you bet\n2. 🎲 Unexpected events can flip outcomes\n3. ⚠️ Even "sure things" sometimes fail\n4. 💸 The market can be wrong\n\nNEVER bet more than you can afford to lose!`,
      analogy: '⚡ Remember: In 2016, prediction markets said Hillary Clinton had an 85% chance of winning. The unlikely 15% happened. Nothing is guaranteed.',
      icon: AlertTriangle,
    },
  ];

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
          <Lightbulb size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Explain Like I&apos;m 5</h3>
          <p className="text-xs text-text-secondary">Simple explanations for beginners</p>
        </div>
        <Badge variant="secondary" className="ml-auto bg-emerald-500/10 text-emerald-400">
          <BookOpen size={10} className="mr-1" />
          Beginner
        </Badge>
      </div>

      {/* Quick Summary */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">In Plain English</span>
        </div>
        <p className="text-sm text-text-primary mb-3">
          People are betting on: <strong>&quot;{market.question}&quot;</strong>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <TrendingUp size={16} className="text-bullish mx-auto mb-1" />
            <p className="text-xs text-text-secondary">Crowd says</p>
            <p className="text-lg font-bold text-bullish">{(yesPrice * 100).toFixed(0)}% YES</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <DollarSign size={16} className="text-warning mx-auto mb-1" />
            <p className="text-xs text-text-secondary">Win $1 for</p>
            <p className="text-lg font-bold text-warning">{(yesPrice * 100).toFixed(0)}¢</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-2">
        {explanations.map((exp) => {
          const Icon = exp.icon;
          const isExpanded = expandedId === exp.id;

          return (
            <div
              key={exp.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                className="w-full flex items-center gap-3 p-3 bg-surface-elevated hover:bg-surface transition-colors"
              >
                <Icon size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-text-primary text-left flex-1">
                  {exp.question}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={14} className="text-text-secondary" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 bg-surface-elevated border-t border-border">
                      <p className="text-sm text-text-secondary whitespace-pre-line mb-3">
                        {exp.simpleAnswer}
                      </p>
                      {exp.analogy && (
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-text-secondary">
                            {exp.analogy}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom tip */}
      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <p className="text-xs text-emerald-400">
          💡 <strong>Pro tip:</strong> Start with small bets to learn how it works. 
          Prediction markets are fun, but they&apos;re also real money. 
          Only bet what you&apos;re okay losing!
        </p>
      </div>
    </Card>
  );
}
