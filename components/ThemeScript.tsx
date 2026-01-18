'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    // This runs on client-side after hydration
    // The inline script in layout.tsx handles initial load
  }, []);

  // This component doesn't render anything
  return null;
}
