"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agriexchange_watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setWatchlist(JSON.parse(stored));
    } catch {
      // corrupted data — reset
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const toggle = useCallback((lotId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(lotId)
        ? prev.filter((id) => id !== lotId)
        : [...prev, lotId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatchlisted = useCallback(
    (lotId: string) => watchlist.includes(lotId),
    [watchlist]
  );

  const clear = useCallback(() => {
    setWatchlist([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { watchlist, toggle, isWatchlisted, clear };
}
