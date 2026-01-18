'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  TrendingDown,
  TrendingUp,
  Clock,
  Newspaper,
  AlertTriangle,
  X,
  Plus,
  Settings,
  Check,
  Trash2,
} from 'lucide-react';
import { Card, Badge, Button, Input, Slider } from '@/components/ui';
import { formatPrice, formatRelativeDate } from '@/lib/formatters';
import { Market } from '@/types';

interface SmartAlertsProps {
  market: Market;
  className?: string;
}

interface Alert {
  id: string;
  type: 'price_drop' | 'price_rise' | 'deadline' | 'news' | 'volume';
  title: string;
  description: string;
  isNew: boolean;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
  triggered: boolean;
}

interface AlertRule {
  id: string;
  type: 'price_threshold' | 'deadline' | 'news';
  enabled: boolean;
  config: {
    threshold?: number;
    direction?: 'above' | 'below';
    daysBefore?: number;
  };
}

// Generate smart alerts based on market data
function generateAlerts(market: Market): Alert[] {
  const alerts: Alert[] = [];
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const priceChange = market.outcomes[0]?.priceChange24h || 0;
  const endDate = new Date(market.endDate);
  const daysUntilEnd = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  // Price drop alert
  if (priceChange < -0.05) {
    alerts.push({
      id: 'price-drop',
      type: 'price_drop',
      title: `Price dropped ${(Math.abs(priceChange) * 100).toFixed(0)}%`,
      description: `YES price fell from ${formatPrice(yesPrice - priceChange)} to ${formatPrice(yesPrice)} in the last 24 hours.`,
      isNew: true,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      severity: Math.abs(priceChange) > 0.1 ? 'high' : 'medium',
      triggered: true,
    });
  }

  // Price rise alert
  if (priceChange > 0.05) {
    alerts.push({
      id: 'price-rise',
      type: 'price_rise',
      title: `Price surged ${(priceChange * 100).toFixed(0)}%`,
      description: `YES price jumped from ${formatPrice(yesPrice - priceChange)} to ${formatPrice(yesPrice)} in the last 24 hours.`,
      isNew: true,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      severity: priceChange > 0.1 ? 'high' : 'medium',
      triggered: true,
    });
  }

  // Deadline approaching alert
  if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
    alerts.push({
      id: 'deadline',
      type: 'deadline',
      title: `Resolution in ${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''}`,
      description: `This market resolves ${formatRelativeDate(market.endDate)}. Consider finalizing your position.`,
      isNew: daysUntilEnd <= 3,
      timestamp: new Date(),
      severity: daysUntilEnd <= 3 ? 'high' : 'medium',
      triggered: true,
    });
  }

  // Volume spike alert (simulated)
  if (market.volume > 100000 && Math.random() > 0.5) {
    alerts.push({
      id: 'volume',
      type: 'volume',
      title: 'Unusual trading volume',
      description: 'Trading activity is significantly higher than average. Smart money may be moving.',
      isNew: Math.random() > 0.5,
      timestamp: new Date(Date.now() - Math.random() * 7200000),
      severity: 'medium',
      triggered: true,
    });
  }

  // News alert (simulated)
  if (Math.random() > 0.6) {
    alerts.push({
      id: 'news',
      type: 'news',
      title: 'New information available',
      description: 'Recent news articles may affect the outcome of this market.',
      isNew: Math.random() > 0.5,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      severity: 'low',
      triggered: true,
    });
  }

  return alerts.sort((a, b) => {
    // Sort by severity first, then by timestamp
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
}

export function SmartAlerts({ market, className = '' }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts(market));
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([
    { id: 'price-drop', type: 'price_threshold', enabled: true, config: { threshold: 10, direction: 'below' } },
    { id: 'price-rise', type: 'price_threshold', enabled: true, config: { threshold: 10, direction: 'above' } },
    { id: 'deadline', type: 'deadline', enabled: true, config: { daysBefore: 7 } },
    { id: 'news', type: 'news', enabled: true, config: {} },
  ]);

  const newAlertsCount = useMemo(() => alerts.filter(a => a.isNew).length, [alerts]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, isNew: false })));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const severityColors = {
    high: 'bg-bearish/10 border-bearish/30 text-bearish',
    medium: 'bg-warning/10 border-warning/30 text-warning',
    low: 'bg-surface-elevated border-border text-text-secondary',
  };

  const typeIcons = {
    price_drop: <TrendingDown size={16} className="text-bearish" />,
    price_rise: <TrendingUp size={16} className="text-bullish" />,
    deadline: <Clock size={16} className="text-warning" />,
    news: <Newspaper size={16} className="text-purple-400" />,
    volume: <AlertTriangle size={16} className="text-orange-400" />,
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center relative">
            {newAlertsCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-bearish rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">{newAlertsCount}</span>
              </motion.div>
            )}
            <BellRing size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Smart Alerts</h3>
            <p className="text-xs text-text-secondary">Stay informed on market changes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newAlertsCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <Check size={12} className="mr-1" />
              Mark read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={14} />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-text-primary">Alert Settings</p>
              
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rule.type === 'price_threshold' && rule.config.direction === 'below' && typeIcons.price_drop}
                    {rule.type === 'price_threshold' && rule.config.direction === 'above' && typeIcons.price_rise}
                    {rule.type === 'deadline' && typeIcons.deadline}
                    {rule.type === 'news' && typeIcons.news}
                    <span className="text-sm text-text-secondary">
                      {rule.type === 'price_threshold' && rule.config.direction === 'below' && `Price drops ${rule.config.threshold}%+`}
                      {rule.type === 'price_threshold' && rule.config.direction === 'above' && `Price rises ${rule.config.threshold}%+`}
                      {rule.type === 'deadline' && `${rule.config.daysBefore} days before resolution`}
                      {rule.type === 'news' && 'New information available'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      rule.enabled ? 'bg-bullish' : 'bg-surface'
                    }`}
                  >
                    <motion.div
                      animate={{ x: rule.enabled ? 16 : 2 }}
                      className="w-5 h-5 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              ))}

              <p className="text-xs text-text-secondary pt-2 border-t border-border">
                💡 Alert notifications coming soon! For now, check this panel regularly.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <Bell size={32} className="mx-auto text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">No active alerts</p>
          <p className="text-xs text-text-secondary mt-1">We&apos;ll notify you when something important happens</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl p-3 border ${severityColors[alert.severity]} relative group`}
            >
              {/* New indicator */}
              {alert.isNew && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-bullish rounded-full animate-pulse" />
              )}

              {/* Dismiss button */}
              <button
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50 rounded"
              >
                <X size={12} />
              </button>

              {/* Content */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {typeIcons[alert.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{alert.title}</span>
                    <Badge variant="secondary" className={`text-xs ${
                      alert.severity === 'high' ? 'bg-bearish/20 text-bearish' :
                      alert.severity === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-surface text-text-secondary'
                    }`}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{alert.description}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatRelativeDate(alert.timestamp.toISOString())}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" disabled>
            <Bell size={12} className="mr-1" />
            Enable Push (Soon)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAlerts(generateAlerts(market))}>
            <Plus size={12} className="mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    </Card>
  );
}
