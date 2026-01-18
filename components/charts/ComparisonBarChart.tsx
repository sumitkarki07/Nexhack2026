'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Market } from '@/types';
import { formatPrice, formatCompactNumber } from '@/lib/formatters';

interface ComparisonBarChartProps {
  market1: Market;
  market2: Market;
  className?: string;
}

export function ComparisonBarChart({ market1, market2, className = '' }: ComparisonBarChartProps) {
  const m1YesPrice = market1.outcomes[0]?.price || 0.5;
  const m2YesPrice = market2.outcomes[0]?.price || 0.5;

  // Prepare data for bar chart - use percentage format for better comparison
  const chartData = useMemo(() => {
    const maxVolume = Math.max(market1.volume, market2.volume);
    const maxLiquidity = Math.max(market1.liquidity, market2.liquidity);
    const m1ROI = ((1 / m1YesPrice) - 1) * 100;
    const m2ROI = ((1 / m2YesPrice) - 1) * 100;
    const maxROI = Math.max(Math.abs(m1ROI), Math.abs(m2ROI));

    return [
      {
        name: 'Price',
        market1: m1YesPrice * 100,
        market2: m2YesPrice * 100,
        format: 'percent',
        maxValue: 100,
        actual1: m1YesPrice,
        actual2: m2YesPrice,
      },
      {
        name: 'Volume',
        market1: maxVolume > 0 ? (market1.volume / maxVolume) * 100 : 0,
        market2: maxVolume > 0 ? (market2.volume / maxVolume) * 100 : 0,
        format: 'currency',
        maxValue: maxVolume,
        actual1: market1.volume,
        actual2: market2.volume,
      },
      {
        name: 'Liquidity',
        market1: maxLiquidity > 0 ? (market1.liquidity / maxLiquidity) * 100 : 0,
        market2: maxLiquidity > 0 ? (market2.liquidity / maxLiquidity) * 100 : 0,
        format: 'currency',
        maxValue: maxLiquidity,
        actual1: market1.liquidity,
        actual2: market2.liquidity,
      },
      {
        name: 'ROI',
        market1: maxROI > 0 ? ((m1ROI / maxROI) * 100) : 0,
        market2: maxROI > 0 ? ((m2ROI / maxROI) * 100) : 0,
        format: 'percent',
        maxValue: maxROI,
        actual1: m1ROI,
        actual2: m2ROI,
      },
    ];
  }, [market1, market2, m1YesPrice, m2YesPrice]);

  const color1 = '#2563eb'; // Bullish blue
  const color2 = '#ea580c'; // Bearish orange

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const item = chartData.find(d => d.name === label);
    if (!item) return null;

    const format = item.format || 'number';
    const value1 = payload.find((p: any) => p.dataKey === 'market1')?.value;
    const value2 = payload.find((p: any) => p.dataKey === 'market2')?.value;

    return (
      <div className="bg-surface border border-border rounded-lg px-2.5 py-2 shadow-xl">
        <p className="text-xs font-medium text-text-primary mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color1 }} />
            <span className="text-xs text-text-secondary">Current:</span>
            <span className="text-xs font-medium text-text-primary">
              {format === 'percent' && label === 'Price'
                ? formatPrice((item.actual1 as number) || (value1 / 100))
                : format === 'currency'
                ? `$${formatCompactNumber((item.actual1 as number) || 0)}`
                : `${((item.actual1 as number) || value1).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color2 }} />
            <span className="text-xs text-text-secondary">Compare:</span>
            <span className="text-xs font-medium text-text-primary">
              {format === 'percent' && label === 'Price'
                ? formatPrice((item.actual2 as number) || (value2 / 100))
                : format === 'currency'
                ? `$${formatCompactNumber((item.actual2 as number) || 0)}`
                : `${((item.actual2 as number) || value2).toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 40 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis
              hide
              domain={[0, 100]}
            />
            <Tooltip content={CustomTooltip} />
            <Bar
              dataKey="market1"
              fill={color1}
              radius={[3, 3, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-1-${index}`}
                  fill={entry.market1 >= entry.market2 ? color1 : `${color1}80`}
                />
              ))}
            </Bar>
            <Bar
              dataKey="market2"
              fill={color2}
              radius={[3, 3, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-2-${index}`}
                  fill={entry.market2 >= entry.market1 ? color2 : `${color2}80`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Compact Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color1 }} />
          <span className="text-xs text-text-secondary">Current Market</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color2 }} />
          <span className="text-xs text-text-secondary">Compare Market</span>
        </div>
      </div>
    </div>
  );
}
