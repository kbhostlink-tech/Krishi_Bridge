"use client";

import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BidPanel } from "@/components/bid-panel";
import { SkeletonLotDetail } from "@/components/ui/skeleton";
import { CommodityIcon, COMMODITY_LABELS } from "@/lib/commodity-icons";
import { Trophy, Video, FileText, FlaskConical, ClipboardList, TestTubes, Leaf, MapPin, Crown, Tag, Send, CheckCircle2, Lock, LogIn } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const STATUS_COLORS: Record<string, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-amber-100 text-amber-800",
  UNGRADED: "bg-gray-100 text-gray-600",
};

interface LotDetail {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  description: string | null;
  images: { key: string; url: string }[];
  videos: { key: string; url: string }[];
  origin: { country?: string; state?: string; district?: string };
  status: string;
  listingMode: string;
  startingPriceInr: number | null;
  reservePriceInr: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: { id: string; name: string; country: string } | null;
  farmer: { id: string; name: string; country: string } | null;
  warehouse: { id: string; name: string; country: string; state: string | null; district: string | null } | null;
  qualityCheck: {
    moisturePct: number | null;
    podSizeMm: number | null;
    colourGrade: string | null;
    labCertUrl: string | null;
    inspectedBy: string;
    inspectedAt: string;
    notes: string | null;
  } | null;
  complianceDocs: {
    labReportUrl: string | null;
    phytosanitaryUrl: string | null;
    originCertUrl: string | null;
    sellerDeclaration: string | null;
  } | null;
  qrCode: { id: string; qrImageUrl: string; qrData: string; qrImageSignedUrl: string | null } | null;
  bids: { id: string; amountInr: number; createdAt: string; bidder: { name: string; country: string } }[];
  bidCount: number;
  winnerTransaction: { id: string; buyerId: string; status: string } | null;
}

export default function LotDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const t = useTranslations("marketplace");
  const { user } = useAuth();
  const router = useRouter();

  const [lot, setLot] = useState<LotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { accessToken } = useAuth();

  // Periodically refresh bids for the Bids tab (must be before early returns)
  const [liveBids, setLiveBids] = useState<LotDetail["bids"]>([]);
  const [liveBidCount, setLiveBidCount] = useState(0);

  // RFQ modal state
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqDeliveryCountry, setRfqDeliveryCountry] = useState("");
  const [rfqDeliveryCity, setRfqDeliveryCity] = useState("");
  const [rfqDescription, setRfqDescription] = useState("");
  const [rfqTargetPrice, setRfqTargetPrice] = useState("");
  const [rfqQuantityKg, setRfqQuantityKg] = useState("");
  const [rfqExpiresInDays, setRfqExpiresInDays] = useState("7");
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState(false);
  const [createdRfqId, setCreatedRfqId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLot = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lots/${lotId}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Lot not found");
            router.push("/marketplace");
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        setLot(data.lot);
        setLiveBids(data.lot.bids || []);
        setLiveBidCount(data.lot.bidCount || 0);
      } catch {
        toast.error("Failed to load lot details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLot();
  }, [lotId, router]);

  useEffect(() => {
    if (!lot || lot.status !== "AUCTION_ACTIVE") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bids?lotId=${lotId}`);
        if (res.ok) {
          const data = await res.json();
          setLiveBids(data.bids?.slice(0, 10) || []);
          if (data.totalBids !== undefined) setLiveBidCount(data.totalBids);
        }
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [lotId, lot?.status]);

  const { display } = useCurrency();
  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return display(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (isLoading) {
    return <SkeletonLotDetail />;
  }

  if (!lot) return null;

  const isOwner = user?.id === lot.seller?.id;
  const originParts = [lot.origin?.district, lot.origin?.state, lot.origin?.country].filter(Boolean);

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${COMMODITY_LABELS[lot.commodityType] || lot.commodityType} — Grade ${lot.grade}`,
    description: lot.description || `${lot.quantityKg.toLocaleString()} kg of Grade ${lot.grade} ${COMMODITY_LABELS[lot.commodityType] || lot.commodityType}`,
    sku: lot.lotNumber,
    ...(lot.images.length > 0 ? { image: lot.images[0]?.url } : {}),
    offers: lot.startingPriceInr ? {
      "@type": "Offer",
      price: lot.startingPriceInr,
      priceCurrency: "USD",
      availability: lot.status === "LISTED" || lot.status === "AUCTION_ACTIVE"
        ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    } : undefined,
    brand: { "@type": "Organization", name: "HCE-X" },
    category: COMMODITY_LABELS[lot.commodityType] || lot.commodityType,
    weight: { "@type": "QuantitativeValue", value: lot.quantityKg, unitCode: "KGM" },
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${COMMODITY_LABELS[lot.commodityType]} — ${lot.lotNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleOpenRfqModal = () => {
    if (!lot) return;
    setRfqQuantityKg(String(lot.quantityKg));
    setRfqDeliveryCountry("");
    setRfqDeliveryCity("");
    setRfqDescription("");
    setRfqTargetPrice("");
    setRfqExpiresInDays("7");
    setRfqSuccess(false);
    setCreatedRfqId(null);
    setShowRfqModal(true);
  };

  const handleSubmitRfq = async () => {
    if (!accessToken || !lot) return;
    setRfqSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          commodityType: lot.commodityType,
          grade: lot.grade !== "UNGRADED" ? lot.grade : undefined,
          quantityKg: parseFloat(rfqQuantityKg),
          targetPriceInr: rfqTargetPrice ? parseFloat(rfqTargetPrice) : undefined,
          deliveryCountry: rfqDeliveryCountry,
          deliveryCity: rfqDeliveryCity.trim(),
          description: rfqDescription.trim() || undefined,
          expiresInDays: parseInt(rfqExpiresInDays, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create RFQ. Please try again.");
        return;
      }
      setRfqSuccess(true);
      setCreatedRfqId(data.rfq?.id || null);
      toast.success("RFQ submitted successfully! You'll be notified when sellers respond.");
    } catch {
      toast.error("Failed to create RFQ. Please try again.");
    } finally {
      setRfqSubmitting(false);
    }
  };

  const RFQ_COUNTRIES = [
    { code: "IN", label: "India" },
    { code: "NP", label: "Nepal" },
    { code: "BT", label: "Bhutan" },
    { code: "AE", label: "UAE" },
    { code: "SA", label: "Saudi Arabia" },
    { code: "OM", label: "Oman" },
  ];

  const canSubmitRfq = rfqDeliveryCountry && rfqDeliveryCity.trim().length > 0 && parseFloat(rfqQuantityKg) > 0;

  return (
    <div className="space-y-6">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className={`flex items-center justify-between text-sm text-sage-500 ${isRtl ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
          <Link href="/marketplace" className="hover:text-sage-700 transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-sage-900 font-medium">{lot.lotNumber}</span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage-600 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </nav>

      {/* Winner Banner — shown to buyer who won the auction */}
      {lot.status === "SOLD" && lot.winnerTransaction && user?.id === lot.winnerTransaction.buyerId && (
        <Card className="rounded-3xl border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-emerald-900 font-heading font-bold text-lg">Congratulations! You Won This Auction</p>
                  <p className="text-emerald-700 text-sm mt-1">
                    {lot.winnerTransaction.status === "PENDING"
                      ? "Please complete your payment to secure this commodity."
                      : lot.winnerTransaction.status === "MANUAL_CONFIRMED"
                        ? "Your payment has been confirmed. Processing in progress."
                        : "Payment received. Your commodity token will be issued shortly."}
                  </p>
                </div>
              </div>
              {lot.winnerTransaction.status === "PENDING" && (
                <Link
                  href={`/dashboard/payments/${lot.winnerTransaction.id}`}
                  className="inline-flex h-10 px-6 items-center bg-emerald-700 text-white rounded-full font-medium text-sm hover:bg-emerald-800 transition-colors whitespace-nowrap"
                >
                  Complete Payment →
                </Link>
              )}
              {lot.winnerTransaction.status !== "PENDING" && (
                <Link
                  href={`/dashboard/payments/${lot.winnerTransaction.id}`}
                  className="inline-flex h-10 px-6 items-center border border-emerald-300 text-emerald-800 rounded-full font-medium text-sm hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  View Payment Details →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-3">
          <Card className="rounded-3xl border-sage-100 overflow-hidden">
            <CardContent className="p-0">
              {/* Main Image */}
              <div className="relative h-80 sm:h-96 bg-gradient-to-br from-sage-50 to-sage-100">
                {lot.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lot.images[activeImage]?.url}
                    alt={`${lot.lotNumber} image ${activeImage + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CommodityIcon type={lot.commodityType} className="w-16 h-16 opacity-40" />
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"}`}>
                  <Badge className={`${STATUS_COLORS[lot.status] || "bg-gray-100 text-gray-700"} text-xs`}>
                    {lot.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Thumbnails */}
              {lot.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {lot.images.map((img, i) => (
                    <button
                      key={img.key}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                        i === activeImage ? "border-sage-700" : "border-sage-100 hover:border-sage-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Gallery */}
          {lot.videos && lot.videos.length > 0 && (
            <Card className="rounded-3xl border-sage-100 mt-4">
              <CardContent className="pt-5 pb-5">
                <h3 className="font-heading text-sage-900 font-bold text-sm mb-3 flex items-center gap-1.5">
                  <Video className="w-5 h-5" /> Videos ({lot.videos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lot.videos.map((video) => (
                    <video
                      key={video.key}
                      src={video.url}
                      controls
                      preload="metadata"
                      className="w-full aspect-video rounded-xl bg-black"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Quality / Bids / QR */}
          <Tabs defaultValue="bids" className="mt-6">
            <TabsList className="bg-sage-50 rounded-2xl p-1">
              <TabsTrigger value="quality" className="rounded-xl text-sm">Quality Report</TabsTrigger>
              <TabsTrigger value="bids" className="rounded-xl text-sm">Bids ({liveBidCount})</TabsTrigger>
              <TabsTrigger value="qr" className="rounded-xl text-sm">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="quality">
              <Card className="rounded-3xl border-sage-100 mt-4">
                <CardContent className="pt-6">
                  {lot.qualityCheck ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {lot.qualityCheck.moisturePct !== null && (
                          <div className="bg-sage-50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Moisture</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.moisturePct}%
                            </p>
                          </div>
                        )}
                        {lot.qualityCheck.podSizeMm !== null && (
                          <div className="bg-sage-50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Pod Size</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.podSizeMm} mm
                            </p>
                          </div>
                        )}
                        {lot.qualityCheck.colourGrade && (
                          <div className="bg-sage-50 rounded-2xl p-4 text-center">
                            <p className="text-xs text-sage-500 mb-1">Colour Grade</p>
                            <p className="font-heading text-sage-900 font-bold text-lg">
                              {lot.qualityCheck.colourGrade}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Show placeholder if no quality metrics at all */}
                      {lot.qualityCheck.moisturePct === null && lot.qualityCheck.podSizeMm === null && !lot.qualityCheck.colourGrade && (
                        <div className="text-center py-4">
                          <p className="text-sage-400 text-sm">Quality metrics not yet recorded</p>
                        </div>
                      )}

                      {lot.qualityCheck.notes && (
                        <div className="bg-sage-50 rounded-2xl p-4">
                          <p className="text-xs text-sage-500 mb-1">Inspector Notes</p>
                          <p className="text-sm text-sage-700">{lot.qualityCheck.notes}</p>
                        </div>
                      )}

                      {lot.qualityCheck.inspectedBy && (
                        <div className="flex items-center gap-4 pt-2 text-xs text-sage-400">
                          <span>Inspected by: {lot.qualityCheck.inspectedBy}</span>
                          {lot.qualityCheck.inspectedAt && <span>{formatDate(lot.qualityCheck.inspectedAt)}</span>}
                        </div>
                      )}

                      {lot.qualityCheck.labCertUrl && (
                        <a
                          href={lot.qualityCheck.labCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 font-medium"
                        >
                          <FileText className="w-4 h-4" /> View Lab Certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-2">
                      <FlaskConical className="w-8 h-8 text-sage-300 mx-auto" />
                      <p className="text-sage-700 text-sm font-medium">Quality inspection pending</p>
                      <p className="text-sage-400 text-xs">Our team will inspect this lot and publish the quality report here.</p>
                    </div>
                  )}

                  {/* Compliance Documents */}
                  {lot.complianceDocs && (lot.complianceDocs.labReportUrl || lot.complianceDocs.phytosanitaryUrl || lot.complianceDocs.originCertUrl || lot.complianceDocs.sellerDeclaration) && (
                    <div className="mt-6 pt-6 border-t border-sage-100">
                      <h4 className="font-heading text-sage-900 font-bold text-sm mb-3 flex items-center gap-1.5"><ClipboardList className="w-5 h-5" /> Compliance Documents</h4>
                      <div className="space-y-2">
                        {lot.complianceDocs.labReportUrl && (
                          <a href={lot.complianceDocs.labReportUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 bg-sage-50 rounded-xl p-3">
                            <TestTubes className="w-3.5 h-3.5" /> Lab Report
                          </a>
                        )}
                        {lot.complianceDocs.phytosanitaryUrl && (
                          <a href={lot.complianceDocs.phytosanitaryUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 bg-sage-50 rounded-xl p-3">
                            <Leaf className="w-3.5 h-3.5" /> Phytosanitary Certificate
                          </a>
                        )}
                        {lot.complianceDocs.originCertUrl && (
                          <a href={lot.complianceDocs.originCertUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 bg-sage-50 rounded-xl p-3">
                            <MapPin className="w-3.5 h-3.5" /> Certificate of Origin
                          </a>
                        )}
                        {lot.complianceDocs.sellerDeclaration && (
                          <div className="bg-sage-50 rounded-xl p-3">
                            <p className="text-xs text-sage-500 mb-1">Seller Declaration</p>
                            <p className="text-sm text-sage-700">{lot.complianceDocs.sellerDeclaration}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids">
              <Card className="rounded-3xl border-sage-100 mt-4">
                <CardContent className="pt-6">
                  {liveBids.length > 0 ? (
                    <div className="space-y-3">
                      {liveBids.map((bid, i) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-3 rounded-2xl ${
                            i === 0 ? "bg-emerald-50 border border-emerald-100" : "bg-sage-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {i === 0 && <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> HIGHEST</span>}
                            <div>
                              <p className="text-sm font-medium text-sage-900">{bid.bidder.name}</p>
                              <p className="text-xs text-sage-500">{bid.bidder.country}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-heading text-sage-900 font-bold text-sm">
                              {formatPrice(bid.amountInr)}
                            </p>
                            <p className="text-xs text-sage-400">{formatDate(bid.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="w-10 h-10 text-sage-300 mx-auto mb-2" />
                      <p className="text-sage-500 text-sm">{t("noBidsYet")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr">
              <Card className="rounded-3xl border-sage-100 mt-4">
                <CardContent className="pt-6">
                  {lot.qrCode?.qrImageSignedUrl ? (
                    <div className="text-center space-y-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lot.qrCode.qrImageSignedUrl}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto rounded-xl border border-sage-100"
                      />
                      <p className="text-xs text-sage-500 max-w-sm mx-auto">
                        This QR code is HMAC-signed and links to this lot&apos;s verification page.
                        Scan to verify authenticity.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sage-500 text-sm text-center py-8">
                      QR code not available for this lot.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Details Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Price */}
          <Card className="rounded-3xl border-sage-100">
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-xs ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                    Grade {lot.grade}
                  </Badge>
                  <Badge className="bg-sage-50 text-sage-700 text-xs">
                    {lot.listingMode === "RFQ" ? "RFQ" : lot.listingMode === "BOTH" ? "Auction+RFQ" : "Auction"}
                  </Badge>
                </div>
                <h1 className="font-heading text-sage-900 text-2xl font-bold flex items-center gap-1.5">
                  <CommodityIcon type={lot.commodityType} className="w-3.5 h-3.5" /> {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                </h1>
                <p className="text-sage-500 text-sm mt-1">{lot.lotNumber}</p>
              </div>

              {/* Price section — only for non-auction modes or before auction starts */}
              {lot.startingPriceInr && !(lot.listingMode === "AUCTION" || lot.listingMode === "BOTH") && (
                <div className="bg-sage-50 rounded-2xl p-4">
                  <p className="text-xs text-sage-500 mb-1">Price</p>
                  <p className="font-heading text-sage-900 text-3xl font-bold">
                    {formatPrice(lot.startingPriceInr)}
                  </p>
                </div>
              )}

              {isOwner && lot.status === "DRAFT" && (
                <Link
                  href={`/dashboard/my-lots`}
                  className="block w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors text-center"
                >
                  Manage Listing
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Bid Panel — shown for AUCTION and BOTH listing modes */}
          {(lot.listingMode === "AUCTION" || lot.listingMode === "BOTH") && (
            <BidPanel
              lotId={lot.id}
              lotNumber={lot.lotNumber}
              status={lot.status}
              startingPriceInr={lot.startingPriceInr}
              auctionEndsAt={lot.auctionEndsAt}
              initialBids={lot.bids}
              bidCount={lot.bidCount}
              farmerId={lot.seller?.id || ""}
            />
          )}

          {/* RFQ section — for BOTH or RFQ-only lots */}
          {(lot.listingMode === "RFQ" || lot.listingMode === "BOTH") && (
            <Card className="rounded-3xl border-sage-100">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-heading text-sage-900 font-bold text-sm">Request for Quote</h3>
                {lot.listingMode === "BOTH" && lot.status === "AUCTION_ACTIVE" ? (
                  <div className="bg-sage-50 rounded-2xl p-4 text-center">
                    <Tag className="w-6 h-6 text-sage-300 mx-auto mb-1" />
                    <p className="text-sm text-sage-700 font-medium">Auction In Progress</p>
                    <p className="text-xs text-sage-500 mt-1">
                      RFQ available when auction ends
                    </p>
                  </div>
                ) : !user ? (
                  <Link
                    href="/login"
                    className="w-full py-3 border-2 border-sage-700 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in to Request Quote
                  </Link>
                ) : user.role !== "BUYER" ? (
                  <div className="bg-sage-50 rounded-2xl p-4 text-center">
                    <Lock className="w-5 h-5 text-sage-300 mx-auto mb-1" />
                    <p className="text-sm text-sage-500">Only buyers can request quotes</p>
                  </div>
                ) : user.kycStatus !== "APPROVED" ? (
                  <div className="bg-amber-50 rounded-2xl p-4 text-center">
                    <ClipboardList className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-sm text-amber-700">Complete KYC verification to request quotes</p>
                    <Link
                      href="/dashboard/kyc"
                      className="text-xs text-amber-600 underline mt-1 inline-block"
                    >
                      Complete KYC →
                    </Link>
                  </div>
                ) : isOwner ? (
                  <div className="bg-sage-50 rounded-2xl p-4 text-center">
                    <p className="text-sm text-sage-500">You own this lot</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-sage-500">
                      Submit a request for quote and sellers will respond with competitive offers.
                    </p>
                    <button
                      onClick={handleOpenRfqModal}
                      className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Request Quote
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card className="rounded-3xl border-sage-100">
            <CardContent className="pt-6">
              <h3 className="font-heading text-sage-900 font-bold text-sm mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Quantity</span>
                  <span className="text-sage-900 font-medium">{lot.quantityKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Origin</span>
                  <span className="text-sage-900 font-medium">{originParts.join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Warehouse</span>
                  <span className="text-sage-900 font-medium">{lot.warehouse?.name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Listed</span>
                  <span className="text-sage-900 font-medium">{formatDate(lot.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {lot.description && (
            <Card className="rounded-3xl border-sage-100">
              <CardContent className="pt-6">
                <h3 className="font-heading text-sage-900 font-bold text-sm mb-3">Description</h3>
                <p className="text-sage-600 text-sm leading-relaxed">{lot.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* RFQ Creation Modal */}
      <Dialog open={showRfqModal} onOpenChange={setShowRfqModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              Request Quote
            </DialogTitle>
          </DialogHeader>

          {rfqSuccess ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <p className="text-sage-900 font-heading font-bold text-lg">RFQ Submitted!</p>
                <p className="text-sage-500 text-sm mt-2">
                  Your quote request has been submitted. Our team will route it to matching sellers
                  and you&apos;ll be notified when responses come in.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                {createdRfqId && (
                  <Link
                    href={`/rfq/${createdRfqId}`}
                    className="px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors"
                  >
                    View RFQ Details
                  </Link>
                )}
                <Link
                  href="/dashboard/my-rfqs"
                  className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
                >
                  My RFQs
                </Link>
                <button
                  onClick={() => setShowRfqModal(false)}
                  className="px-6 py-2.5 border border-sage-200 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {/* Pre-filled lot info */}
              <div className="bg-sage-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CommodityIcon type={lot.commodityType} className="w-5 h-5" />
                  <span className="font-heading text-sage-900 font-bold text-sm">
                    {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                  </span>
                  <Badge className={`text-[10px] ${GRADE_COLORS[lot.grade] || GRADE_COLORS.UNGRADED}`}>
                    Grade {lot.grade}
                  </Badge>
                </div>
                <p className="text-xs text-sage-500">Lot {lot.lotNumber}</p>
              </div>

              {/* Editable quantity */}
              <div>
                <Label className="text-sage-700 text-sm">Quantity (kg)</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    min="1"
                    step="0.5"
                    value={rfqQuantityKg}
                    onChange={(e) => setRfqQuantityKg(e.target.value)}
                    placeholder="100"
                    className="rounded-xl pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">kg</span>
                </div>
                <p className="text-[10px] text-sage-400 mt-1">
                  Pre-filled from lot ({lot.quantityKg.toLocaleString()} kg). Adjust if needed.
                </p>
              </div>

              {/* Delivery details */}
              <div>
                <Label className="text-sage-700 text-sm">Delivery Country <span className="text-red-500">*</span></Label>
                <Select value={rfqDeliveryCountry} onValueChange={(v) => v && setRfqDeliveryCountry(v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {RFQ_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sage-700 text-sm">Delivery City / Location <span className="text-red-500">*</span></Label>
                <Input
                  value={rfqDeliveryCity}
                  onChange={(e) => setRfqDeliveryCity(e.target.value)}
                  placeholder="Enter delivery city"
                  className="mt-1.5 rounded-xl"
                  maxLength={100}
                />
              </div>

              {/* Optional target price */}
              <div>
                <Label className="text-sage-700 text-sm">Target Price (USD/kg) — optional</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400 text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(e.target.value)}
                    placeholder="Optional"
                    className="rounded-xl pl-7"
                  />
                </div>
                <p className="text-[10px] text-sage-400 mt-1">
                  Only visible to you and admins. Sellers never see your target price.
                </p>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sage-700 text-sm">Additional Details</Label>
                <Textarea
                  value={rfqDescription}
                  onChange={(e) => setRfqDescription(e.target.value)}
                  placeholder="Quality expectations, packaging, delivery schedule..."
                  className="mt-1.5 rounded-xl"
                  maxLength={2000}
                  rows={3}
                />
              </div>

              {/* Validity */}
              <div>
                <Label className="text-sage-700 text-sm">Valid For</Label>
                <Select value={rfqExpiresInDays} onValueChange={(v) => v && setRfqExpiresInDays(v)}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 14, 21, 30].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy notice */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your identity and target price remain confidential. Sellers respond with blind quotes
                  evaluated by the platform to ensure fair pricing.
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitRfq}
                disabled={rfqSubmitting || !canSubmitRfq}
                className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {rfqSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Quote Request
                  </>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
