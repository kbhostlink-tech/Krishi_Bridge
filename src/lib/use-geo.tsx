"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

interface GeoData {
  detected: boolean;
  country: string | null;
  name: string | null;
  flag: string | null;
  locale: string | null;
  currency: string | null;
  timezone: string | null;
  tax: {
    goodsTaxRate: number;
    goodsTaxLabel: string;
    commissionTaxRate: number;
    commissionTaxLabel: string;
    tdsRate: number;
    tdsLabel: string;
  } | null;
  kycRequirements: string[];
  paymentMethods: string[];
}

interface GeoContextType {
  geo: GeoData | null;
  isLoading: boolean;
  switchCountry: (countryCode: string) => void;
  formatCurrency: (amountInr: number, fxRate?: number) => string;
}

const EMPTY_GEO: GeoData = {
  detected: false,
  country: null,
  name: null,
  flag: null,
  locale: null,
  currency: null,
  timezone: null,
  tax: null,
  kycRequirements: [],
  paymentMethods: [],
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  NPR: "रू",
  BTN: "Nu.",
  AED: "د.إ",
  SAR: "﷼",
  OMR: "ر.ع.",
};

const GeoContext = createContext<GeoContextType>({
  geo: null,
  isLoading: true,
  switchCountry: () => {},
  formatCurrency: (amount) => `$${amount.toFixed(2)}`,
});

export function GeoProvider({ children }: { children: ReactNode }) {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const fetchGeo = useCallback(async (countryOverride?: string) => {
    try {
      const url = countryOverride
        ? `/api/geo?country=${encodeURIComponent(countryOverride)}`
        : "/api/geo";
      const res = await fetch(url);
      if (!res.ok) return;
      const data: GeoData = await res.json();
      setGeo(data);

      // Auto-switch locale if detected country suggests a different one
      // Only on first load (not on manual switch)
      if (!countryOverride && data.detected && data.locale && data.locale !== currentLocale) {
        // Don't redirect if user has manually chosen a locale
        const hasManualLocale =
          typeof window !== "undefined" &&
          (localStorage.getItem("manual_locale") || sessionStorage.getItem("manual_locale"));
        if (!hasManualLocale) {
          router.replace(pathname, { locale: data.locale });
        }
      }
    } catch {
      setGeo(EMPTY_GEO);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocale, pathname, router]);

  useEffect(() => {
    fetchGeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCountry = useCallback((countryCode: string) => {
    setIsLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("manual_locale", "true");
      sessionStorage.setItem("manual_locale", "true");
    }
    fetchGeo(countryCode);
  }, [fetchGeo]);

  const formatCurrency = useCallback((amountInr: number, fxRate?: number) => {
    const currencyCode = geo?.currency || "INR";
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    const converted = fxRate ? amountInr * fxRate : amountInr;
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [geo?.currency]);

  return (
    <GeoContext.Provider value={{ geo, isLoading, switchCountry, formatCurrency }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}

