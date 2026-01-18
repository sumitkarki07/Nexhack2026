'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowUpDown, TrendingUp, Clock, Activity, Zap, Flame } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { debounce } from '@/lib/utils';

type SortOption = 'volume' | 'recent' | 'volatility' | 'change' | 'trending';

interface MarketSearchProps {
  onSearch: (query: string) => void;
  onSort: (sort: SortOption) => void;
  currentSort: SortOption;
}

const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
  { id: 'trending', label: 'Trending', icon: <Flame size={14} /> },
  { id: 'volume', label: 'Volume', icon: <Activity size={14} /> },
  { id: 'recent', label: 'Recent', icon: <Clock size={14} /> },
  { id: 'volatility', label: 'Volatility', icon: <Zap size={14} /> },
  { id: 'change', label: 'Change', icon: <TrendingUp size={14} /> },
];

export function MarketSearch({ onSearch, onSort, currentSort }: MarketSearchProps) {
  const [query, setQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const currentSortOption = sortOptions.find(s => s.id === currentSort);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets..."
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <Button
          variant="secondary"
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="w-full sm:w-auto justify-between gap-2"
        >
          <ArrowUpDown size={16} />
          <span className="hidden sm:inline">Sort by:</span>
          <span className="font-medium">{currentSortOption?.label}</span>
        </Button>

        {showSortMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowSortMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-20 py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSort(option.id);
                    setShowSortMenu(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                    ${
                      currentSort === option.id
                        ? 'bg-border text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-border/50'
                    }
                  `}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
