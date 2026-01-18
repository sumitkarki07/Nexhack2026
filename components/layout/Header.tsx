'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, FileText, Menu, Settings, X, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui';
import { useSavedResearch } from '@/hooks';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: savedCount } = useSavedResearch();

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
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface">
              <Settings size={20} />
            </button>

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
    </header>
  );
}
