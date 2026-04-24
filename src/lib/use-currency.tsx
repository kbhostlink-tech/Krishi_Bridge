"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import type { CurrencyCode } from "@/generated/prisma/client";
import { BASE_CURRENCY, CURRENCY_INFO, FALLBACK_RATES } from "@/lib/currency-config";

interface CurrencyContextType {
  /** User's selected display currency */
  selectedCurrency: CurrencyCode;
  /** Set the user's display currency */
  setSelectedCurrency: (c: CurrencyCode) => void;
  /** FX rates map: CurrencyCode → rate (INR → X) */
  rates: Record<string, number>;
  /** Whether rates are still loading */
  isLoading: boolean;
  /** Convert INR amount to selected currency for display */
  display: (amountInr: number) => string;
  /** Convert INR amount to a specific currency for display */
  displayAs: (amountInr: number, currency: CurrencyCode) => string;
  /** Convert from user's selected currency to INR */
  toInr: (localAmount: number) => number;
  /** Convert from a specific currency to INR */
  toInrFrom: (amount: number, fromCurrency: CurrencyCode) => number;
  /** Convert INR to user's selected currency (numeric) */
  fromInr: (amountInr: number) => number;
  /** Convert INR to a specific currency (numeric) */
  fromInrTo: (amountInr: number, currency: CurrencyCode) => number;
  /** Get symbol for a currency */
  getSymbol: (currency: CurrencyCode) => string;
  /** Base currency constant */
  baseCurrency: CurrencyCode;
}

const CurrencyContext = createContext<CurrencyContextType>({
  selectedCurrency: "INR",
  setSelectedCurrency: () => {},
  rates: { ...FALLBACK_RATES },
  isLoading: true,
  display: (amount) => `₹${amount.toFixed(2)}`,
  displayAs: (amount) => `₹${amount.toFixed(2)}`,
  toInr: (amount) => amount,
  toInrFrom: (amount) => amount,
  fromInr: (amount) => amount,
  fromInrTo: (amount) => amount,
  getSymbol: () => "₹",
  baseCurrency: "INR",
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>("INR");
  const [rates, setRates] = useState<Record<string, number>>({ ...FALLBACK_RATES });
  const [isLoading, setIsLoading] = useState(true);

  // Load selected currency from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hce_currency");
      if (saved && saved in CURRENCY_INFO) {
        setSelectedCurrencyState(saved as CurrencyCode);
      }
    }
  }, []);

  // Fetch FX rates from API
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/fx-rates");
        if (res.ok) {
          const data = await res.json();
          if (data?.rates) {
            setRates(data.rates);
          }
        }
      } catch {
        console.warn("[Currency] Failed to fetch FX rates, using defaults");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();

    // Refresh rates every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setSelectedCurrency = useCallback((c: CurrencyCode) => {
    setSelectedCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("hce_currency", c);
    }
  }, []);

  const convertFromInr = useCallback((amountInr: number, toCurrency: CurrencyCode): number => {
    if (toCurrency === BASE_CURRENCY) return amountInr;
    const rate = rates[toCurrency] ?? FALLBACK_RATES[toCurrency] ?? 1;
    return Math.round(amountInr * rate * 100) / 100;
  }, [rates]);

  const convertToInr = useCallback((amount: number, fromCurrency: CurrencyCode): number => {
    if (fromCurrency === BASE_CURRENCY) return amount;
    const rate = rates[fromCurrency] ?? FALLBACK_RATES[fromCurrency] ?? 1;
    if (rate <= 0) return amount;
    return Math.round((amount / rate) * 100) / 100;
  }, [rates]);

  const formatAmount = useCallback((amount: number, currency: CurrencyCode): string => {
    const info = CURRENCY_INFO[currency] || CURRENCY_INFO.INR;
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    });
    return `${info.symbol}${formatted}`;
  }, []);

  const display = useCallback((amountInr: number): string => {
    const converted = convertFromInr(amountInr, selectedCurrency);
    return formatAmount(converted, selectedCurrency);
  }, [selectedCurrency, convertFromInr, formatAmount]);

  const displayAs = useCallback((amountInr: number, currency: CurrencyCode): string => {
    const converted = convertFromInr(amountInr, currency);
    return formatAmount(converted, currency);
  }, [convertFromInr, formatAmount]);

  const getSymbol = useCallback((currency: CurrencyCode): string => {
    return CURRENCY_INFO[currency]?.symbol || currency;
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        rates,
        isLoading,
        display,
        displayAs,
        toInr: (amount) => convertToInr(amount, selectedCurrency),
        toInrFrom: convertToInr,
        fromInr: (amountInr) => convertFromInr(amountInr, selectedCurrency),
        fromInrTo: convertFromInr,
        getSymbol,
        baseCurrency: BASE_CURRENCY,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

