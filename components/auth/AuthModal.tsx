'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, UserPlus, Github } from 'lucide-react';
import { Modal, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useAuth } from '@/context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
  onSignUpSuccess?: () => void; // Callback when sign up is successful (for profile setup)
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin', onSignUpSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        await signIn(email, password);
        onClose();
        window.location.reload(); // Refresh to update UI
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
        onClose();
        
        // Trigger profile setup callback
        if (onSignUpSuccess) {
          onSignUpSuccess();
        } else {
          window.location.reload(); // Fallback to refresh
        }
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
      
      onClose();
      
      // Trigger profile setup for social sign up too
      if (onSignUpSuccess) {
        onSignUpSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(`${provider} sign in failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin" className="flex items-center gap-2">
            <LogIn size={14} />
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex items-center gap-2">
            <UserPlus size={14} />
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">Welcome Back</h2>
            <p className="text-sm text-text-secondary">Sign in to continue to PulseForge</p>
          </div>

          {error && (
            <div className="p-3 bg-bearish/10 border border-bearish/30 rounded-lg text-sm text-bearish">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail size={16} />}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-bullish hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-text-secondary">Or continue with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleSocialSignIn('github')}
            disabled={loading}
          >
            <Github size={16} />
            Sign in with GitHub
          </Button>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">Create Account</h2>
            <p className="text-sm text-text-secondary">Join PulseForge to unlock all features</p>
          </div>

          {error && (
            <div className="p-3 bg-bearish/10 border border-bearish/30 rounded-lg text-sm text-bearish">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                leftIcon={<User size={16} />}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail size={16} />}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                required
                minLength={6}
              />
              <p className="text-xs text-text-secondary mt-1">At least 6 characters</p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary">
              <input type="checkbox" className="rounded border-border mt-0.5" required />
              <span>I agree to the <a href="#" className="text-bullish hover:underline">Terms of Service</a> and <a href="#" className="text-bullish hover:underline">Privacy Policy</a></span>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-text-secondary">Or sign up with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleSocialSignIn('github')}
            disabled={loading}
          >
            <Github size={16} />
            Sign up with GitHub
          </Button>
        </TabsContent>
      </Tabs>
    </Modal>
  );
}
