'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, UserPlus, Github, UserCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useAuth } from '@/context';
import { ProfileSetupModal } from './ProfileSetupModal';
import { BarChart3 } from 'lucide-react';

interface AuthScreenProps {
  onComplete: () => void;
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const { signIn, signUp, updateUserInterests } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        await signIn(email, password);
        onComplete();
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password && name) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        await signUp(name, email, password);
        setLoading(false);
        setProfileSetupOpen(true);
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'github') => {
    setError('');
    setLoading(true);

    try {
      const name = provider === 'github' ? 'GitHub User' : 'User';
      const email = `${provider}@example.com`;
      
      await signUp(name, email, 'social-auth-token');
      setLoading(false);
      setProfileSetupOpen(true);
    } catch (err) {
      setError(`${provider} sign in failed. Please try again.`);
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    if (typeof window !== 'undefined') {
      try {
        // Set guest mode in localStorage FIRST
        localStorage.setItem('pulseforge_guest', 'true');
        
        // Immediately verify it was set (localStorage is synchronous)
        const isGuest = localStorage.getItem('pulseforge_guest') === 'true';
        
        if (isGuest) {
          // Call onComplete which will trigger AuthGuard's handleAuthComplete
          // This ensures proper state management and reload
          onComplete();
        } else {
          console.error('Failed to set guest mode in localStorage');
        }
      } catch (error) {
        console.error('Error setting guest mode:', error);
      }
    }
  };

  const handleProfileSetupComplete = (interests: string[]) => {
    updateUserInterests(interests);
    setProfileSetupOpen(false);
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface/30 to-background px-4 py-8 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-bullish/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-bullish/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-bullish/15 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              scale: 0,
            }}
            animate={{
              y: [null, (Math.random() - 0.5) * 100],
              scale: [0, 1, 0],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--bullish) 1px, transparent 1px),
              linear-gradient(to bottom, var(--bullish) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Enhanced Logo and Branding with Animations */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15, 
              delay: 0.2 
            }}
            className="inline-block mb-6 relative"
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 -m-6 rounded-3xl bg-bullish/20 blur-3xl -z-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Middle glow ring */}
            <motion.div
              className="absolute inset-0 -m-4 rounded-3xl bg-bullish/15 blur-2xl -z-10"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
            
            {/* Logo container */}
            <motion.div
              className="relative w-24 h-24 bg-gradient-to-br from-bullish via-bullish-hover to-bullish rounded-3xl flex items-center justify-center shadow-2xl shadow-bullish/50"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Animated icon with rotation */}
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <BarChart3 size={48} className="text-white drop-shadow-lg" />
              </motion.div>
              
              {/* Inner shine effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 via-white/10 to-transparent"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Rotating border glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-bullish/50"
                animate={{
                  rotate: 360,
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  rotate: {
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
              />
            </motion.div>
            
            {/* Sparkle effects around logo */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-bullish rounded-full"
                style={{
                  top: `${50 + 75 * Math.cos((i * Math.PI * 2) / 8)}%`,
                  left: `${50 + 75 * Math.sin((i * Math.PI * 2) / 8)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-bullish via-bullish-hover to-bullish bg-clip-text text-transparent mb-3 tracking-tight"
          >
            PulseForge
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-sm text-text-secondary font-medium"
          >
            Prediction Market Strategy & Research
          </motion.p>
        </div>

        {/* Enhanced Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-bullish/5 via-transparent to-bullish/5 opacity-50 pointer-events-none" />
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-surface/50">
              <TabsTrigger 
                value="signin" 
                className="flex items-center gap-2 data-[state=active]:bg-bullish/10 data-[state=active]:text-bullish"
              >
                <LogIn size={14} />
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="flex items-center gap-2 data-[state=active]:bg-bullish/10 data-[state=active]:text-bullish"
              >
                <UserPlus size={14} />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-5 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back</h2>
                <p className="text-sm text-text-secondary">Sign in to continue to PulseForge</p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-bearish/10 border border-bearish/30 rounded-xl text-sm text-bearish flex items-center gap-2"
                >
                  <span className="text-bearish">⚠</span>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail size={16} />}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    leftIcon={<Lock size={16} />}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-text-secondary">Remember me</span>
                  </label>
                  <a href="#" className="text-bullish hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-surface text-text-secondary">Or continue with</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full h-11 flex items-center justify-center gap-2 border-border/50 hover:bg-surface/80"
                onClick={() => handleSocialSignIn('github')}
                disabled={loading}
              >
                <Github size={18} />
                Sign in with GitHub
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-text-primary mb-2">Create Account</h2>
                <p className="text-sm text-text-secondary">Join PulseForge to unlock all features</p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-bearish/10 border border-bearish/30 rounded-xl text-sm text-bearish flex items-center gap-2"
                >
                  <span className="text-bearish">⚠</span>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Full Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    leftIcon={<User size={16} />}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail size={16} />}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    leftIcon={<Lock size={16} />}
                    required
                    minLength={6}
                    className="h-11"
                  />
                  <p className="text-xs text-text-secondary">At least 6 characters</p>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary">
                  <input type="checkbox" className="rounded border-border mt-0.5" required />
                  <span>I agree to the <a href="#" className="text-bullish hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-bullish hover:underline font-medium">Privacy Policy</a></span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-surface text-text-secondary">Or sign up with</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full h-11 flex items-center justify-center gap-2 border-border/50 hover:bg-surface/80"
                onClick={() => handleSocialSignIn('github')}
                disabled={loading}
              >
                <Github size={18} />
                Sign up with GitHub
              </Button>
            </TabsContent>
          </Tabs>

          {/* Enhanced Guest Mode Option */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full h-11 flex items-center justify-center gap-2 hover:bg-surface/50"
              onClick={handleGuestMode}
              disabled={loading}
            >
              <UserCircle size={18} />
              Continue as Guest
            </Button>
            <p className="text-xs text-text-secondary text-center mt-3">
              Explore without signing in. Limited features available.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={profileSetupOpen}
        onComplete={handleProfileSetupComplete}
        initialInterests={[]}
      />
    </div>
  );
}
