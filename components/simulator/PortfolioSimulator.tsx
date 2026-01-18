'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, Button, Badge, Slider } from '@/components/ui';
import { formatPrice } from '@/lib/formatters';
import { Market } from '@/types';

interface PortfolioSimulatorProps {
  market: Market;
  className?: string;
}

interface SimulationResult {
  betAmount: number;
  position: 'yes' | 'no';
  currentPrice: number;
  potentialProfit: number;
  potentialLoss: number;
  breakEvenPrice: number;
  expectedValue: number;
  roi: number;
  impliedProbability: number;
  sharesReceived: number;
  maxPayout: number;
}

export function PortfolioSimulator({ market, className = '' }: PortfolioSimulatorProps) {
  const [betAmount, setBetAmount] = useState(100);
  const [position, setPosition] = useState<'yes' | 'no'>('yes');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;

  const simulation = useMemo((): SimulationResult => {
    // Ensure betAmount is a valid number
    const numericBetAmount = Math.max(1, Math.min(10000, Number(betAmount) || 100));
    const currentPrice = position === 'yes' ? yesPrice : noPrice;
    const oppositePrice = position === 'yes' ? noPrice : yesPrice;

    // Ensure prices are valid numbers
    const validCurrentPrice = Math.max(0.01, Math.min(0.99, Number(currentPrice) || 0.5));
    const validOppositePrice = Math.max(0.01, Math.min(0.99, Number(oppositePrice) || 0.5));

    // Shares received = bet amount / current price
    const sharesReceived = numericBetAmount / validCurrentPrice;

    // Max payout if market resolves in your favor = shares * $1
    const maxPayout = sharesReceived;

    // Potential profit = max payout - bet amount
    const potentialProfit = maxPayout - numericBetAmount;

    // Potential loss = entire bet amount
    const potentialLoss = numericBetAmount;

    // Validate all calculations are finite numbers
    const safeProfit = isFinite(potentialProfit) ? potentialProfit : 0;
    const safeLoss = isFinite(potentialLoss) ? potentialLoss : 0;
    const safeShares = isFinite(sharesReceived) ? sharesReceived : 0;
    const safePayout = isFinite(maxPayout) ? maxPayout : 0;

    // Break even price = what you paid per share
    const breakEvenPrice = validCurrentPrice;

    // Implied probability = current price (in prediction markets)
    const impliedProbability = validCurrentPrice * 100;

    // Expected value = (probability * profit) - ((1 - probability) * loss)
    const expectedValue = (validCurrentPrice * safeProfit) - ((1 - validCurrentPrice) * safeLoss);
    const safeExpectedValue = isFinite(expectedValue) ? expectedValue : 0;

    // ROI if you win
    const roi = numericBetAmount > 0 ? (safeProfit / numericBetAmount) * 100 : 0;
    const safeRoi = isFinite(roi) ? roi : 0;
    const safeImplied = isFinite(impliedProbability) ? impliedProbability : 0;

    return {
      betAmount: numericBetAmount,
      position,
      currentPrice: validCurrentPrice,
      potentialProfit: Number(safeProfit.toFixed(2)),
      potentialLoss: Number(safeLoss.toFixed(2)),
      breakEvenPrice: Number(breakEvenPrice.toFixed(4)),
      expectedValue: Number(safeExpectedValue.toFixed(2)),
      roi: Number(safeRoi.toFixed(2)),
      impliedProbability: Number(safeImplied.toFixed(1)),
      sharesReceived: Number(safeShares.toFixed(4)),
      maxPayout: Number(safePayout.toFixed(2)),
    };
  }, [betAmount, position, yesPrice, noPrice]);

  const presetAmounts = [10, 50, 100, 250, 500, 1000];

  return (
    <Card padding="md" className={`${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Calculator size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Portfolio Simulator</h3>
          <p className="text-xs text-text-secondary">See potential outcomes before betting</p>
        </div>
      </div>

      {/* Position Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPosition('yes')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            position === 'yes'
              ? 'bg-bullish text-white shadow-lg shadow-bullish/30'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp size={16} />
            <span>YES @ {formatPrice(yesPrice)}</span>
          </div>
        </button>
        <button
          onClick={() => setPosition('no')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            position === 'no'
              ? 'bg-bearish text-white shadow-lg shadow-bearish/30'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingDown size={16} />
            <span>NO @ {formatPrice(noPrice)}</span>
          </div>
        </button>
      </div>

      {/* Bet Amount Input */}
      <div className="mb-4">
        <label className="text-sm text-text-secondary mb-2 block">Bet Amount</label>
        <div className="relative">
          <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="number"
            value={betAmount}
            onChange={(e) => {
              const value = Number(e.target.value) || 0;
              setBetAmount(Math.max(1, Math.min(10000, value)));
            }}
            className="w-full pl-9 pr-4 py-3 bg-surface-elevated border border-border rounded-lg text-bullish text-lg font-bold focus:outline-none focus:ring-2 focus:ring-bullish/50"
          />
        </div>
        
        {/* Preset amounts */}
        <div className="flex flex-wrap gap-2 mt-2">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                betAmount === amount
                  ? 'bg-bullish text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <Slider
          value={betAmount}
          onChange={(e) => {
            const value = Number(e.target.value) || 100;
            setBetAmount(Math.max(1, Math.min(10000, value)));
          }}
          min={1}
          max={10000}
          step={1}
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>$1</span>
          <span>$10,000</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {/* Main outcomes */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            key={`profit-${simulation.potentialProfit}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-bullish/10 border border-bullish/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-bullish text-xs mb-1">
              <TrendingUp size={12} />
              IF YOU WIN
            </div>
            <p className="text-2xl font-bold text-bullish">
              +${typeof simulation.potentialProfit === 'number' ? simulation.potentialProfit.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {typeof simulation.roi === 'number' ? simulation.roi.toFixed(0) : '0'}% return
            </p>
          </motion.div>

          <motion.div
            key={`loss-${simulation.potentialLoss}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-bearish/10 border border-bearish/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-bearish text-xs mb-1">
              <TrendingDown size={12} />
              IF YOU LOSE
            </div>
            <p className="text-2xl font-bold text-bearish">
              -${typeof simulation.potentialLoss === 'number' ? simulation.potentialLoss.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              100% loss
            </p>
          </motion.div>
        </div>

        {/* Expected Value */}
        <div className={`rounded-xl p-4 ${
          simulation.expectedValue >= 0 
            ? 'bg-bullish/5 border border-bullish/20' 
            : 'bg-bearish/5 border border-bearish/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className={simulation.expectedValue >= 0 ? 'text-bullish' : 'text-bearish'} />
              <span className="text-sm text-text-secondary">Expected Value</span>
            </div>
            <span className={`text-lg font-bold ${
              simulation.expectedValue >= 0 ? 'text-bullish' : 'text-bearish'
            }`}>
              {simulation.expectedValue >= 0 ? '+' : ''}${typeof simulation.expectedValue === 'number' && isFinite(simulation.expectedValue) ? simulation.expectedValue.toFixed(2) : '0.00'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {simulation.expectedValue >= 0 
              ? '✨ Based on current odds, this bet has positive expected value!'
              : '⚠️ Based on current odds, you may lose money on average.'}
          </p>
        </div>

        {/* Probability gauge */}
        <div className="bg-surface-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Implied Probability</span>
            <span className="text-sm font-bold text-text-primary">
              {typeof simulation.impliedProbability === 'number' && isFinite(simulation.impliedProbability) ? simulation.impliedProbability.toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${typeof simulation.impliedProbability === 'number' && isFinite(simulation.impliedProbability) ? simulation.impliedProbability : 0}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${position === 'yes' ? 'bg-bullish' : 'bg-bearish'}`}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            The market thinks there&apos;s a {typeof simulation.impliedProbability === 'number' && isFinite(simulation.impliedProbability) ? simulation.impliedProbability.toFixed(0) : '0'}% chance of {position.toUpperCase()}.
          </p>
        </div>

        {/* Advanced details toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Details
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-elevated rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Shares Received</p>
                  <p className="text-sm font-bold text-text-primary">
                    {typeof simulation.sharesReceived === 'number' && isFinite(simulation.sharesReceived) ? simulation.sharesReceived.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Max Payout</p>
                  <p className="text-sm font-bold text-text-primary">
                    ${typeof simulation.maxPayout === 'number' && isFinite(simulation.maxPayout) ? simulation.maxPayout.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Break-even Price</p>
                  <p className="text-sm font-bold text-text-primary">
                    {typeof simulation.breakEvenPrice === 'number' && isFinite(simulation.breakEvenPrice) ? formatPrice(simulation.breakEvenPrice) : formatPrice(0.5)}
                  </p>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3">
                  <p className="text-xs text-text-secondary">Cost Basis</p>
                  <p className="text-sm font-bold text-text-primary">
                    ${typeof simulation.betAmount === 'number' && isFinite(simulation.betAmount) ? simulation.betAmount.toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-surface-elevated rounded-lg p-3 mt-3">
                <p className="text-xs font-semibold text-text-primary mb-2">💡 How Prediction Markets Work</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• You buy shares at the current price (e.g., ${formatPrice(simulation.currentPrice)} per share)</li>
                  <li>• If you win, each share pays out $1.00</li>
                  <li>• Your profit = $1.00 - price you paid</li>
                  <li>• If you lose, shares become worthless</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-text-secondary flex items-start gap-2">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span>This is a simulation only. Actual results may vary. Never bet more than you can afford to lose.</span>
        </p>
      </div>
    </Card>
  );
}
