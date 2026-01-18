'use client';

import Link from 'next/link';
import { 
  ExternalLink, 
  Github, 
  Twitter, 
  Mail, 
  BarChart3, 
  Zap,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/30 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 lg:mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-bullish to-bullish-hover rounded-lg flex items-center justify-center">
                <BarChart3 size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary group-hover:text-bullish transition-colors">
                PulseForge
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xs">
              Real-time prediction market strategy & research tool. Build multi-market strategies, 
              scan for inefficiencies, and generate AI-powered insights.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="live" size="sm" className="text-xs">
                LIVE
              </Badge>
              <Badge variant="default" size="sm" className="text-xs font-mono">
                #nexhacks
              </Badge>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Zap size={14} />
              Features
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              <li>
                <Link href="/" className="hover:text-bullish transition-colors block">
                  Markets Explorer
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-bullish transition-colors block">
                  Strategy Builder
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-bullish transition-colors block">
                  Cluster Scanner
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-bullish transition-colors flex items-center gap-1.5">
                  <Sparkles size={12} />
                  AI Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp size={14} />
              Resources
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              <li>
                <a
                  href="https://polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bullish transition-colors flex items-center gap-1.5"
                >
                  Polymarket
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.polymarket.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bullish transition-colors flex items-center gap-1.5"
                >
                  API Documentation
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <Link href="/help" className="hover:text-bullish transition-colors block">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-bullish transition-colors block">
                  Tutorials
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">About</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              <li>
                <Link href="/about" className="hover:text-bullish transition-colors block">
                  About PulseForge
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-bullish transition-colors block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-bullish transition-colors block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-border/50 pt-8 pb-8">
          {/* Copyright & Social Icons */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-text-secondary">
              <p className="font-medium">
                © {currentYear} PulseForge · Built for NexHacks 2026
              </p>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-bullish transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-bullish transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="mailto:support@pulseforge.com"
                className="text-text-secondary hover:text-bullish transition-colors"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
