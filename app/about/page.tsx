'use client';

import { motion } from 'framer-motion';
import { BarChart3, Sparkles, Zap, TrendingUp, Target, Shield } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-bullish to-bullish-hover rounded-xl flex items-center justify-center">
              <BarChart3 size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-bullish via-bullish-hover to-bullish bg-clip-text text-transparent">
              PulseForge
            </h1>
          </div>
          <p className="text-lg text-text-secondary">
            Prediction Market Strategy & Research Platform
          </p>
        </div>

        {/* Mission */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            PulseForge is a comprehensive platform designed to empower prediction market traders and researchers. 
            We provide real-time market data analysis, multi-market strategy building, and AI-powered research 
            tools to help users make informed decisions in prediction markets.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Built with live data from Polymarket, PulseForge offers unique capabilities for detecting market 
            inefficiencies, visualizing complex payoff surfaces, and generating evidence-backed market analysis.
          </p>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md" className="flex items-start gap-3">
              <Sparkles size={24} className="text-bullish flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">AI-Powered Research</h3>
                <p className="text-sm text-text-secondary">
                  Generate comprehensive market analysis using Google Gemini AI with structured insights and resolution checklists.
                </p>
              </div>
            </Card>

            <Card padding="md" className="flex items-start gap-3">
              <Zap size={24} className="text-bullish flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Real-Time Data</h3>
                <p className="text-sm text-text-secondary">
                  Access live market data directly from Polymarket's Gamma and CLOB APIs with real-time updates.
                </p>
              </div>
            </Card>

            <Card padding="md" className="flex items-start gap-3">
              <TrendingUp size={24} className="text-bullish flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Strategy Builder</h3>
                <p className="text-sm text-text-secondary">
                  Build multi-market positions and visualize payoff curves and surfaces with time-value discounting.
                </p>
              </div>
            </Card>

            <Card padding="md" className="flex items-start gap-3">
              <Target size={24} className="text-bullish flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Inefficiency Scanner</h3>
                <p className="text-sm text-text-secondary">
                  Detect constraint violations, arbitrage opportunities, and threshold inconsistencies across market clusters.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Technology */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Shield size={20} />
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-text-primary mb-1">Framework</p>
              <p className="text-text-secondary">Next.js 14 (App Router)</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Language</p>
              <p className="text-text-secondary">TypeScript</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Styling</p>
              <p className="text-text-secondary">Tailwind CSS</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">AI</p>
              <p className="text-text-secondary">Google Gemini API</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Charts</p>
              <p className="text-text-secondary">Recharts</p>
            </div>
            <div>
              <p className="font-semibold text-text-primary mb-1">Animations</p>
              <p className="text-text-secondary">Framer Motion</p>
            </div>
          </div>
        </Card>

        {/* Disclaimer */}
        <Card padding="md" className="bg-surface border-border">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Important Disclaimer</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                PulseForge is a demo research tool and is not financial advice. This is an experimental analysis platform. 
                All predictions are based on market data and AI analysis which may be inaccurate. Do not make financial 
                decisions based solely on this tool. Always conduct your own research and consult with financial professionals.
              </p>
            </div>
          </div>
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
