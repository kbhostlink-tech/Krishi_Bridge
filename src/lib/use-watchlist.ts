"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agriexchange_watchlist";

function loadInitialWatchlist() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(loadInitialWatchlist);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggle = useCallback((lotId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(lotId)
        ? prev.filter((id) => id !== lotId)
        : [...prev, lotId];
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
