'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { MARKET_CATEGORIES, MarketCategory } from '@/types';

interface CategoryPillsProps {
  selected: string;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  trending: <Flame size={14} />,
};

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MARKET_CATEGORIES.map((category) => {
        const isSelected = selected === category.id;
        const icon = categoryIcons[category.id];
        
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`
              relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition-colors flex items-center gap-1.5
              ${
                isSelected
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="categoryPill"
                className={`absolute inset-0 bg-surface border rounded-full ${
                  category.id === 'trending' ? 'border-bullish/50 bg-bullish/5' : 'border-border'
                }`}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            {icon && <span className="relative z-10">{icon}</span>}
            <span className="relative z-10">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
