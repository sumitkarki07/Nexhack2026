'use client';

import { motion } from 'framer-motion';
import { HelpCircle, BookOpen, Sparkles, BarChart3, Scan, TrendingUp, PlayCircle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <HelpCircle size={48} className="text-bullish mx-auto" />
          <h1 className="text-4xl font-extrabold text-text-primary">How It Works</h1>
          <p className="text-lg text-text-secondary">
            Get started with PulseForge in minutes
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <PlayCircle size={24} />
            Quick Start Guide
          </h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-bullish/20 text-bullish rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <BarChart3 size={18} className="text-bullish" />
                  Explore Markets
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Browse live prediction markets from Polymarket. Use search, category filters, and sorting 
                  options to find markets that interest you.
                </p>
                <Link href="/" className="text-bullish hover:underline text-sm font-medium">
                  Go to Markets →
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-bullish/20 text-bullish rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-bullish" />
                  Research Markets
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Click the "Research" button on any market to generate AI-powered analysis with insights, 
                  key variables, resolution checklists, and debate prompts.
                </p>
                <Link href="/research" className="text-bullish hover:underline text-sm font-medium">
                  View Research →
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-bullish/20 text-bullish rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-bullish" />
                  Build Strategies
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Click into a market detail page to access the Strategy Builder. Add multiple positions 
                  and visualize payoff surfaces with time-value discounting.
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  <Badge variant="default" size="sm" className="mr-2">Tip</Badge>
                  Use the Payoff Surface to understand potential returns across different probabilities and time horizons
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-bullish/20 text-bullish rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Scan size={18} className="text-bullish" />
                  Scan for Inefficiencies
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-2">
                  Use the "Build Cluster" feature to select related markets, then scan for inefficiencies 
                  like sum-to-one violations, threshold inconsistencies, and arbitrage opportunities.
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  <Badge variant="default" size="sm" className="mr-2">Tip</Badge>
                  Perfect for detecting mispriced related markets or finding trading opportunities
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Features */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <BookOpen size={24} />
            Key Features Explained
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md">
              <h3 className="font-semibold text-text-primary mb-2">Markets Explorer</h3>
              <p className="text-sm text-text-secondary">
                Browse all active Polymarket markets with real-time data. Filter by category, search by keywords, 
                and sort by volume, recency, volatility, or trending status.
              </p>
            </Card>

            <Card padding="md">
              <h3 className="font-semibold text-text-primary mb-2">AI Research</h3>
              <p className="text-sm text-text-secondary">
                Get comprehensive market analysis powered by Google Gemini AI. Includes resolution checklists, 
                key variables, scenario analysis, and related news articles.
              </p>
            </Card>

            <Card padding="md">
              <h3 className="font-semibold text-text-primary mb-2">Strategy Builder</h3>
              <p className="text-sm text-text-secondary">
                Build multi-market positions and visualize payoff curves and surfaces. Includes time-value 
                discounting to account for opportunity costs.
              </p>
            </Card>

            <Card padding="md">
              <h3 className="font-semibold text-text-primary mb-2">Cluster Scanner</h3>
              <p className="text-sm text-text-secondary">
                Detect market inefficiencies across related markets. Identifies constraint violations, 
                threshold inconsistencies, and potential arbitrage opportunities.
              </p>
            </Card>
          </div>
        </div>

        {/* Tips */}
        <Card padding="lg" className="bg-surface/50">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Pro Tips</h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-bullish mt-0.5">•</span>
              <span>Use the "Trending" filter to find markets with high activity and volume</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bullish mt-0.5">•</span>
              <span>Save research briefs to review later from the Research page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bullish mt-0.5">•</span>
              <span>Build clusters of related markets to find inefficiencies and arbitrage opportunities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bullish mt-0.5">•</span>
              <span>Adjust the discount rate in strategy analysis to account for time value of money</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bullish mt-0.5">•</span>
              <span>Select your interests during sign-up to see personalized market recommendations</span>
            </li>
          </ul>
        </Card>

        {/* Back to Home */}
        <div className="flex justify-center pt-4">
          <Link 
            href="/"
            className="text-bullish hover:underline font-medium text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
