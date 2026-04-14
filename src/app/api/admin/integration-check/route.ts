import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkRole } from "@/lib/auth";
import { getTaxRules, getDefaultCurrency, calculateTaxBreakdown } from "@/lib/tax-engine";
import { getCountryConfig, getAllCountryConfigs } from "@/lib/geo";
import type { CountryCode } from "@/generated/prisma/client";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  details: string;
}

// GET /api/admin/integration-check — Run comprehensive integration health checks
// Admin only — validates all platform subsystems are connected and functional
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = checkRole(authResult, ["ADMIN"]);
    if (roleCheck) return roleCheck;

    const checks: CheckResult[] = [];

    // ─── 1. Database Connectivity ──────────────────
    try {
      const userCount = await prisma.user.count();
      checks.push({
        name: "Database Connection",
        status: "pass",
        details: `Connected. ${userCount} users in database.`,
      });
    } catch (e) {
      checks.push({
        name: "Database Connection",
        status: "fail",
        details: `Failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
    }

    // ─── 2. Schema Integrity ───────────────────────
    try {
      const [lots, bids, rfqs, transactions, tokens, fxRates, notifications] = await Promise.all([
        prisma.lot.count(),
        prisma.bid.count(),
        prisma.rfqRequest.count(),
        prisma.transaction.count(),
        prisma.token.count(),
        prisma.fxRate.count(),
        prisma.notification.count(),
      ]);
      checks.push({
        name: "Schema Integrity",
        status: "pass",
        details: `All models accessible. Lots: ${lots}, Bids: ${bids}, RFQs: ${rfqs}, Transactions: ${transactions}, Tokens: ${tokens}, FX Rates: ${fxRates}, Notifications: ${notifications}`,
      });
    } catch (e) {
      checks.push({
        name: "Schema Integrity",
        status: "fail",
        details: `Model access failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 3. Auction Flow Integrity ─────────────────
    try {
      const soldLots = await prisma.lot.count({ where: { status: "SOLD" } });
      const wonBids = await prisma.bid.count({ where: { status: "WON" } });
      const auctionActiveLots = await prisma.lot.count({ where: { status: "AUCTION_ACTIVE" } });

      // Check that every SOLD lot has a WON bid
      const soldWithoutWinner = await prisma.lot.count({
        where: {
          status: "SOLD",
          bids: { none: { status: "WON" } },
        },
      });

      if (soldWithoutWinner > 0) {
        checks.push({
          name: "Auction Flow",
          status: "warn",
          details: `${soldWithoutWinner} SOLD lots have no WON bid. Active auctions: ${auctionActiveLots}. Total sold: ${soldLots}, Won bids: ${wonBids}.`,
        });
      } else {
        checks.push({
          name: "Auction Flow",
          status: "pass",
          details: `Active auctions: ${auctionActiveLots}. Sold: ${soldLots}. Won bids: ${wonBids}. All SOLD lots have winners.`,
        });
      }
    } catch (e) {
      checks.push({
        name: "Auction Flow",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 4. RFQ Flow Integrity ─────────────────────
    try {
      const openRfqs = await prisma.rfqRequest.count({ where: { status: "OPEN" } });
      const acceptedRfqs = await prisma.rfqRequest.count({ where: { status: "ACCEPTED" } });
      const totalResponses = await prisma.rfqResponse.count();
      const totalNegotiations = await prisma.rfqNegotiation.count();

      // Check that ACCEPTED RFQs have an ACCEPTED response
      const acceptedWithoutResponse = await prisma.rfqRequest.count({
        where: {
          status: "ACCEPTED",
          responses: { none: { status: "ACCEPTED" } },
        },
      });

      if (acceptedWithoutResponse > 0) {
        checks.push({
          name: "RFQ Flow",
          status: "warn",
          details: `${acceptedWithoutResponse} ACCEPTED RFQs missing ACCEPTED response. Open: ${openRfqs}, Accepted: ${acceptedRfqs}, Responses: ${totalResponses}, Negotiations: ${totalNegotiations}.`,
        });
      } else {
        checks.push({
          name: "RFQ Flow",
          status: "pass",
          details: `Open: ${openRfqs}, Accepted: ${acceptedRfqs}, Responses: ${totalResponses}, Negotiations: ${totalNegotiations}.`,
        });
      }
    } catch (e) {
      checks.push({
        name: "RFQ Flow",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 5. Payment/Transaction Integrity ──────────
    try {
      const pendingTxns = await prisma.transaction.count({ where: { status: "PENDING" } });
      const completedTxns = await prisma.transaction.count({ where: { status: "COMPLETED" } });
      const failedTxns = await prisma.transaction.count({ where: { status: "FAILED" } });

      // Check for stale PENDING transactions (older than 24 hours)
      const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stalePending = await prisma.transaction.count({
        where: {
          status: "PENDING",
          createdAt: { lt: staleDate },
        },
      });

      if (stalePending > 0) {
        checks.push({
          name: "Payment System",
          status: "warn",
          details: `${stalePending} stale PENDING transactions (>24h). Completed: ${completedTxns}, Pending: ${pendingTxns}, Failed: ${failedTxns}.`,
        });
      } else {
        checks.push({
          name: "Payment System",
          status: "pass",
          details: `Completed: ${completedTxns}, Pending: ${pendingTxns}, Failed: ${failedTxns}.`,
        });
      }
    } catch (e) {
      checks.push({
        name: "Payment System",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 6. Token System Integrity ─────────────────
    try {
      const activeTokens = await prisma.token.count({ where: { status: "ACTIVE" } });
      const redeemedTokens = await prisma.token.count({ where: { status: "REDEEMED" } });
      const expiredTokens = await prisma.token.count({ where: { status: "EXPIRED" } });
      const totalTransfers = await prisma.tokenTransfer.count();

      // Check for ACTIVE tokens past expiry
      const expiredActive = await prisma.token.count({
        where: {
          status: "ACTIVE",
          expiresAt: { lt: new Date() },
        },
      });

      if (expiredActive > 0) {
        checks.push({
          name: "Token System",
          status: "warn",
          details: `${expiredActive} ACTIVE tokens past expiry (cron may need to run). Active: ${activeTokens}, Redeemed: ${redeemedTokens}, Expired: ${expiredTokens}, Transfers: ${totalTransfers}.`,
        });
      } else {
        checks.push({
          name: "Token System",
          status: "pass",
          details: `Active: ${activeTokens}, Redeemed: ${redeemedTokens}, Expired: ${expiredTokens}, Transfers: ${totalTransfers}.`,
        });
      }
    } catch (e) {
      checks.push({
        name: "Token System",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 7. FX Rate Freshness ──────────────────────
    try {
      const rates = await prisma.fxRate.findMany({
        select: { fromCurrency: true, toCurrency: true, rate: true, fetchedAt: true },
      });

      if (rates.length === 0) {
        checks.push({
          name: "FX Rates",
          status: "warn",
          details: "No FX rates in database. Run /api/cron/fx-sync to initialize.",
        });
      } else {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const staleRates = rates.filter((r) => r.fetchedAt < sixHoursAgo);

        if (staleRates.length > 0) {
          checks.push({
            name: "FX Rates",
            status: "warn",
            details: `${staleRates.length}/${rates.length} rates stale (>6h). Latest fetch: ${rates[0].fetchedAt.toISOString()}.`,
          });
        } else {
          checks.push({
            name: "FX Rates",
            status: "pass",
            details: `${rates.length} currency pairs synced. Latest: ${rates[0].fetchedAt.toISOString()}.`,
          });
        }
      }
    } catch (e) {
      checks.push({
        name: "FX Rates",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 8. Tax Engine Verification ────────────────
    try {
      const countries: CountryCode[] = ["IN", "NP", "BT", "AE", "SA", "OM"];
      const taxResults: string[] = [];

      for (const cc of countries) {
        const rules = getTaxRules(cc);
        const currency = getDefaultCurrency(cc);
        const config = getCountryConfig(cc);
        const breakdown = calculateTaxBreakdown(100, cc);

        // Validate calculated values are reasonable
        if (breakdown.totalBuyerPays <= 0 || breakdown.netToSeller <= 0) {
          throw new Error(`Invalid tax calculation for ${cc}`);
        }

        taxResults.push(`${cc}: ${currency} | buyer pays $${breakdown.totalBuyerPays} | seller gets $${breakdown.netToSeller}`);
      }

      checks.push({
        name: "Tax Engine",
        status: "pass",
        details: `All 6 countries validated. ${taxResults.join("; ")}`,
      });
    } catch (e) {
      checks.push({
        name: "Tax Engine",
        status: "fail",
        details: `Tax calculation error: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 9. Geo-Compliance ─────────────────────────
    try {
      const configs = getAllCountryConfigs();
      const issues: string[] = [];

      for (const config of configs) {
        if (!config.kycDocuments.length) issues.push(`${config.countryCode}: no KYC docs`);
        if (!config.paymentMethods.length) issues.push(`${config.countryCode}: no payment methods`);
      }

      if (issues.length > 0) {
        checks.push({
          name: "Geo-Compliance",
          status: "warn",
          details: `Issues: ${issues.join(", ")}. ${configs.length} countries configured.`,
        });
      } else {
        checks.push({
          name: "Geo-Compliance",
          status: "pass",
          details: `${configs.length} countries fully configured with KYC docs, payment methods, and tax rules.`,
        });
      }
    } catch (e) {
      checks.push({
        name: "Geo-Compliance",
        status: "fail",
        details: `Check failed: ${e instanceof Error ? e.message : "Unknown"}`,
      });
    }

    // ─── 10. Environment Variables ─────────────────
    {
      const required: { name: string; present: boolean }[] = [
        { name: "DATABASE_URL", present: !!process.env.DATABASE_URL },
        { name: "JWT_SECRET", present: !!process.env.JWT_SECRET },
        { name: "REFRESH_SECRET", present: !!process.env.REFRESH_SECRET },
        { name: "CRON_SECRET", present: !!process.env.CRON_SECRET },
        { name: "TOKEN_HMAC_SECRET", present: !!process.env.TOKEN_HMAC_SECRET },
      ];

      const optional: { name: string; present: boolean }[] = [
        { name: "R2_ACCESS_KEY_ID", present: !!process.env.R2_ACCESS_KEY_ID },
        { name: "RESEND_API_KEY", present: !!process.env.RESEND_API_KEY },
        { name: "EXCHANGE_RATE_API_KEY", present: !!process.env.EXCHANGE_RATE_API_KEY },
        { name: "RAZORPAY_KEY_SECRET", present: !!process.env.RAZORPAY_KEY_SECRET },
        { name: "STRIPE_SECRET_KEY", present: !!process.env.STRIPE_SECRET_KEY },
        { name: "TAP_SECRET_KEY", present: !!process.env.TAP_SECRET_KEY },
      ];

      const missingRequired = required.filter((e) => !e.present).map((e) => e.name);
      const missingOptional = optional.filter((e) => !e.present).map((e) => e.name);

      if (missingRequired.length > 0) {
        checks.push({
          name: "Environment Variables",
          status: "fail",
          details: `Missing required: ${missingRequired.join(", ")}. Missing optional: ${missingOptional.join(", ") || "none"}.`,
        });
      } else if (missingOptional.length > 0) {
        checks.push({
          name: "Environment Variables",
          status: "warn",
          details: `All required present. Missing optional: ${missingOptional.join(", ")}.`,
        });
      } else {
        checks.push({
          name: "Environment Variables",
          status: "pass",
          details: "All required and optional environment variables are set.",
        });
      }
    }

    // ─── Summary ───────────────────────────────────
    const passed = checks.filter((c) => c.status === "pass").length;
    const warned = checks.filter((c) => c.status === "warn").length;
    const failed = checks.filter((c) => c.status === "fail").length;

    return NextResponse.json({
      summary: {
        total: checks.length,
        passed,
        warned,
        failed,
        overall: failed > 0 ? "UNHEALTHY" : warned > 0 ? "DEGRADED" : "HEALTHY",
      },
      checks,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[INTEGRATION_CHECK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
