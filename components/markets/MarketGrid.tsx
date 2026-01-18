'use client';

import { Market } from '@/types';
import { MarketCard } from './MarketCard';
import { MarketCardSkeleton } from '@/components/ui';

interface MarketGridProps {
  markets: Market[];
  loading?: boolean;
  onAddToCluster?: (market: Market) => void;
  onResearch?: (market: Market) => void;
  showAddButtons?: boolean;
  sparklineData?: Record<string, number[]>;
}

export function MarketGrid({
  markets,
  loading = false,
  onAddToCluster,
  onResearch,
  showAddButtons = false,
  sparklineData = {},
}: MarketGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No markets found</p>
        <p className="text-sm text-text-secondary mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market, index) => (
        <MarketCard
          key={market.id}
          market={market}
          sparklineData={sparklineData[market.id] || []}
          onAddToCluster={onAddToCluster}
          onResearch={onResearch}
          showAddButton={showAddButtons}
          index={index}
        />
      ))}
    </div>
  );
}
