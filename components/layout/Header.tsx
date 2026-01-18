'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, FileText, Menu, Settings, X, Bookmark, LogIn, User, LogOut, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, SettingsModal, Button } from '@/components/ui';
import { useSavedResearch } from '@/hooks';
import { useAuth } from '@/context';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileSetupModal } from '@/components/auth/ProfileSetupModal';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup'); // Default to signup
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { count: savedCount } = useSavedResearch();
  const { user, isAuthenticated, signOut, updateUserInterests } = useAuth();

  // Check for guest mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const guest = localStorage.getItem('pulseforge_guest');
      setIsGuest(!!guest);
    }
    
    // Listen for storage changes (e.g., when signing out)
    const handleStorageChange = () => {
      const guest = localStorage.getItem('pulseforge_guest');
      setIsGuest(!!guest);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hide auth buttons when authenticated or in guest mode
  const showAuthButtons = !isAuthenticated && !isGuest;

  const navItems = [
    { href: '/', label: 'Markets', icon: Activity },
    { href: '/research', label: 'Research', icon: FileText, badge: savedCount > 0 ? savedCount : null },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-bullish to-bullish-hover rounded-lg flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary group-hover:text-bullish transition-colors">
              PulseForge
            </span>
            <Badge variant="live" size="sm" className="hidden sm:flex">
              LIVE
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon, badge }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-surface border border-border rounded-lg"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} />
                    {label}
                    {badge && (
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-bullish text-white rounded-full min-w-[18px] text-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {showAuthButtons ? (
              // Show Sign Up/Sign In only when not authenticated and not guest
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  Sign Up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <LogIn size={14} />
                  Sign In
                </Button>
              </div>
            ) : (
              // Show user menu when authenticated or in guest mode
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
                >
                  <div className="w-8 h-8 bg-bullish/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-bullish" />
                  </div>
                  <span className="hidden sm:inline">
                    {isAuthenticated ? (user?.name || 'User') : 'Guest'}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-20 py-1"
                    >
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-xs text-text-secondary">
                          {isAuthenticated ? 'Signed in as' : 'Guest mode'}
                        </p>
                        <p className="text-sm font-medium text-text-primary truncate">
                          {isAuthenticated ? (user?.email || 'User') : 'Anonymous User'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSettingsOpen(true);
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                          setIsGuest(false);
                          // Redirect to home to show auth screen
                          window.location.href = '/';
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-bearish hover:bg-surface transition-colors"
                      >
                        <LogOut size={14} />
                        {isAuthenticated ? 'Sign Out' : 'Exit Guest Mode'}
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="px-4 py-4 space-y-1">
              {showAuthButtons && (
                <div className="px-4 py-3 space-y-2 border-b border-border mb-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setAuthModalTab('signup');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <UserPlus size={14} />
                    Sign Up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAuthModalTab('signin');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <LogIn size={14} />
                    Sign In
                  </Button>
                </div>
              )}
              {navItems.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? 'bg-surface text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}
                    `}
                  >
                    <Icon size={18} />
                    {label}
                    {badge && (
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-bullish text-white rounded-full min-w-[18px] text-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onSignUpSuccess={() => {
          setAuthModalOpen(false);
          setProfileSetupOpen(true);
        }}
      />

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={profileSetupOpen}
        onComplete={(interests) => {
          updateUserInterests(interests);
          setProfileSetupOpen(false);
          window.location.reload(); // Refresh to show filtered markets
        }}
        initialInterests={user?.interests}
      />
    </header>
  );
}
