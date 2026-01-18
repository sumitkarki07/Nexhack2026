'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, XCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <Shield size={48} className="text-bullish mx-auto" />
          <h1 className="text-4xl font-extrabold text-text-primary">Privacy Policy</h1>
          <p className="text-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <Card padding="lg" className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-2">
              <Lock size={20} />
              Data Collection
            </h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              PulseForge respects your privacy. We collect minimal data necessary to provide our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
              <li>Account information (if you choose to sign up): email, name, and selected interests</li>
              <li>Browser localStorage data for preferences and saved research</li>
              <li>Anonymous usage analytics to improve the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-2">
              <Eye size={20} />
              Data Usage
            </h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              We use collected data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
              <li>Personalize your market recommendations based on your interests</li>
              <li>Save your research drafts and strategy analyses</li>
              <li>Improve our services and user experience</li>
              <li>Provide customer support if needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-2">
              <Database size={20} />
              Data Storage
            </h2>
            <p className="text-text-secondary leading-relaxed">
              All user data is currently stored locally in your browser using localStorage. 
              We do not have a backend database storing your personal information. You can clear 
              your data at any time by clearing your browser's localStorage or using the settings 
              feature in the app.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center gap-2">
              <XCircle size={20} />
              Third-Party Services
            </h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              PulseForge integrates with the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
              <li><strong>Polymarket APIs:</strong> We fetch live market data from Polymarket's public APIs</li>
              <li><strong>Google Gemini API:</strong> Used for AI-powered research generation (API keys are server-side only)</li>
              <li><strong>NewsAPI:</strong> Used for fetching relevant news articles for market research</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-3">
              We do not share your personal data with these services. Market data queries are made 
              anonymously, and AI requests do not include personal identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Your Rights</h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
              <li>Access and view your saved data</li>
              <li>Delete your account and all associated data</li>
              <li>Clear your saved research and preferences</li>
              <li>Opt-out of certain data collection features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Changes to This Policy</h2>
            <p className="text-text-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Contact Us</h2>
            <p className="text-text-secondary leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@pulseforge.com" className="text-bullish hover:underline">
                privacy@pulseforge.com
              </a>
            </p>
          </section>
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
