"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  details: string;
}

interface HealthReport {
  summary: {
    total: number;
    passed: number;
    warned: number;
    failed: number;
    overall: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  };
  checks: CheckResult[];
  checkedAt: string;
}

const STATUS_STYLES = {
  pass: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓", badge: "bg-emerald-100 text-emerald-800" },
  warn: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⚠", badge: "bg-amber-100 text-amber-800" },
  fail: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "✗", badge: "bg-red-100 text-red-800" },
};

const OVERALL_STYLES = {
  HEALTHY: "bg-emerald-100 text-emerald-800",
  DEGRADED: "bg-amber-100 text-amber-800",
  UNHEALTHY: "bg-red-100 text-red-800",
};

export default function IntegrationPage() {
  const { accessToken } = useAuth();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/integration-check", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }

      const data: HealthReport = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integration Health Check</h1>
          <p className="text-sage-400 mt-1">
            Verify all platform subsystems: database, auctions, RFQ, payments, tokens, FX, taxes, geo-compliance.
          </p>
        </div>
        <Button
          onClick={runChecks}
          disabled={isLoading}
          className="bg-sage-600 hover:bg-sage-500 text-white rounded-full px-6"
        >
          {isLoading ? "Running..." : "Run Health Check"}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-800 rounded-2xl">
          <CardContent className="p-4 text-red-300">
            Error: {error}
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          {/* Summary */}
          <Card className="bg-sage-800/50 border-sage-700 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className={`text-lg px-4 py-1.5 ${OVERALL_STYLES[report.summary.overall]}`}>
                    {report.summary.overall}
                  </Badge>
                  <div className="text-sage-200">
                    <span className="text-emerald-400 font-semibold">{report.summary.passed} passed</span>
                    {report.summary.warned > 0 && (
                      <span className="ml-3 text-amber-400 font-semibold">{report.summary.warned} warnings</span>
                    )}
                    {report.summary.failed > 0 && (
                      <span className="ml-3 text-red-400 font-semibold">{report.summary.failed} failed</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-sage-500">
                  {new Date(report.checkedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Individual Checks */}
          <div className="space-y-3">
            {report.checks.map((check, i) => {
              const style = STATUS_STYLES[check.status];
              return (
                <Card
                  key={i}
                  className={`${style.bg} ${style.border} border rounded-2xl`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-lg font-bold ${style.text}`}>
                        {style.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold ${style.text}`}>
                            {check.name}
                          </h3>
                          <Badge className={style.badge}>
                            {check.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {check.details}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!report && !isLoading && (
        <Card className="bg-sage-800/30 border-sage-700 rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="mb-4 flex justify-center"><Link2 className="w-10 h-10 text-sage-300" /></div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Integration Health Check
            </h3>
            <p className="text-sage-400 max-w-md mx-auto">
              Run a comprehensive check of all platform subsystems to verify the auction flow, RFQ flow, payment system, token system, and geo-compliance are working correctly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
