'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Globe, TrendingDown, Check } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { MARKET_CATEGORIES } from '@/types/market';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: (interests: string[]) => void;
  initialInterests?: string[];
}

const INTEREST_ICONS: Record<string, React.ReactNode> = {
  all: <Globe size={18} />,
  politics: <TrendingUp size={18} />,
  crypto: <TrendingDown size={18} />,
  sports: <Sparkles size={18} />,
  'pop-culture': <Sparkles size={18} />,
  business: <TrendingUp size={18} />,
  science: <Sparkles size={18} />,
  world: <Globe size={18} />,
};

export function ProfileSetupModal({ isOpen, onComplete, initialInterests = [] }: ProfileSetupModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [loading, setLoading] = useState(false);

  // Filter out 'all' category as it's not a real interest
  const interestsOptions = MARKET_CATEGORIES.filter(cat => cat.id !== 'all');

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleComplete = async () => {
    if (selectedInterests.length === 0) {
      // Allow continuing without interests, but default to 'all'
      onComplete(['all']);
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    onComplete(selectedInterests);
    setLoading(false);
  };

  const handleSkip = () => {
    onComplete(['all']); // Default to all markets
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" size="md" closeOnOverlayClick={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-bullish to-bullish-hover rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to PulseForge!</h2>
          <p className="text-sm text-text-secondary">
            Select your interests to see personalized market recommendations
          </p>
        </div>

        {/* Interests Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-primary">Select Your Interests</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {interestsOptions.map((category) => {
              const isSelected = selectedInterests.includes(category.id);
              return (
                <motion.button
                  key={category.id}
                  onClick={() => toggleInterest(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-bullish bg-bullish/10 text-bullish'
                      : 'border-border bg-surface hover:border-text-secondary text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-bullish rounded-full flex items-center justify-center"
                    >
                      <Check size={12} className="text-white" />
                    </motion.div>
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`${isSelected ? 'text-bullish' : 'text-text-secondary'}`}>
                      {INTEREST_ICONS[category.id] || <Sparkles size={18} />}
                    </div>
                    <span className="text-xs font-medium text-center">{category.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {selectedInterests.length === 0 && (
            <p className="text-xs text-text-secondary text-center mt-2">
              Don't worry, you can change this later in your profile
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1"
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            onClick={handleComplete}
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Saving...' : `Continue ${selectedInterests.length > 0 ? `(${selectedInterests.length})` : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
