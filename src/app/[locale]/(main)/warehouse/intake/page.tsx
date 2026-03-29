"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COMMODITY_OPTIONS = [
  { value: "LARGE_CARDAMOM", label: "Large Cardamom", icon: "🫛" },
  { value: "TEA", label: "Tea", icon: "🍵" },
  { value: "GINGER", label: "Ginger", icon: "🫚" },
  { value: "TURMERIC", label: "Turmeric", icon: "🌿" },
  { value: "PEPPER", label: "Pepper", icon: "🌶️" },
  { value: "COFFEE", label: "Coffee", icon: "☕" },
  { value: "SAFFRON", label: "Saffron", icon: "🌸" },
  { value: "ARECA_NUT", label: "Areca Nut", icon: "🥜" },
  { value: "CINNAMON", label: "Cinnamon", icon: "🪵" },
  { value: "OTHER", label: "Other", icon: "📦" },
];

const GRADE_OPTIONS = [
  { value: "PREMIUM", label: "Premium", color: "bg-amber-100 text-amber-800" },
  { value: "A", label: "Grade A", color: "bg-green-100 text-green-800" },
  { value: "B", label: "Grade B", color: "bg-blue-100 text-blue-800" },
  { value: "C", label: "Grade C", color: "bg-gray-100 text-gray-800" },
];

const COUNTRY_STATES: Record<string, string[]> = {
  IN: ["Sikkim", "West Bengal", "Meghalaya", "Arunachal Pradesh", "Assam", "Kerala", "Karnataka", "Tamil Nadu", "Nagaland", "Manipur", "Mizoram", "Tripura"],
  NP: ["Province 1", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"],
  BT: ["Thimphu", "Paro", "Punakha", "Bumthang"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah"],
  SA: ["Riyadh", "Jeddah"],
  OM: ["Muscat"],
};

interface Farmer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  country: string;
  kycStatus: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function WarehouseIntakePage() {
  const t = useTranslations("warehouse");
  const { user, accessToken } = useAuth();
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Farmer search
  const [farmerSearch, setFarmerSearch] = useState("");
  const [farmerResults, setFarmerResults] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isFarmerSearching, setIsFarmerSearching] = useState(false);
  const [isFarmerFocused, setIsFarmerFocused] = useState(false);

  // Warehouses
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    warehouseId: "",
    commodityType: "",
    grade: "",
    quantityKg: "",
    description: "",
    originCountry: "",
    originState: "",
    originDistrict: "",
    originVillage: "",
    moisturePct: "",
    podSizeMm: "",
    colourGrade: "",
    inspectorNotes: "",
  });

  // Image upload
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Video upload
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);

  // Submission result
  const [result, setResult] = useState<{
    lotNumber: string;
    lotId: string;
    qrImageUrl: string;
  } | null>(null);

  // Guard: only WAREHOUSE_STAFF or ADMIN
  useEffect(() => {
    if (user && user.role !== "WAREHOUSE_STAFF" && user.role !== "ADMIN") {
      toast.error("Access denied. Warehouse staff only.");
      router.push("/dashboard");
    }
  }, [user, router]);

  // Fetch warehouses on mount
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/warehouse/list", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data.warehouses || []);
        }
      } catch {
        toast.error("Failed to load warehouses");
      }
    })();
  }, [accessToken]);

  // Debounced farmer search
  const searchFarmers = useCallback(async (query: string) => {
    if (!accessToken) {
      setFarmerResults([]);
      return;
    }

    setIsFarmerSearching(true);
    try {
      const res = await fetch(`/api/warehouse/farmers?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFarmerResults(data.farmers || []);
      }
    } catch {
      toast.error("Failed to search farmers");
    } finally {
      setIsFarmerSearching(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => searchFarmers(farmerSearch), 300);
    return () => clearTimeout(timer);
  }, [farmerSearch, searchFarmers]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name}: Only JPEG, PNG, WebP images allowed`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: File must be under 10MB`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 8) {
      toast.error("Maximum 8 images allowed");
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (!["video/mp4", "video/webm", "video/quicktime"].includes(f.type)) {
        toast.error(`${f.name}: Only MP4, WebM, MOV video formats allowed`);
        return false;
      }
      if (f.size > 100 * 1024 * 1024) {
        toast.error(`${f.name}: Video must be under 100MB`);
        return false;
      }
      return true;
    });

    if (videos.length + validFiles.length > 4) {
      toast.error("Maximum 4 videos allowed");
      return;
    }

    setVideos(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setVideoPreviews(prev => [...prev, url]);
    });
  };

  const removeVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = selectedFarmer && formData.warehouseId;
  const canProceedStep2 = formData.commodityType && formData.grade && parseFloat(formData.quantityKg) > 0;
  const canProceedStep3 = formData.originCountry && formData.originState && formData.originDistrict;

  const handleSubmit = async () => {
    if (!accessToken || !selectedFarmer) return;
    setIsSubmitting(true);

    try {
      // 1. Submit intake
      const intakeRes = await fetch("/api/warehouse/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          farmerId: selectedFarmer.id,
          warehouseId: formData.warehouseId,
          commodityType: formData.commodityType,
          grade: formData.grade,
          quantityKg: parseFloat(formData.quantityKg),
          description: formData.description || undefined,
          origin: {
            country: formData.originCountry,
            state: formData.originState,
            district: formData.originDistrict,
            village: formData.originVillage || undefined,
          },
          moisturePct: formData.moisturePct ? parseFloat(formData.moisturePct) : undefined,
          podSizeMm: formData.podSizeMm ? parseFloat(formData.podSizeMm) : undefined,
          colourGrade: formData.colourGrade || undefined,
          inspectorNotes: formData.inspectorNotes || undefined,
        }),
      });

      if (!intakeRes.ok) {
        const errData = await intakeRes.json();
        throw new Error(errData.error || "Failed to create lot");
      }

      const intakeData = await intakeRes.json();

      // 2. Upload images if any
      if (images.length > 0) {
        setIsUploadingImages(true);
        const uploadedKeys: string[] = [];

        for (const image of images) {
          const fd = new FormData();
          fd.append("file", image);
          fd.append("lotId", intakeData.lot.id);

          const imgRes = await fetch("/api/lots/" + intakeData.lot.id + "/images", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            uploadedKeys.push(imgData.key);
          }
        }

        setIsUploadingImages(false);
      }

      // 3. Upload videos if any
      if (videos.length > 0) {
        setIsUploadingVideos(true);

        for (const video of videos) {
          const fd = new FormData();
          fd.append("file", video);

          await fetch("/api/lots/" + intakeData.lot.id + "/videos", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          });
        }

        setIsUploadingVideos(false);
      }

      setResult({
        lotNumber: intakeData.lot.lotNumber,
        lotId: intakeData.lot.id,
        qrImageUrl: intakeData.qrCode.qrImageUrl,
      });

      toast.success(`Lot ${intakeData.lot.lotNumber} created successfully!`);
      setStep(5); // Show success
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lot");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
      setIsUploadingVideos(false);
    }
  };

  if (result && step === 5) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="rounded-3xl border-sage-100 bg-sage-50">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="font-heading text-sage-900 text-2xl font-bold">
              {t("intakeSuccess")}
            </h2>
            <div className="bg-white rounded-2xl p-6 inline-block">
              <p className="text-sage-500 text-sm mb-1">{t("lotNumber")}</p>
              <p className="font-heading text-sage-900 text-3xl font-bold">{result.lotNumber}</p>
            </div>
            <p className="text-sage-600 text-sm">
              {t("intakeSuccessDesc")}
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setSelectedFarmer(null);
                  setFormData({
                    warehouseId: "", commodityType: "", grade: "", quantityKg: "",
                    description: "", originCountry: "", originState: "", originDistrict: "",
                    originVillage: "", moisturePct: "", podSizeMm: "", colourGrade: "", inspectorNotes: "",
                  });
                  setImages([]);
                  setImagePreviews([]);
                  setVideos([]);
                  setVideoPreviews([]);
                }}
                className="h-11 px-6 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors"
              >
                {t("newIntake")}
              </button>
              <button
                onClick={() => router.push("/warehouse/inventory")}
                className="h-11 px-6 border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
              >
                {t("viewInventory")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="font-script text-sage-500 text-lg">{t("tagline")}</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("intakeTitle")}</h1>
        {formData.warehouseId && (
          <p className="text-sage-600 text-sm mt-1">
            🏭 {warehouses.find((w) => w.id === formData.warehouseId)?.name}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-2 rounded-full flex-1 transition-colors ${
                s <= step ? "bg-sage-700" : "bg-sage-100"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-sage-500 -mt-4">
        <span>{t("step1")}</span>
        <span>{t("step2")}</span>
        <span>{t("step3")}</span>
        <span>{t("step4")}</span>
      </div>

      {/* Step 1: Select Farmer & Warehouse */}
      {step === 1 && (
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("step1Title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Farmer Search */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("selectFarmer")}</Label>
              {selectedFarmer ? (
                <div className="flex items-center justify-between bg-sage-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sage-900">{selectedFarmer.name}</p>
                    <p className="text-sage-500 text-xs">{selectedFarmer.email} • {selectedFarmer.country}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedFarmer(null); setFarmerSearch(""); }}
                    className="text-sage-400 hover:text-sage-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder={t("searchFarmerPlaceholder")}
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    onFocus={() => {
                      setIsFarmerFocused(true);
                      if (farmerResults.length === 0) searchFarmers(farmerSearch);
                    }}
                    onBlur={() => setTimeout(() => setIsFarmerFocused(false), 150)}
                    className="rounded-xl"
                  />
                  {isFarmerSearching && (
                    <div className="absolute right-3 top-3 text-sage-400 text-xs">
                      {t("searching")}
                    </div>
                  )}
                  {isFarmerFocused && !selectedFarmer && (
                    <div
                      className="absolute z-10 mt-1 w-full bg-white border border-sage-100 rounded-xl shadow-lg max-h-60 overflow-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {isFarmerSearching && (
                        <div className="px-4 py-3 text-sage-500 text-sm">{t("searching")}</div>
                      )}
                      {!isFarmerSearching && farmerResults.length === 0 && (
                        <div className="px-4 py-3 text-sage-400 text-sm">
                          {farmerSearch.length > 0 ? "No farmers found" : "No farmers registered yet"}
                        </div>
                      )}
                      {farmerResults.map((farmer) => (
                        <button
                          key={farmer.id}
                          onClick={() => {
                            setSelectedFarmer(farmer);
                            setFarmerSearch("");
                            setFarmerResults([]);
                            setIsFarmerFocused(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-sage-50 transition-colors border-b border-sage-50 last:border-0"
                        >
                          <p className="font-medium text-sage-900 text-sm">{farmer.name}</p>
                          <p className="text-sage-500 text-xs">
                            {farmer.email} {farmer.phone && `• ${farmer.phone}`} • {farmer.country}
                            {farmer.kycStatus !== "APPROVED" && (
                              <span className="ml-1 text-amber-600">⚠ KYC {farmer.kycStatus}</span>
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warehouse Select */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("selectWarehouse")}</Label>
              <Select value={formData.warehouseId} onValueChange={(v) => v && updateField("warehouseId", v)}>
                <SelectTrigger className="rounded-xl">
                  <span className={formData.warehouseId ? "text-sm" : "text-sm text-muted-foreground"}>
                    {formData.warehouseId
                      ? (warehouses.find((w) => w.id === formData.warehouseId)?.name ?? "—")
                      : t("selectWarehousePlaceholder")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="h-11 px-8 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Commodity & Grade */}
      {step === 2 && (
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("step2Title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Commodity Type */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("commodityType")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMODITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("commodityType", opt.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      formData.commodityType === opt.value
                        ? "border-sage-700 bg-sage-50 text-sage-900"
                        : "border-sage-100 text-sage-600 hover:border-sage-300"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("grade")}</Label>
              <div className="flex gap-2">
                {GRADE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("grade", opt.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      formData.grade === opt.value
                        ? "border-sage-700 bg-sage-50 text-sage-900"
                        : "border-sage-100 text-sage-600 hover:border-sage-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("quantityKg")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.quantityKg}
                  onChange={(e) => updateField("quantityKg", e.target.value)}
                  className="rounded-xl pr-12"
                  min="0"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sage-400 text-sm">kg</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sage-700 font-medium">{t("description")}</Label>
              <Textarea
                placeholder={t("descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="rounded-xl min-h-20"
                maxLength={2000}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="h-11 px-6 border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="h-11 px-8 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Origin & Quality */}
      {step === 3 && (
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("step3Title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Origin */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sage-700 font-medium">{t("originCountry")}</Label>
                <Select
                  value={formData.originCountry}
                  onValueChange={(v) => {
                    if (!v) return;
                    updateField("originCountry", v);
                    updateField("originState", "");
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t("selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COUNTRY_STATES).map((cc) => (
                      <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sage-700 font-medium">{t("originState")}</Label>
                <Select
                  value={formData.originState}
                  onValueChange={(v) => v && updateField("originState", v)}
                  disabled={!formData.originCountry}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t("selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(COUNTRY_STATES[formData.originCountry] || []).map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sage-700 font-medium">{t("district")}</Label>
                <Input
                  placeholder={t("districtPlaceholder")}
                  value={formData.originDistrict}
                  onChange={(e) => updateField("originDistrict", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sage-700 font-medium">{t("village")}</Label>
                <Input
                  placeholder={t("villagePlaceholder")}
                  value={formData.originVillage}
                  onChange={(e) => updateField("originVillage", e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Quality Check */}
            <div className="border-t border-sage-100 pt-5 mt-5">
              <h3 className="font-heading text-sage-900 font-semibold mb-4">{t("qualityCheck")}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sage-700 font-medium text-xs">{t("moisturePct")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.moisturePct}
                      onChange={(e) => updateField("moisturePct", e.target.value)}
                      className="rounded-xl pr-8"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sage-700 font-medium text-xs">{t("podSize")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.podSizeMm}
                      onChange={(e) => updateField("podSizeMm", e.target.value)}
                      className="rounded-xl pr-10"
                      min="0"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 text-xs">mm</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sage-700 font-medium text-xs">{t("colourGrade")}</Label>
                  <Input
                    placeholder={t("colourGradePlaceholder")}
                    value={formData.colourGrade}
                    onChange={(e) => updateField("colourGrade", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label className="text-sage-700 font-medium text-xs">{t("inspectorNotes")}</Label>
                <Textarea
                  placeholder={t("inspectorNotesPlaceholder")}
                  value={formData.inspectorNotes}
                  onChange={(e) => updateField("inspectorNotes", e.target.value)}
                  className="rounded-xl min-h-16"
                  maxLength={2000}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="h-11 px-6 border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                disabled={!canProceedStep3}
                onClick={() => setStep(4)}
                className="h-11 px-8 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("next")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Images & Review */}
      {step === 4 && (
        <Card className="rounded-3xl border-sage-100">
          <CardHeader>
            <CardTitle className="font-heading text-sage-900">{t("step4Title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-sage-700 font-medium">{t("lotImages")}</Label>
              <div className="border-2 border-dashed border-sage-200 rounded-2xl p-6 text-center hover:border-sage-400 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sage-600 text-sm font-medium">{t("dragDropImages")}</p>
                  <p className="text-sage-400 text-xs mt-1">{t("imageFormats")}</p>
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="space-y-3">
              <Label className="text-sage-700 font-medium">{t("lotVideos")}</Label>
              <div className="border-2 border-dashed border-sage-200 rounded-2xl p-6 text-center hover:border-sage-400 transition-colors">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={handleVideoAdd}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="text-3xl mb-2">🎬</div>
                  <p className="text-sage-600 text-sm font-medium">{t("dragDropVideos")}</p>
                  <p className="text-sage-400 text-xs mt-1">{t("videoFormats")}</p>
                </label>
              </div>
              {videoPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {videoPreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <video
                        src={preview}
                        className="w-full aspect-video object-cover rounded-xl bg-black"
                        controls
                        preload="metadata"
                      />
                      <button
                        onClick={() => removeVideo(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Summary */}
            <div className="border-t border-sage-100 pt-5">
              <h3 className="font-heading text-sage-900 font-semibold mb-4">{t("reviewSummary")}</h3>
              <div className="bg-sage-50 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-sage-500">{t("farmer")}</span>
                  <span className="text-sage-900 font-medium">{selectedFarmer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">{t("commodityType")}</span>
                  <span className="text-sage-900 font-medium">
                    {COMMODITY_OPTIONS.find(c => c.value === formData.commodityType)?.icon}{" "}
                    {COMMODITY_OPTIONS.find(c => c.value === formData.commodityType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">{t("grade")}</span>
                  <span className="text-sage-900 font-medium">{formData.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">{t("quantityKg")}</span>
                  <span className="text-sage-900 font-medium">{formData.quantityKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">{t("origin")}</span>
                  <span className="text-sage-900 font-medium">
                    {formData.originDistrict}, {formData.originState}, {formData.originCountry}
                  </span>
                </div>
                {formData.moisturePct && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">{t("moisturePct")}</span>
                    <span className="text-sage-900 font-medium">{formData.moisturePct}%</span>
                  </div>
                )}
                {formData.podSizeMm && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">{t("podSize")}</span>
                    <span className="text-sage-900 font-medium">{formData.podSizeMm} mm</span>
                  </div>
                )}
                {images.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">{t("images")}</span>
                    <span className="text-sage-900 font-medium">{images.length} {t("imagesAttached")}</span>
                  </div>
                )}
                {videos.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">{t("videos")}</span>
                    <span className="text-sage-900 font-medium">{videos.length} {t("videosAttached")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="h-11 px-6 border border-sage-200 text-sage-700 rounded-full font-medium text-sm hover:bg-sage-50 transition-colors"
              >
                {t("back")}
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="h-11 px-8 bg-sage-700 text-white rounded-full font-medium text-sm hover:bg-sage-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  isUploadingVideos ? t("uploadingVideos") : isUploadingImages ? t("uploadingImages") : t("creatingLot")
                ) : (
                  t("submitIntake")
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
