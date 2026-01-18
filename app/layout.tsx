import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header, Footer, SplashScreen } from '@/components/layout';
import { ToastProvider } from '@/components/ui';
import { StrategyProvider, ThemeProvider, AuthProvider } from '@/context';
import { AuthGuard } from '@/components/auth/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PulseForge - Prediction Market Strategy & Research',
  description:
    'Build multi-market strategies, scan for inefficiencies, and generate AI-powered market briefs for Polymarket.',
  keywords: [
    'polymarket',
    'prediction markets',
    'trading',
    'strategy',
    'research',
    'ai',
    'analysis',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-text-primary`}>
        <SplashScreen />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <StrategyProvider>
                <AuthGuard>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 pt-16">{children}</main>
                    <Footer />
                  </div>
                </AuthGuard>
              </StrategyProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
