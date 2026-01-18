'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SavedResearch {
  id: string;
  marketId: string;
  marketQuestion: string;
  marketCategory: string;
  yesPrice: number;
  noPrice: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  summary: string;
  recommendation: string;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  savedAt: number;
  notes?: string;
}

const STORAGE_KEY = 'pulseforge_saved_research';
const MAX_SAVED_ITEMS = 50;

/**
 * Hook for managing saved research in localStorage
 */
export function useSavedResearch() {
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedResearch(parsed);
        }
      }
    } catch (error) {
      console.error('[SavedResearch] Failed to load:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever savedResearch changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResearch));
      } catch (error) {
        console.error('[SavedResearch] Failed to save:', error);
      }
    }
  }, [savedResearch, isLoaded]);

  // Save new research
  const saveResearch = useCallback((research: Omit<SavedResearch, 'id' | 'savedAt'>) => {
    const newItem: SavedResearch = {
      ...research,
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
    };

    setSavedResearch((prev) => {
      // Check if already saved (by marketId)
      const exists = prev.some((r) => r.marketId === research.marketId);
      if (exists) {
        // Update existing
        return prev.map((r) =>
          r.marketId === research.marketId ? { ...newItem, id: r.id } : r
        );
      }
      // Add new, limit to MAX_SAVED_ITEMS
      const updated = [newItem, ...prev];
      return updated.slice(0, MAX_SAVED_ITEMS);
    });

    return newItem.id;
  }, []);

  // Remove saved research
  const removeResearch = useCallback((id: string) => {
    setSavedResearch((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Check if a market is saved
  const isMarketSaved = useCallback(
    (marketId: string) => {
      return savedResearch.some((r) => r.marketId === marketId);
    },
    [savedResearch]
  );

  // Get saved research by market ID
  const getByMarketId = useCallback(
    (marketId: string) => {
      return savedResearch.find((r) => r.marketId === marketId) || null;
    },
    [savedResearch]
  );

  // Update notes for saved research
  const updateNotes = useCallback((id: string, notes: string) => {
    setSavedResearch((prev) =>
      prev.map((r) => (r.id === id ? { ...r, notes } : r))
    );
  }, []);

  // Clear all saved research
  const clearAll = useCallback(() => {
    setSavedResearch([]);
  }, []);

  return {
    savedResearch,
    isLoaded,
    saveResearch,
    removeResearch,
    isMarketSaved,
    getByMarketId,
    updateNotes,
    clearAll,
    count: savedResearch.length,
  };
}
