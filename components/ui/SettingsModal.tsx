'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Moon, Sun, Monitor, Bell, Zap, RefreshCw, Database, TrendingUp, DollarSign, Globe, Clock, Filter, Eye } from 'lucide-react';
import { Modal } from './Modal';
import { Button, Card, Badge } from './index';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Slider } from './Slider';
import { clearCache } from '@/lib/polymarket';
import { useTheme } from '@/context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [notifications, setNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [priceAlertThreshold, setPriceAlertThreshold] = useState(5);
  const [compactView, setCompactView] = useState(false);
  const [defaultLimit, setDefaultLimit] = useState(20);
  const [defaultSort, setDefaultSort] = useState<'volume' | 'recent' | 'volatility' | 'change'>('volume');
  const [apiTimeout, setApiTimeout] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<string>('checking');
  const [isCheckingPush, setIsCheckingPush] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulseforge_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.autoRefresh !== undefined) setAutoRefresh(settings.autoRefresh);
          if (settings.refreshInterval) setRefreshInterval(settings.refreshInterval);
          if (settings.defaultLimit) setDefaultLimit(settings.defaultLimit);
          if (settings.defaultSort) setDefaultSort(settings.defaultSort);
          if (settings.compactView !== undefined) setCompactView(settings.compactView);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const settings = {
        autoRefresh,
        refreshInterval,
        defaultLimit,
        defaultSort,
        compactView,
        notifications,
        priceAlerts,
        priceAlertThreshold,
      };
      localStorage.setItem('pulseforge_settings', JSON.stringify(settings));
      // Simple notification
      console.log('Settings saved successfully');
    }
    onClose();
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      clearCache();
      localStorage.removeItem('pulseforge_cache');
      // Simple notification
      console.log('Cache cleared successfully');
    }
  };

  // Check push notification support and permissions
  const checkPushNotifications = async () => {
    console.log('[Push Notifications] Check button clicked');
    
    if (typeof window === 'undefined') {
      console.log('[Push Notifications] Window is undefined');
      setPushNotificationStatus('not-supported');
      return;
    }

    if (!('Notification' in window)) {
      console.log('[Push Notifications] Notifications not supported in this browser');
      setPushNotificationStatus('not-supported');
      return;
    }

    setIsCheckingPush(true);
    console.log('[Push Notifications] Starting check...');

    try {
      const currentPermission = Notification.permission;
      console.log('[Push Notifications] Current permission:', currentPermission);

      if (currentPermission === 'default') {
        // Request permission
        console.log('[Push Notifications] Requesting permission...');
        const result = await Notification.requestPermission();
        console.log('[Push Notifications] Permission result:', result);
        setPushNotificationStatus(result);
        
        if (result === 'granted') {
          // Show a test notification
          new Notification('PulseForge', {
            body: 'Push notifications are now enabled!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
          });
        }
      } else {
        // Just refresh the status
        console.log('[Push Notifications] Permission already set to:', currentPermission);
        setPushNotificationStatus(currentPermission);
      }
    } catch (error) {
      console.error('[Push Notifications] Error:', error);
      setPushNotificationStatus('error');
    } finally {
      setIsCheckingPush(false);
      console.log('[Push Notifications] Check complete');
    }
  };

  // Check notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushNotificationStatus(Notification.permission);
    } else {
      setPushNotificationStatus('not-supported');
    }
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="lg">
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-4">
            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Auto Refresh</h4>
                    <p className="text-xs text-text-secondary">Automatically refresh market data</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-bullish' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {autoRefresh && (
                <div className="mt-4">
                  <label className="text-xs text-text-secondary block mb-2">
                    Refresh interval: {refreshInterval} seconds
                  </label>
                  <Slider
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    min={10}
                    max={120}
                    step={10}
                  />
                </div>
              )}
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Eye size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Default Markets Per Page</h4>
                    <p className="text-xs text-text-secondary">Number of markets to show initially</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Slider
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(Number(e.target.value))}
                  min={10}
                  max={100}
                  step={10}
                />
                <p className="text-xs text-text-secondary mt-1">{defaultLimit} markets per page</p>
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Default Sort</h4>
                    <p className="text-xs text-text-secondary">Initial sorting method for markets</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {(['volume', 'recent', 'volatility', 'change'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setDefaultSort(sort)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      defaultSort === sort
                        ? 'bg-bullish text-white'
                        : 'bg-background text-text-secondary hover:bg-surface'
                    }`}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </button>
                ))}
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Cache Management</h4>
                    <p className="text-xs text-text-secondary">Clear cached market data</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCache}
                >
                  Clear Cache
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-4">
            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Browser Notifications</h4>
                    <p className="text-xs text-text-secondary">Enable browser notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-bullish' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>

            <Card padding="md" className="border-border bg-background/50 opacity-75 relative">
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="text-xs bg-warning/20 text-warning border-warning/30">
                  Soon
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                      Push Notifications
                    </h4>
                    <p className="text-xs text-text-secondary">Receive push notifications on your device</p>
                  </div>
                </div>
                <button
                  disabled
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-border cursor-not-allowed opacity-50"
                  title="Coming soon"
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-text-secondary italic mb-3">
                  Push notifications will allow you to receive real-time alerts about price movements, market closures, and important updates even when the app is closed.
                </p>
                
                {/* Status and Refresh Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Status:</span>
                    <Badge 
                      variant="default" 
                      className={`text-xs ${
                        pushNotificationStatus === 'granted' 
                          ? 'bg-success/20 text-success border-success/30'
                          : pushNotificationStatus === 'denied'
                          ? 'bg-bearish/20 text-bearish border-bearish/30'
                          : pushNotificationStatus === 'not-supported'
                          ? 'bg-border text-text-secondary'
                          : 'bg-warning/20 text-warning border-warning/30'
                      }`}
                    >
                      {pushNotificationStatus === 'granted' && '✓ Ready'}
                      {pushNotificationStatus === 'denied' && '✗ Blocked'}
                      {pushNotificationStatus === 'default' && '⚡ Not Requested'}
                      {pushNotificationStatus === 'not-supported' && '❌ Not Supported'}
                      {pushNotificationStatus === 'checking' && '⏳ Checking...'}
                      {pushNotificationStatus === 'error' && '⚠️ Error'}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      checkPushNotifications();
                    }}
                    disabled={isCheckingPush || pushNotificationStatus === 'not-supported'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isCheckingPush || pushNotificationStatus === 'not-supported'
                        ? 'bg-border text-text-secondary cursor-not-allowed opacity-50'
                        : 'bg-surface text-text-primary border border-border hover:bg-border hover:border-text-secondary'
                    }`}
                  >
                    <RefreshCw size={14} className={isCheckingPush ? 'animate-spin' : ''} />
                    <span>{isCheckingPush ? 'Checking...' : 'Check/Refresh'}</span>
                  </button>
                </div>
                
                {pushNotificationStatus === 'granted' && (
                  <p className="text-xs text-success mt-2">
                    ✓ Push notifications are enabled. You'll receive alerts when available.
                  </p>
                )}
                {pushNotificationStatus === 'denied' && (
                  <p className="text-xs text-bearish mt-2">
                    ✗ Notifications are blocked. Please enable them in your browser settings.
                  </p>
                )}
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <DollarSign size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Price Alerts</h4>
                    <p className="text-xs text-text-secondary">Alert on significant price changes</p>
                  </div>
                </div>
                <button
                  onClick={() => setPriceAlerts(!priceAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    priceAlerts ? 'bg-bullish' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      priceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {priceAlerts && (
                <div className="mt-3">
                  <label className="text-xs text-text-secondary block mb-2">
                    Alert threshold: {priceAlertThreshold}% change
                  </label>
                  <Slider
                    value={priceAlertThreshold}
                    onChange={(e) => setPriceAlertThreshold(Number(e.target.value))}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
              )}
            </Card>

            <Card padding="md" className="border-border bg-warning/5">
              <div className="flex items-start gap-3">
                <Zap size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-1">Smart Alerts</h4>
                  <p className="text-xs text-text-secondary mb-2">
                    Get notified about market inefficiencies, arbitrage opportunities, and threshold violations
                  </p>
                  <Button variant="ghost" size="sm">
                    Configure Alerts
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="display">
          <div className="space-y-4">
            <Card padding="md" className="border-border">
              <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Monitor size={16} />
                Theme
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 border rounded-lg transition-colors text-center ${
                    theme === 'light'
                      ? 'border-bullish bg-bullish/10'
                      : 'border-border hover:border-bullish'
                  }`}
                >
                  <Sun size={20} className={`mx-auto mb-1 ${theme === 'light' ? 'text-bullish' : 'text-text-secondary'}`} />
                  <p className={`text-xs ${theme === 'light' ? 'text-bullish' : 'text-text-secondary'}`}>Light</p>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 border rounded-lg transition-colors text-center ${
                    theme === 'dark'
                      ? 'border-bullish bg-bullish/10'
                      : 'border-border hover:border-bullish'
                  }`}
                >
                  <Moon size={20} className={`mx-auto mb-1 ${theme === 'dark' ? 'text-bullish' : 'text-text-secondary'}`} />
                  <p className={`text-xs ${theme === 'dark' ? 'text-bullish' : 'text-text-secondary'}`}>Dark</p>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-3 border rounded-lg transition-colors text-center ${
                    theme === 'system'
                      ? 'border-bullish bg-bullish/10'
                      : 'border-border hover:border-bullish'
                  }`}
                >
                  <Monitor size={20} className={`mx-auto mb-1 ${theme === 'system' ? 'text-bullish' : 'text-text-secondary'}`} />
                  <p className={`text-xs ${theme === 'system' ? 'text-bullish' : 'text-text-secondary'}`}>System</p>
                </button>
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Compact View</h4>
                    <p className="text-xs text-text-secondary">Show more markets per page</p>
                  </div>
                </div>
                <button
                  onClick={() => setCompactView(!compactView)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    compactView ? 'bg-bullish' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      compactView ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center gap-3 mb-3">
                <Globe size={18} className="text-text-secondary" />
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Market Categories</h4>
                  <p className="text-xs text-text-secondary">Show category filters</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Enabled</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-bullish`}
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-4">
            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-text-secondary" />
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">API Timeout</h4>
                    <p className="text-xs text-text-secondary">Request timeout in seconds</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Slider
                  value={apiTimeout}
                  onChange={(e) => setApiTimeout(Number(e.target.value))}
                  min={5}
                  max={30}
                  step={5}
                />
                <p className="text-xs text-text-secondary mt-1">{apiTimeout} seconds</p>
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Data Source</h4>
                  <p className="text-xs text-text-secondary">Polymarket Gamma API + CLOB API</p>
                </div>
                <Badge variant="default">Live</Badge>
              </div>
            </Card>

            <Card padding="md" className="border-border">
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-2">Version</h4>
                <p className="text-xs text-text-secondary">PulseForge v1.0.0</p>
                <p className="text-xs text-text-secondary mt-1">Built for NexHacks 2026</p>
              </div>
            </Card>

            <Card padding="md" className="border-border bg-warning/5">
              <div className="flex items-start gap-3">
                <Database size={18} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-1">Developer Options</h4>
                  <p className="text-xs text-text-secondary mb-3">
                    Advanced cache and API settings for debugging
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Cache Size</span>
                    <span className="text-xs font-medium text-text-primary">~500 entries</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Cache TTL</span>
                    <span className="text-xs font-medium text-text-primary">30s - 10min</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleClearCache();
                      window.location.reload();
                    }}
                    className="w-full mt-2"
                  >
                    Clear All & Reload
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-6 pt-4 border-t border-border">
        <Button variant="primary" onClick={handleSave} className="flex-1">
          Save Settings
        </Button>
        <Button variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
