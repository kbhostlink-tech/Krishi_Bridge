"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COMMODITY_ICONS: Record<string, string> = {
  LARGE_CARDAMOM: "🫛", TEA: "🍵", GINGER: "🫚", TURMERIC: "🌿", PEPPER: "🌶️",
  COFFEE: "☕", SAFFRON: "🌸", ARECA_NUT: "🥜", CINNAMON: "🪵", OTHER: "📦",
};

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

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
  startingPriceUsd: number | null;
  reservePriceUsd: number | null;
  auctionStartsAt: string | null;
  auctionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string; country: string; state: string | null; district: string | null };
  qualityCheck: {
    moisturePct: number | null;
    podSizeMm: number | null;
    colourGrade: string | null;
    labCertUrl: string | null;
    inspectedBy: string;
    inspectedAt: string;
    notes: string | null;
  } | null;
  qrCode: { id: string; qrImageUrl: string; qrData: string; qrImageSignedUrl: string | null } | null;
  bids: { id: string; amountUsd: number; createdAt: string; bidder: { name: string; country: string } }[];
  bidCount: number;
}

export default function LotDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const t = useTranslations("marketplace");
  const { user } = useAuth();
  const router = useRouter();

  const [lot, setLot] = useState<LotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

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
      } catch {
        toast.error("Failed to load lot details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLot();
  }, [lotId, router]);

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const timeRemaining = (endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    return `${hours}h ${mins}m remaining`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-sage-100 rounded w-32 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-96 bg-sage-100 rounded-3xl animate-pulse" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-sage-100 rounded w-48 animate-pulse" />
            <div className="h-4 bg-sage-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-sage-100 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!lot) return null;

  const isOwner = user?.id === lot.farmer.id;
  const originParts = [lot.origin?.district, lot.origin?.state, lot.origin?.country].filter(Boolean);

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${COMMODITY_LABELS[lot.commodityType] || lot.commodityType} — Grade ${lot.grade}`,
    description: lot.description || `${lot.quantityKg.toLocaleString()} kg of Grade ${lot.grade} ${COMMODITY_LABELS[lot.commodityType] || lot.commodityType}`,
    sku: lot.lotNumber,
    ...(lot.images.length > 0 ? { image: lot.images[0]?.url } : {}),
    offers: lot.startingPriceUsd ? {
      "@type": "Offer",
      price: lot.startingPriceUsd,
      priceCurrency: "USD",
      availability: lot.status === "LISTED" || lot.status === "AUCTION_ACTIVE"
        ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    } : undefined,
    brand: { "@type": "Organization", name: "AgriExchange" },
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

  return (
    <div className="space-y-6">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center justify-between text-sm text-sage-500">
        <div className="flex items-center gap-2">
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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-7xl opacity-40">{COMMODITY_ICONS[lot.commodityType] || "📦"}</span>
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-4 left-4">
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
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
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
                <h3 className="font-heading text-sage-900 font-bold text-sm mb-3">
                  🎬 Videos ({lot.videos.length})
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
          <Tabs defaultValue="quality" className="mt-6">
            <TabsList className="bg-sage-50 rounded-2xl p-1">
              <TabsTrigger value="quality" className="rounded-xl text-sm">Quality Report</TabsTrigger>
              <TabsTrigger value="bids" className="rounded-xl text-sm">Bids ({lot.bidCount})</TabsTrigger>
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

                      {lot.qualityCheck.notes && (
                        <div className="bg-sage-50 rounded-2xl p-4">
                          <p className="text-xs text-sage-500 mb-1">Inspector Notes</p>
                          <p className="text-sm text-sage-700">{lot.qualityCheck.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 text-xs text-sage-400">
                        <span>Inspected by: {lot.qualityCheck.inspectedBy}</span>
                        <span>{formatDate(lot.qualityCheck.inspectedAt)}</span>
                      </div>

                      {lot.qualityCheck.labCertUrl && (
                        <a
                          href={lot.qualityCheck.labCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-sage-700 hover:text-sage-900 font-medium"
                        >
                          📄 View Lab Certificate
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sage-500 text-sm text-center py-8">
                      No quality check data available for this lot.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids">
              <Card className="rounded-3xl border-sage-100 mt-4">
                <CardContent className="pt-6">
                  {lot.bids.length > 0 ? (
                    <div className="space-y-3">
                      {lot.bids.map((bid, i) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-3 rounded-2xl ${
                            i === 0 ? "bg-emerald-50 border border-emerald-100" : "bg-sage-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {i === 0 && <span className="text-emerald-600 font-bold text-xs">👑 HIGHEST</span>}
                            <div>
                              <p className="text-sm font-medium text-sage-900">{bid.bidder.name}</p>
                              <p className="text-xs text-sage-500">{bid.bidder.country}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-heading text-sage-900 font-bold text-sm">
                              {formatPrice(bid.amountUsd)}
                            </p>
                            <p className="text-xs text-sage-400">{formatDate(bid.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-4xl mb-2">🏷️</p>
                      <p className="text-sage-500 text-sm">No bids yet. Be the first!</p>
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
                <h1 className="font-heading text-sage-900 text-2xl font-bold">
                  {COMMODITY_ICONS[lot.commodityType]} {COMMODITY_LABELS[lot.commodityType] || lot.commodityType}
                </h1>
                <p className="text-sage-500 text-sm mt-1">{lot.lotNumber}</p>
              </div>

              {/* Price section */}
              {lot.startingPriceUsd && (
                <div className="bg-sage-50 rounded-2xl p-4">
                  <p className="text-xs text-sage-500 mb-1">
                    {lot.listingMode === "AUCTION" ? "Starting Price" : "Price"}
                  </p>
                  <p className="font-heading text-sage-900 text-3xl font-bold">
                    {formatPrice(lot.startingPriceUsd)}
                  </p>
                  {lot.bids.length > 0 && lot.listingMode === "AUCTION" && (
                    <p className="text-sm text-emerald-700 mt-1">
                      Current highest: {formatPrice(lot.bids[0].amountUsd)}
                    </p>
                  )}
                </div>
              )}

              {/* Auction timer */}
              {lot.listingMode === "AUCTION" && lot.auctionEndsAt && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-xs text-amber-600 mb-1">Auction Ends</p>
                  <p className="font-heading text-amber-900 font-bold text-sm">
                    {timeRemaining(lot.auctionEndsAt)}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">{formatDate(lot.auctionEndsAt)}</p>
                </div>
              )}

              {/* Action buttons */}
              {user && user.kycStatus === "APPROVED" && !isOwner && (
                <div>
                  {lot.listingMode === "BOTH" ? (
                    /* Dual-mode lot: Auction + RFQ tab selector */
                    <Tabs
                      defaultValue={lot.status === "AUCTION_ACTIVE" ? "auction" : "rfq"}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-2 bg-sage-50 rounded-2xl p-1 mb-3">
                        <TabsTrigger value="auction" className="rounded-xl text-sm">
                          🏷️ Auction
                        </TabsTrigger>
                        <TabsTrigger value="rfq" className="rounded-xl text-sm">
                          📋 Request Quote
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="auction" className="mt-0 space-y-2">
                        {lot.status === "AUCTION_ACTIVE" ? (
                          <>
                            {lot.auctionEndsAt && (
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                                <p className="text-xs text-amber-600 font-medium">
                                  ⏱ {timeRemaining(lot.auctionEndsAt)}
                                </p>
                                <p className="text-xs text-amber-400 mt-0.5">
                                  {formatDate(lot.auctionEndsAt)}
                                </p>
                              </div>
                            )}
                            <button className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors">
                              Place Bid (Coming Week 3)
                            </button>
                          </>
                        ) : (
                          <div className="bg-sage-50 rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">🕐</p>
                            <p className="text-sm text-sage-700 font-medium">Auction Not Started</p>
                            {lot.auctionStartsAt && (
                              <p className="text-xs text-sage-500 mt-1">
                                Starts {formatDate(lot.auctionStartsAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="rfq" className="mt-0 space-y-2">
                        {lot.status === "LISTED" ? (
                          <button className="w-full py-3 border-2 border-sage-700 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors">
                            Request Quote (Coming Week 3)
                          </button>
                        ) : (
                          <div className="bg-sage-50 rounded-2xl p-4 text-center">
                            <p className="text-2xl mb-1">🏷️</p>
                            <p className="text-sm text-sage-700 font-medium">Auction In Progress</p>
                            <p className="text-xs text-sage-500 mt-1">
                              RFQ available when auction ends
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    /* Single-mode lot */
                    <div className="space-y-2">
                      {lot.listingMode === "AUCTION" && lot.status === "AUCTION_ACTIVE" && (
                        <button className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors">
                          Place Bid (Coming Week 3)
                        </button>
                      )}
                      {lot.listingMode === "RFQ" && lot.status === "LISTED" && (
                        <button className="w-full py-3 border-2 border-sage-700 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 transition-colors">
                          Request Quote (Coming Week 3)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isOwner && lot.status === "INTAKE" && (
                <Link
                  href={`/dashboard/my-lots`}
                  className="block w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors text-center"
                >
                  Manage Listing
                </Link>
              )}
            </CardContent>
          </Card>

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
                  <span className="text-sage-900 font-medium">{lot.warehouse.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Seller</span>
                  <span className="text-sage-900 font-medium">{lot.farmer.name}</span>
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
    </div>
  );
}
