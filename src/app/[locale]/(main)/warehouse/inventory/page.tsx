"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PrintableLabel } from "@/components/printable-label";

const STATUS_COLORS: Record<string, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  LISTED: "bg-blue-100 text-blue-800",
  AUCTION_ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-purple-100 text-purple-800",
  REDEEMED: "bg-sage-100 text-sage-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const COMMODITY_ICONS: Record<string, string> = {
  LARGE_CARDAMOM: "🫛", TEA: "🍵", GINGER: "🫚", TURMERIC: "🌿", PEPPER: "🌶️",
  COFFEE: "☕", SAFFRON: "🌸", ARECA_NUT: "🥜", CINNAMON: "🪵", OTHER: "📦",
};

interface LotItem {
  id: string;
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  status: string;
  listingMode: string;
  origin: { country?: string; state?: string; district?: string };
  createdAt: string;
  farmer: { id: string; name: string; country: string };
  warehouse: { id: string; name: string };
  qualityCheck: {
    moisturePct: number | null;
    podSizeMm: number | null;
    colourGrade: string | null;
    notes: string | null;
  } | null;
  qrCode: { id: string; qrImageUrl: string; qrImageSignedUrl: string | null } | null;
}

interface Stats {
  totalLots: number;
  totalQuantityKg: number;
  intake: number;
  listed: number;
  sold: number;
  redeemed: number;
}

export default function WarehouseInventoryPage() {
  const t = useTranslations("warehouse");
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [lots, setLots] = useState<LotItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLot, setSelectedLot] = useState<LotItem | null>(null);

  // Guard
  useEffect(() => {
    if (user && user.role !== "WAREHOUSE_STAFF" && user.role !== "ADMIN") {
      toast.error("Access denied. Warehouse staff only.");
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchInventory = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/warehouse/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch inventory");

      const data = await res.json();
      setLots(data.lots || []);
      setStats(data.stats || null);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(debouncedSearch), 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-script text-sage-500 text-lg">{t("tagline")}</p>
          <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("inventoryTitle")}</h1>
        </div>
        <Link
          href="/warehouse/intake"
          className="h-11 px-6 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors inline-flex items-center gap-2"
        >
          + {t("newIntake")}
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="rounded-2xl border-sage-100">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sage-500 text-xs">{t("totalLots")}</p>
              <p className="font-heading text-sage-900 text-2xl font-bold">{stats.totalLots}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-sage-100">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sage-500 text-xs">{t("totalQuantity")}</p>
              <p className="font-heading text-sage-900 text-2xl font-bold">{stats.totalQuantityKg.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-sage-100 bg-amber-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-amber-600 text-xs">{t("intake")}</p>
              <p className="font-heading text-amber-800 text-2xl font-bold">{stats.intake}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-sage-100 bg-blue-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-blue-600 text-xs">{t("listed")}</p>
              <p className="font-heading text-blue-800 text-2xl font-bold">{stats.listed}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-sage-100 bg-purple-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-purple-600 text-xs">{t("sold")}</p>
              <p className="font-heading text-purple-800 text-2xl font-bold">{stats.sold}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-sage-100 bg-sage-50">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sage-500 text-xs">{t("redeemed")}</p>
              <p className="font-heading text-sage-700 text-2xl font-bold">{stats.redeemed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={t("searchLots")}
          value={debouncedSearch}
          onChange={(e) => setDebouncedSearch(e.target.value)}
          className="rounded-xl max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="rounded-xl w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="INTAKE">{t("intake")}</SelectItem>
            <SelectItem value="LISTED">{t("listed")}</SelectItem>
            <SelectItem value="AUCTION_ACTIVE">{t("auctionActive")}</SelectItem>
            <SelectItem value="SOLD">{t("sold")}</SelectItem>
            <SelectItem value="REDEEMED">{t("redeemed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lots Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">{t("noLots")}</h2>
            <p className="text-sage-500 text-sm">{t("noLotsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <Card
              key={lot.id}
              className="rounded-2xl border-sage-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLot(lot)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {COMMODITY_ICONS[lot.commodityType] || "📦"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-sage-900 font-bold text-sm">{lot.lotNumber}</p>
                        <Badge className={`text-[10px] ${STATUS_COLORS[lot.status] || "bg-gray-100 text-gray-800"}`}>
                          {lot.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{lot.grade}</Badge>
                      </div>
                      <p className="text-sage-500 text-xs mt-0.5">
                        {lot.commodityType.replace(/_/g, " ")} • {lot.quantityKg} kg • {lot.farmer.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sage-500 text-xs">
                      {new Date(lot.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sage-400 text-xs">{lot.warehouse.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lot Detail Dialog */}
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-sage-900">
              {selectedLot?.lotNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedLot && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{COMMODITY_ICONS[selectedLot.commodityType]}</span>
                <div>
                  <p className="font-medium text-sage-900">{selectedLot.commodityType.replace(/_/g, " ")}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={STATUS_COLORS[selectedLot.status]}>{selectedLot.status}</Badge>
                    <Badge variant="outline">{selectedLot.grade}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-sage-500 text-xs">{t("quantityKg")}</p>
                  <p className="font-heading text-sage-900 font-bold">{selectedLot.quantityKg} kg</p>
                </div>
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-sage-500 text-xs">{t("farmer")}</p>
                  <p className="font-medium text-sage-900">{selectedLot.farmer.name}</p>
                </div>
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-sage-500 text-xs">{t("origin")}</p>
                  <p className="font-medium text-sage-900">
                    {selectedLot.origin?.district}, {selectedLot.origin?.state}
                  </p>
                </div>
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-sage-500 text-xs">{t("warehouse")}</p>
                  <p className="font-medium text-sage-900">{selectedLot.warehouse.name}</p>
                </div>
              </div>

              {/* Quality Check */}
              {selectedLot.qualityCheck && (
                <div className="border-t border-sage-100 pt-4">
                  <h4 className="font-heading text-sage-900 font-semibold text-sm mb-3">{t("qualityCheck")}</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {selectedLot.qualityCheck.moisturePct != null && (
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-blue-600 text-xs">{t("moisturePct")}</p>
                        <p className="font-bold text-blue-800">{selectedLot.qualityCheck.moisturePct}%</p>
                      </div>
                    )}
                    {selectedLot.qualityCheck.podSizeMm != null && (
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-green-600 text-xs">{t("podSize")}</p>
                        <p className="font-bold text-green-800">{selectedLot.qualityCheck.podSizeMm} mm</p>
                      </div>
                    )}
                    {selectedLot.qualityCheck.colourGrade && (
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-amber-600 text-xs">{t("colourGrade")}</p>
                        <p className="font-bold text-amber-800">{selectedLot.qualityCheck.colourGrade}</p>
                      </div>
                    )}
                  </div>
                  {selectedLot.qualityCheck.notes && (
                    <p className="text-sage-600 text-xs mt-2 bg-sage-50 rounded-xl p-3">
                      {selectedLot.qualityCheck.notes}
                    </p>
                  )}
                </div>
              )}

              {/* QR Code */}
              {selectedLot.qrCode?.qrImageSignedUrl && (
                <div className="border-t border-sage-100 pt-4 text-center">
                  <h4 className="font-heading text-sage-900 font-semibold text-sm mb-3">{t("qrCode")}</h4>
                  <img
                    src={selectedLot.qrCode.qrImageSignedUrl}
                    alt="QR Code"
                    className="w-40 h-40 mx-auto rounded-xl"
                  />
                  <p className="text-sage-500 text-xs mt-2">{t("qrCodeDesc")}</p>
                </div>
              )}

              {/* Printable Label */}
              <div className="border-t border-sage-100 pt-4">
                <h4 className="font-heading text-sage-900 font-semibold text-sm mb-3">Print Label</h4>
                <PrintableLabel
                  lotNumber={selectedLot.lotNumber}
                  commodityType={selectedLot.commodityType}
                  grade={selectedLot.grade}
                  quantityKg={selectedLot.quantityKg}
                  warehouseName={selectedLot.warehouse.name}
                  farmerName={selectedLot.farmer.name}
                  origin={selectedLot.origin || {}}
                  qrImageUrl={selectedLot.qrCode?.qrImageSignedUrl || null}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
