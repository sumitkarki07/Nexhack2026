'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Bell,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatRelativeDate } from '@/lib/formatters';
import { Market } from '@/types';

interface ResolutionTrackerProps {
  market: Market;
  className?: string;
}

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'milestone' | 'deadline' | 'event' | 'resolution';
  status: 'completed' | 'upcoming' | 'critical';
  impact: 'high' | 'medium' | 'low';
}

// Generate timeline events based on market
function generateTimeline(market: Market): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const now = new Date();
  const endDate = new Date(market.endDate);
  const question = market.question.toLowerCase();
  
  // Add market creation event
  const createdDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  events.push({
    id: 'created',
    date: createdDate,
    title: 'Market Created',
    description: 'Trading opened on Polymarket',
    type: 'milestone',
    status: 'completed',
    impact: 'medium',
  });

  // Add category-specific events
  if (question.includes('election') || question.includes('president') || question.includes('trump') || question.includes('biden')) {
    // Political events
    const primaryDate = new Date('2024-03-05');
    if (primaryDate > createdDate && primaryDate < endDate) {
      events.push({
        id: 'primary',
        date: primaryDate,
        title: 'Super Tuesday',
        description: 'Multiple state primaries - major momentum shift possible',
        type: 'event',
        status: primaryDate < now ? 'completed' : 'upcoming',
        impact: 'high',
      });
    }

    const conventionDate = new Date('2024-08-19');
    if (conventionDate > createdDate && conventionDate < endDate) {
      events.push({
        id: 'convention',
        date: conventionDate,
        title: 'Party Conventions',
        description: 'Nominees officially confirmed',
        type: 'milestone',
        status: conventionDate < now ? 'completed' : 'upcoming',
        impact: 'high',
      });
    }

    const debateDate = new Date('2024-09-10');
    if (debateDate > createdDate && debateDate < endDate) {
      events.push({
        id: 'debate',
        date: debateDate,
        title: 'Presidential Debates',
        description: 'Head-to-head debates can shift polls significantly',
        type: 'event',
        status: debateDate < now ? 'completed' : 'upcoming',
        impact: 'high',
      });
    }
  } else if (question.includes('bitcoin') || question.includes('crypto') || question.includes('eth')) {
    // Crypto events
    const halvingDate = new Date('2024-04-20');
    if (halvingDate > createdDate && halvingDate < endDate) {
      events.push({
        id: 'halving',
        date: halvingDate,
        title: 'Bitcoin Halving',
        description: 'Block reward cut in half - historically bullish',
        type: 'event',
        status: halvingDate < now ? 'completed' : 'upcoming',
        impact: 'high',
      });
    }

    // Add ETF decision
    events.push({
      id: 'etf',
      date: new Date('2024-01-10'),
      title: 'ETF Decision',
      description: 'SEC spot ETF approval could drive major price action',
      type: 'deadline',
      status: 'completed',
      impact: 'high',
    });
  } else if (question.includes('super bowl') || question.includes('championship') || question.includes('world series')) {
    // Sports events
    const playoffDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    events.push({
      id: 'playoffs',
      date: playoffDate,
      title: 'Playoff Games',
      description: 'Elimination games - each result narrows outcomes',
      type: 'event',
      status: playoffDate < now ? 'completed' : 'upcoming',
      impact: 'high',
    });
  }

  // Add warning period before end
  const warningDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (warningDate > now) {
    events.push({
      id: 'warning',
      date: warningDate,
      title: 'Final Week',
      description: 'One week until resolution - volatility may increase',
      type: 'deadline',
      status: warningDate < now ? 'completed' : 'upcoming',
      impact: 'medium',
    });
  }

  // Add resolution date
  events.push({
    id: 'resolution',
    date: endDate,
    title: 'Market Resolution',
    description: 'Final outcome determined and payouts distributed',
    type: 'resolution',
    status: endDate < now ? 'completed' : endDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'critical' : 'upcoming',
    impact: 'high',
  });

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function ResolutionTracker({ market, className = '' }: ResolutionTrackerProps) {
  const timeline = useMemo(() => generateTimeline(market), [market]);
  const now = new Date();
  const endDate = new Date(market.endDate);
  
  // Calculate time remaining
  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
  
  // Find next upcoming event
  const nextEvent = timeline.find(e => e.date > now);
  
  // Progress percentage
  const createdEvent = timeline.find(e => e.id === 'created');
  const totalDuration = endDate.getTime() - (createdEvent?.date.getTime() || now.getTime());
  const elapsed = now.getTime() - (createdEvent?.date.getTime() || now.getTime());
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const statusColors = {
    completed: 'bg-bullish/20 text-bullish border-bullish',
    upcoming: 'bg-surface-elevated text-text-secondary border-border',
    critical: 'bg-warning/20 text-warning border-warning',
  };

  const impactColors = {
    high: 'text-bearish',
    medium: 'text-warning',
    low: 'text-text-secondary',
  };

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
          <Calendar size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Resolution Tracker</h3>
          <p className="text-xs text-text-secondary">Key dates and events timeline</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="bg-surface-elevated rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">Time Until Resolution</span>
          <Badge 
            variant={daysRemaining < 7 ? 'default' : 'secondary'}
            className={daysRemaining < 7 ? 'bg-warning text-background' : ''}
          >
            {daysRemaining < 1 ? '🔥 Final Hours' : daysRemaining < 7 ? '⚠️ Final Week' : '🕐 Active'}
          </Badge>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="text-center flex-1 bg-background rounded-lg p-3">
            <span className="text-3xl font-bold text-text-primary">{daysRemaining}</span>
            <p className="text-xs text-text-secondary">Days</p>
          </div>
          <div className="text-center flex-1 bg-background rounded-lg p-3">
            <span className="text-3xl font-bold text-text-primary">{hoursRemaining}</span>
            <p className="text-xs text-text-secondary">Hours</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-bullish to-warning"
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-text-secondary">
            <span>Market Start</span>
            <span>Resolution</span>
          </div>
        </div>
      </div>

      {/* Next Event Highlight */}
      {nextEvent && (
        <div className={`rounded-xl p-4 mb-4 border ${
          nextEvent.status === 'critical' 
            ? 'bg-warning/10 border-warning/30' 
            : 'bg-bullish/10 border-bullish/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className={nextEvent.status === 'critical' ? 'text-warning' : 'text-bullish'} />
            <span className="text-sm font-medium text-text-primary">Next Key Event</span>
          </div>
          <h4 className="font-bold text-text-primary">{nextEvent.title}</h4>
          <p className="text-sm text-text-secondary mb-2">{nextEvent.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <Clock size={12} className="text-text-secondary" />
            <span className="text-text-secondary">{formatRelativeDate(nextEvent.date.toISOString())}</span>
            <Badge variant="secondary" className={impactColors[nextEvent.impact]}>
              {nextEvent.impact} impact
            </Badge>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1;
          const isPast = event.date < now;
          
          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 ${
                  event.status === 'completed' 
                    ? 'bg-bullish border-bullish' 
                    : event.status === 'critical'
                    ? 'bg-warning border-warning animate-pulse'
                    : 'bg-background border-border'
                }`}>
                  {event.status === 'completed' && (
                    <CheckCircle2 size={8} className="text-background" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-full min-h-[40px] ${
                    isPast ? 'bg-bullish/50' : 'bg-border'
                  }`} />
                )}
              </div>

              {/* Event content */}
              <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-secondary">
                    {event.date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: event.date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                    })}
                  </span>
                  {event.type === 'resolution' && (
                    <Badge variant="default" className="bg-gradient-to-r from-bullish to-warning text-background text-xs">
                      <Flag size={8} className="mr-1" />
                      Resolution
                    </Badge>
                  )}
                </div>
                <h4 className={`font-medium ${isPast ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {event.title}
                </h4>
                <p className="text-xs text-text-secondary">{event.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Alert Button */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="secondary" className="w-full" disabled>
          <Bell size={14} className="mr-2" />
          Set Event Alerts (Coming Soon)
        </Button>
        <p className="text-xs text-text-secondary mt-2 text-center">
          Get notified before key events that could move this market
        </p>
      </div>
    </Card>
  );
}
