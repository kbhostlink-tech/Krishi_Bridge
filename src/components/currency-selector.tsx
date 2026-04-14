"use client";

import { useCurrency } from "@/lib/use-currency";
import type { CurrencyCode } from "@/generated/prisma/client";

const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "INR", label: "INR (₹)", symbol: "₹" },
  { code: "NPR", label: "NPR (रू)", symbol: "रू" },
  { code: "BTN", label: "BTN (Nu.)", symbol: "Nu." },
  { code: "AED", label: "AED (د.إ)", symbol: "د.إ" },
  { code: "SAR", label: "SAR (﷼)", symbol: "﷼" },
  { code: "OMR", label: "OMR (ر.ع.)", symbol: "ر.ع." },
  { code: "USD", label: "USD ($)", symbol: "$" },
];

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
