import type { CountryCode, CurrencyCode } from "@/generated/prisma/client";

// ─── TAX RULES PER COUNTRY ──────────────────
// India:   goodsTax = 5% (GST), commissionTax = 18% (GST), TDS = 1%
// Nepal:   goodsTax = 13% (VAT), commissionTax = 13% (VAT), TDS = 1.5%
// Bhutan:  goodsTax = 5% (Sales Tax), commissionTax = 5% (BST)
// UAE:     goodsTax = 5% (VAT), commissionTax = 5% (VAT)
// KSA:     goodsTax = 5% (VAT), commissionTax = 5% (VAT)
// Oman:    goodsTax = 0%, commissionTax = 0%

export interface TaxRules {
  countryCode: CountryCode;
  goodsTaxRate: number;      // e.g. 0.05 = 5%
  commissionTaxRate: number; // e.g. 0.18 = 18%
  tdsRate: number;           // e.g. 0.01 = 1%
  goodsTaxLabel: string;     // e.g. "GST"
  commissionTaxLabel: string;
  tdsLabel: string;
  currency: CurrencyCode;
}

const TAX_RULES: Record<CountryCode, TaxRules> = {
  IN: {
    countryCode: "IN",
    goodsTaxRate: 0.05,
    commissionTaxRate: 0.18,
    tdsRate: 0.01,
    goodsTaxLabel: "GST (5%)",
    commissionTaxLabel: "GST on Commission (18%)",
    tdsLabel: "TDS (1%)",
    currency: "INR",
  },
  NP: {
    countryCode: "NP",
    goodsTaxRate: 0.13,
    commissionTaxRate: 0.13,
    tdsRate: 0.015,
    goodsTaxLabel: "VAT (13%)",
    commissionTaxLabel: "VAT on Commission (13%)",
    tdsLabel: "TDS (1.5%)",
    currency: "NPR",
  },
  BT: {
    countryCode: "BT",
    goodsTaxRate: 0.05,
    commissionTaxRate: 0.05,
    tdsRate: 0,
    goodsTaxLabel: "Sales Tax (5%)",
    commissionTaxLabel: "BST (5%)",
    tdsLabel: "",
    currency: "BTN",
  },
  AE: {
    countryCode: "AE",
    goodsTaxRate: 0.05,
    commissionTaxRate: 0.05,
    tdsRate: 0,
    goodsTaxLabel: "VAT (5%)",
    commissionTaxLabel: "VAT on Commission (5%)",
    tdsLabel: "",
    currency: "AED",
  },
  SA: {
    countryCode: "SA",
    goodsTaxRate: 0.05,
    commissionTaxRate: 0.05,
    tdsRate: 0,
    goodsTaxLabel: "VAT (5%)",
    commissionTaxLabel: "VAT on Commission (5%)",
    tdsLabel: "",
    currency: "SAR",
  },
  OM: {
    countryCode: "OM",
    goodsTaxRate: 0,
    commissionTaxRate: 0,
    tdsRate: 0,
    goodsTaxLabel: "",
    commissionTaxLabel: "",
    tdsLabel: "",
    currency: "OMR",
  },
};

const COMMISSION_RATE = 0.02; // 2% platform commission

export function getTaxRules(countryCode: CountryCode): TaxRules {
  return TAX_RULES[countryCode];
}

export function getDefaultCurrency(countryCode: CountryCode): CurrencyCode {
  return TAX_RULES[countryCode].currency;
}

export interface TaxBreakdown {
  grossAmountInr: number;
  commissionRate: number;
  commissionAmount: number;
  taxOnGoods: number;
  taxOnCommission: number;
  tds: number;
  netToSeller: number;
  totalBuyerPays: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

/**
 * Calculate full tax breakdown for a transaction.
 * All amounts are in INR (base currency). Convert to local currency at display time.
 *
 * Formula:
 *   commission = grossAmount × commissionRate
 *   taxOnGoods = grossAmount × goodsTaxRate
 *   taxOnCommission = commission × commissionTaxRate
 *   tds = grossAmount × tdsRate
 *   totalBuyerPays = grossAmount + taxOnGoods + taxOnCommission
 *   netToSeller = grossAmount - commission - tds
 */
export function calculateTaxBreakdown(
  grossAmountInr: number,
  countryCode: CountryCode
): TaxBreakdown {
  const rules = getTaxRules(countryCode);

  const commission = round(grossAmountInr * COMMISSION_RATE);
  const taxOnGoods = round(grossAmountInr * rules.goodsTaxRate);
  const taxOnCommission = round(commission * rules.commissionTaxRate);
  const tds = round(grossAmountInr * rules.tdsRate);
  const totalBuyerPays = round(grossAmountInr + taxOnGoods + taxOnCommission);
  const netToSeller = round(grossAmountInr - commission - tds);

  const breakdown: { label: string; amount: number }[] = [
    { label: "Base Amount", amount: grossAmountInr },
    { label: `Platform Commission (${COMMISSION_RATE * 100}%)`, amount: commission },
  ];

  if (rules.goodsTaxRate > 0) {
    breakdown.push({ label: rules.goodsTaxLabel, amount: taxOnGoods });
  }
  if (rules.commissionTaxRate > 0) {
    breakdown.push({ label: rules.commissionTaxLabel, amount: taxOnCommission });
  }
  if (rules.tdsRate > 0) {
    breakdown.push({ label: rules.tdsLabel, amount: tds });
  }

  breakdown.push({ label: "Total (Buyer Pays)", amount: totalBuyerPays });
  breakdown.push({ label: "Net to Seller", amount: netToSeller });

  return {
    grossAmountInr,
    commissionRate: COMMISSION_RATE,
    commissionAmount: commission,
    taxOnGoods,
    taxOnCommission,
    tds,
    netToSeller,
    totalBuyerPays,
    breakdown,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
