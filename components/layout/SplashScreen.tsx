'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Zap, TrendingUp, Activity, Sparkles } from 'lucide-react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Hide splash screen after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50); // Update every 50ms for smooth progress

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
          style={{ zIndex: 99999 }}
        >
          {/* Enhanced animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface/50 to-background">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-bullish/8 via-transparent to-bullish/8"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            />
          </div>

          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-[0.08]">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, var(--bullish) 1px, transparent 1px),
                  linear-gradient(to bottom, var(--bullish) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
              animate={{
                opacity: [0.05, 0.12, 0.05],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Enhanced floating particles with trails */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(25)].map((_, i) => {
              const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
              const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
              const delay = Math.random() * 2;
              const duration = 5 + Math.random() * 3;
              const startX = Math.random() * screenWidth;
              const startY = Math.random() * screenHeight;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-bullish/25 rounded-full blur-[1px]"
                  initial={{
                    x: startX,
                    y: startY,
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: startX + (Math.random() - 0.5) * 300,
                    y: startY + (Math.random() - 0.5) * 300,
                    scale: [0, 1.8, 0],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration,
                    repeat: Infinity,
                    delay,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            transition={{ 
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative flex flex-col items-center gap-7 z-10"
          >
            {/* Enhanced Logo with multiple animation layers */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                duration: 1.3,
                delay: 0.3,
                type: 'spring',
                stiffness: 180,
                damping: 12
              }}
              className="relative"
            >
              {/* Outer glow ring - larger */}
              <motion.div
                className="absolute inset-0 -m-8 rounded-3xl bg-bullish/15 blur-3xl -z-10"
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Middle glow ring */}
              <motion.div
                className="absolute inset-0 -m-6 rounded-3xl bg-bullish/20 blur-2xl -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.7,
                }}
              />
              
              {/* Logo container */}
              <motion.div
                className="relative w-20 h-20 bg-gradient-to-br from-bullish via-bullish-hover to-bullish rounded-3xl flex items-center justify-center shadow-2xl shadow-bullish/50"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {/* Animated icon with subtle movement */}
                <motion.div
                  animate={{ 
                    rotate: [0, 3, -3, 0],
                    scale: [1, 1.03, 1]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <BarChart3 size={44} className="text-white drop-shadow-lg" />
                </motion.div>
                
                {/* Inner shine effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-white/10 to-transparent"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Rotating border glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-bullish/40"
                  animate={{
                    rotate: 360,
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    rotate: {
                      duration: 10,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    opacity: {
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                />
              </motion.div>
              
              {/* Enhanced sparkle effects around logo */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-bullish rounded-full"
                  style={{
                    top: `${50 + 80 * Math.cos((i * Math.PI * 2) / 10)}%`,
                    left: `${50 + 80 * Math.sin((i * Math.PI * 2) / 10)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.8, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>

            {/* App name with smaller, refined typography */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center space-y-2"
            >
              <motion.h1
                className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-bullish via-bullish-hover to-bullish bg-clip-text text-transparent tracking-tight"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                PulseForge
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-xs sm:text-sm text-text-secondary font-medium tracking-wide"
              >
                Prediction Market Strategy & Research
              </motion.p>
            </motion.div>

            {/* Enhanced loading indicator with progress */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 240 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col items-center gap-3 mt-1"
            >
              <div className="relative w-full h-1 bg-border/40 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-bullish via-bullish-hover to-bullish rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap size={16} className="text-bullish" />
                </motion.div>
                <span className="text-[10px] sm:text-xs text-text-secondary font-medium">Loading...</span>
              </div>
            </motion.div>

            {/* Enhanced icon showcase with better animations */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="flex items-center gap-4 mt-2"
            >
              {[
                { Icon: TrendingUp, label: 'Trending' },
                { Icon: Activity, label: 'Live' },
                { Icon: BarChart3, label: 'Analytics' },
              ].map(({ Icon, label }, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 1.4 + i * 0.2,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  whileHover={{ scale: 1.15, y: -8 }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <motion.div
                    className="p-2.5 bg-surface/70 border border-border/40 rounded-xl backdrop-blur-sm group-hover:bg-bullish/10 group-hover:border-bullish/30 transition-all duration-300"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(34, 197, 94, 0)',
                        '0 0 8px rgba(34, 197, 94, 0.2)',
                        '0 0 0px rgba(34, 197, 94, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <Icon size={16} className="text-bullish group-hover:scale-110 transition-transform" />
                  </motion.div>
                  <span className="text-[9px] sm:text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                    {label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
