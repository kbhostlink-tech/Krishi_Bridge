"use client";

import { useCurrency } from "@/lib/use-currency";
import { CURRENCY_OPTIONS } from "@/lib/currency-config";
import type { CurrencyCode } from "@/generated/prisma/client";

export function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <select
      value={selectedCurrency}
      onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
      className="h-9 rounded-full border border-sage-200 bg-white px-3 text-sm font-medium text-sage-700 hover:bg-sage-50 focus:outline-none focus:ring-2 focus:ring-sage-500/20 transition-colors"
      aria-label="Select currency"
    >
      {CURRENCY_OPTIONS.map((opt) => (
        <option key={opt.code} value={opt.code}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
