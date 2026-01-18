'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PricePoint, TimeRange } from '@/types';
import { formatChartTime, formatPrice } from '@/lib/formatters';
import { Button } from '@/components/ui';

const TIME_RANGES: TimeRange[] = ['1H', '24H', '7D', '30D', 'ALL'];

interface PriceChartProps {
  data: PricePoint[];
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  loading?: boolean;
}

export function PriceChart({ data, range, onRangeChange, loading }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      displayTime: formatChartTime(point.timestamp, range),
    }));
  }, [data, range]);

  const { minPrice, maxPrice, isUp, change } = useMemo(() => {
    if (data.length === 0) {
      return { minPrice: 0, maxPrice: 1, isUp: true, change: 0 };
    }
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    return {
      minPrice: Math.max(0, min - 0.05),
      maxPrice: Math.min(1, max + 0.05),
      isUp: change >= 0,
      change,
    };
  }, [data]);

  const color = isUp ? '#22c55e' : '#ea580c';
  const gradientId = `priceGradient-${isUp}`;

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-border rounded animate-pulse" />
          <div className="flex gap-2">
            {TIME_RANGES.map((r) => (
              <div key={r} className="h-8 w-12 bg-border rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-64 bg-border rounded animate-pulse" />
      </div>
    );
  }

  // Handle empty data state
  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-text-primary">—</span>
          </div>
          <div className="flex gap-1 bg-background rounded-lg p-1">
            {TIME_RANGES.map((r) => (
              <Button
                key={r}
                variant={range === r ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onRangeChange(r)}
                className="px-3 py-1.5 text-xs"
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-text-secondary">
          <div className="text-center">
            <p className="mb-2">No price history available for this time range</p>
            <p className="text-xs">Try a different time range or check back later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-text-primary">
            {data.length > 0 ? formatPrice(data[data.length - 1].price) : '—'}
          </span>
          <span
            className={`ml-2 text-sm font-medium ${
              isUp ? 'text-success' : 'text-bearish'
            }`}
          >
            {isUp ? '+' : ''}
            {(change * 100).toFixed(2)}%
          </span>
        </div>

        {/* Time range buttons */}
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onRangeChange(r)}
              className="px-3 py-1.5 text-xs"
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis
              dataKey="displayTime"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            
            <YAxis
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              width={45}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs text-text-secondary">{data.displayTime}</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatPrice(data.price)}
                    </p>
                  </div>
                );
              }}
            />
            
            <ReferenceLine y={0.5} stroke="#27272a" strokeDasharray="3 3" />
            
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
