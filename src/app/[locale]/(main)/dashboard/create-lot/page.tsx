"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommodityIcon } from "@/lib/commodity-icons";
import { CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "NPR", symbol: "रू", label: "NPR (रू)" },
  { code: "BTN", symbol: "Nu.", label: "BTN (Nu.)" },
  { code: "AED", symbol: "د.إ", label: "AED (د.إ)" },
  { code: "SAR", symbol: "﷼", label: "SAR (﷼)" },
  { code: "OMR", symbol: "ر.ع.", label: "OMR (ر.ع.)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
];

// Map country → default currency
const COUNTRY_CURRENCY: Record<string, string> = {
  IN: "INR", NP: "NPR", BT: "BTN", AE: "AED", SA: "SAR", OM: "OMR",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

interface Submission {
  id: string;
  commodityType: string;
  grade: string;
  variety: string | null;
  quantityKg: number;
  numberOfBags: number | null;
  bagWeight: number | null;
  packagingType: string | null;
  description: string | null;
  origin: { country: string; state: string; district: string; village?: string };
  harvestYear: number | null;
  harvestMonth: string | null;
  harvestSeason: string | null;
  moistureRange: string | null;
  colourAroma: string | null;
  tailCut: string | null;
  sellerDeclaration: string | null;
  labReportUrl: string | null;
  phytosanitaryUrl: string | null;
  originCertUrl: string | null;
  images: string[];
  videos: string[];
  status: string;
}

export default function CreateLotPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state — lot-specific fields (commodity data comes from submission)
  const [description, setDescription] = useState("");
  const [listingMode, setListingMode] = useState("AUCTION");
  const [startingPriceInr, setStartingPriceInr] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("INR");
  const [reservePriceInr, setReservePriceInr] = useState("");
  const [reserveCurrency, setReserveCurrency] = useState("INR");
  const [auctionStartsAt, setAuctionStartsAt] = useState("");
  const [auctionEndsAt, setAuctionEndsAt] = useState("");

  const fetchSubmission = useCallback(async () => {
    if (!accessToken || !submissionId) return;
    try {
      const res = await fetch(`/api/commodity-submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch submission");
      const data = await res.json();
      const sub = data.submission;

      if (sub.status !== "APPROVED") {
        toast.error("Only approved submissions can be converted to lots");
        router.push("/dashboard/my-submissions");
        return;
      }

      setSubmission(sub);
      setDescription(sub.description || "");

      // Auto-detect currency from submission origin country
      const originCountry = sub.origin?.country || "";
      const defaultCurrency = COUNTRY_CURRENCY[originCountry] || "INR";
      setPriceCurrency(defaultCurrency);
      setReserveCurrency(defaultCurrency);
    } catch {
      toast.error("Could not load submission");
      router.push("/dashboard/my-submissions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, submissionId, router]);

  useEffect(() => {
    if (!submissionId) {
      toast.error("No submission specified");
      router.push("/dashboard/my-submissions");
      return;
    }
    fetchSubmission();
  }, [submissionId, fetchSubmission, router]);

  const { toInrFrom } = useCurrency();

  const handleCreate = async () => {
    if (!submission || !accessToken) return;

    // Validate auction fields when mode requires it
    if ((listingMode === "AUCTION" || listingMode === "BOTH") && !startingPriceInr) {
      toast.error("Starting price is required for auction listings");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        commodityType: submission.commodityType,
        grade: submission.grade,
        quantityKg: submission.quantityKg,
        description,
        origin: submission.origin,
        listingMode,
        submissionId: submission.id,
      };

      const res = await fetch("/api/lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create lot");
      }

      const { lot } = await res.json();
      toast.success(`Lot ${lot.lotNumber} created as draft`);

      // If auction/both mode, publish immediately with pricing
      // Convert user-entered price from their selected currency to INR (base)
      if (listingMode === "AUCTION" || listingMode === "BOTH") {
        const startPriceLocal = parseFloat(startingPriceInr);
        const startPriceInr = toInrFrom(startPriceLocal, priceCurrency as Parameters<typeof toInrFrom>[1]);
        const publishBody: Record<string, unknown> = {
          listingMode,
          startingPriceInr: startPriceInr,
        };
        if (reservePriceInr) {
          const reserveLocal = parseFloat(reservePriceInr);
          publishBody.reservePriceInr = toInrFrom(reserveLocal, reserveCurrency as Parameters<typeof toInrFrom>[1]);
        }
        if (auctionStartsAt) publishBody.auctionStartsAt = new Date(auctionStartsAt).toISOString();
        if (auctionEndsAt) publishBody.auctionEndsAt = new Date(auctionEndsAt).toISOString();

        const pubRes = await fetch(`/api/lots/${lot.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(publishBody),
        });

        if (pubRes.ok) {
          toast.success("Lot submitted for admin approval");
        } else {
          toast.info("Lot created as draft — you can publish it from My Lots");
        }
      } else if (listingMode === "RFQ") {
        // For RFQ-only, publish without auction fields
        const pubRes = await fetch(`/api/lots/${lot.id}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ listingMode: "RFQ" }),
        });

        if (pubRes.ok) {
          toast.success("Lot submitted for admin approval");
        } else {
          toast.info("Lot created as draft — you can publish it from My Lots");
        }
      }

      router.push("/dashboard/my-lots");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create lot");
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-80 rounded skeleton-shimmer" />
          </div>
          <div className="h-8 w-24 rounded skeleton-shimmer" />
        </div>
        <div className="h-36 rounded-3xl skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!submission) return null;

  const needsAuction = listingMode === "AUCTION" || listingMode === "BOTH";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-sage-900">Create Lot from Submission</h1>
          <p className="text-sage-500 text-sm mt-1">
            Your approved commodity submission is ready to become a marketplace listing.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/my-submissions")}
          className="text-sm text-sage-500 hover:text-sage-700 transition-colors"
        >
          ← Back to Submissions
        </button>
      </div>

      {/* Submission Summary */}
      <Card className="rounded-3xl border-sage-100 bg-white/80 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-50 flex items-center justify-center">
              <CommodityIcon type={submission.commodityType} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-heading font-bold text-sage-900">
                  {COMMODITY_LABELS[submission.commodityType] || submission.commodityType}
                </h2>
                <Badge className="bg-sage-100 text-sage-700 text-xs">{submission.grade}</Badge>
                {submission.variety && (
                  <Badge variant="outline" className="text-xs">{submission.variety}</Badge>
                )}
                <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div>
                  <span className="text-sage-400">Quantity</span>
                  <p className="font-semibold text-sage-800">{submission.quantityKg} kg</p>
                </div>
                <div>
                  <span className="text-sage-400">Origin</span>
                  <p className="font-semibold text-sage-800">
                    {submission.origin.district}, {submission.origin.state}
                  </p>
                </div>
                {submission.numberOfBags && (
                  <div>
                    <span className="text-sage-400">Bags</span>
                    <p className="font-semibold text-sage-800">
                      {submission.numberOfBags} × {submission.bagWeight || "—"} kg
                    </p>
                  </div>
                )}
                {submission.moistureRange && (
                  <div>
                    <span className="text-sage-400">Moisture</span>
                    <p className="font-semibold text-sage-800">{submission.moistureRange}</p>
                  </div>
                )}
              </div>
              {submission.colourAroma && (
                <p className="text-sm text-sage-500 mt-2">
                  <span className="font-medium">Colour/Aroma:</span> {submission.colourAroma}
                </p>
              )}
              {submission.tailCut && submission.tailCut !== "N/A" && (
                <p className="text-sm text-sage-500 mt-1">
                  <span className="font-medium">Tail Cut:</span> {submission.tailCut}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lot Configuration Form */}
      <Card className="rounded-3xl border-sage-100 bg-white/80 backdrop-blur">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-lg font-heading font-bold text-sage-900">Listing Configuration</h3>

          {/* Description */}
          <div>
            <Label className="text-sage-700 text-sm">Lot Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this lot for potential buyers..."
              rows={3}
              className="mt-1 rounded-xl border-sage-200 resize-none"
              maxLength={2000}
            />
          </div>

          {/* Listing Mode */}
          <div>
            <Label className="text-sage-700 text-sm font-medium">Listing Mode *</Label>
            <Select value={listingMode} onValueChange={(v) => v && setListingMode(v)}>
              <SelectTrigger className="mt-1 rounded-xl border-sage-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUCTION">Auction Only</SelectItem>
                <SelectItem value="RFQ">RFQ Only</SelectItem>
                <SelectItem value="BOTH">Auction + RFQ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-sage-400 mt-1">
              {listingMode === "AUCTION" && "Buyers bid competitively. Highest bid wins at auction end."}
              {listingMode === "RFQ" && "Buyers send price requests. You negotiate directly."}
              {listingMode === "BOTH" && "Both auction bidding and RFQ requests are enabled."}
            </p>
          </div>

          {/* Auction Fields */}
          {needsAuction && (
            <div className="space-y-4 p-4 bg-sage-50/50 rounded-2xl border border-sage-100">
              <p className="text-xs font-semibold text-sage-400 uppercase tracking-wider">Auction Settings</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sage-700 text-sm">Starting Price *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={startingPriceInr}
                      onChange={(e) => setStartingPriceInr(e.target.value)}
                      placeholder="e.g. 500"
                      className="rounded-xl border-sage-200 flex-1"
                    />
                    <select
                      value={priceCurrency}
                      onChange={(e) => setPriceCurrency(e.target.value)}
                      className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sage-700 text-sm">Reserve Price</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={reservePriceInr}
                      onChange={(e) => setReservePriceInr(e.target.value)}
                      placeholder="Optional minimum"
                      className="rounded-xl border-sage-200 flex-1"
                    />
                    <select
                      value={reserveCurrency}
                      onChange={(e) => setReserveCurrency(e.target.value)}
                      className="px-3 py-2 border border-sage-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-sage-400 mt-1">Lot won&apos;t sell below this price</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sage-700 text-sm">Auction Starts *</Label>
                  <Input
                    type="datetime-local"
                    value={auctionStartsAt}
                    onChange={(e) => setAuctionStartsAt(e.target.value)}
                    className="mt-1 rounded-xl border-sage-200"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: "In 1 hour", hours: 1 },
                      { label: "In 6 hours", hours: 6 },
                      { label: "Tomorrow 10 AM", hours: -1 },
                    ].map(({ label, hours }) => (
                      <button
                        key={label}
                        type="button"
                        className="px-2.5 py-1 text-xs rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100 border border-sage-200 transition-colors"
                        onClick={() => {
                          const d = new Date();
                          if (hours === -1) {
                            d.setDate(d.getDate() + 1);
                            d.setHours(10, 0, 0, 0);
                          } else {
                            d.setHours(d.getHours() + hours);
                          }
                          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setAuctionStartsAt(local);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sage-700 text-sm">Auction Ends *</Label>
                  <Input
                    type="datetime-local"
                    value={auctionEndsAt}
                    onChange={(e) => setAuctionEndsAt(e.target.value)}
                    className="mt-1 rounded-xl border-sage-200"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: "+24 hours", hours: 24 },
                      { label: "+48 hours", hours: 48 },
                      { label: "+7 days", hours: 168 },
                    ].map(({ label, hours }) => (
                      <button
                        key={label}
                        type="button"
                        className="px-2.5 py-1 text-xs rounded-full bg-sage-50 text-sage-600 hover:bg-sage-100 border border-sage-200 transition-colors"
                        onClick={() => {
                          const start = auctionStartsAt ? new Date(auctionStartsAt) : new Date();
                          const d = new Date(start.getTime() + hours * 60 * 60 * 1000);
                          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setAuctionEndsAt(local);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Docs Carried Over */}
          {(submission.labReportUrl || submission.phytosanitaryUrl || submission.originCertUrl) && (
            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Compliance Documents (from submission)
              </p>
              <div className="flex flex-wrap gap-2">
                {submission.labReportUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">Lab Report</Badge>
                )}
                {submission.phytosanitaryUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">Phytosanitary Cert</Badge>
                )}
                {submission.originCertUrl && (
                  <Badge variant="outline" className="text-green-700 border-green-200">Origin Certificate</Badge>
                )}
              </div>
              <p className="text-xs text-green-500 mt-1">These documents will be linked to the lot automatically.</p>
            </div>
          )}

          {/* Info box */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <p className="text-sm text-amber-700">
              <span className="font-semibold">What happens next?</span> The lot will be created and submitted
              for admin approval. Once approved, it will be visible on the marketplace.
              You can upload images and videos from the <span className="font-medium">My Lots</span> page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push("/dashboard/my-submissions")}
              className="flex-1 py-3 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Lot & Submit for Approval"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
