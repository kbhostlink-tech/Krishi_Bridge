"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Building,
  Building2,
  Check,
  CheckCircle,
  CreditCard,
  FileText,
  Globe,
  Leaf,
  Loader2,
  Lock,
  Package,
  Phone,
  Plane,
  Settings2,
  ShoppingCart,
  Store,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";

const COUNTRY_META = [
  { code: "IN", emoji: "🇮🇳", dialCode: "+91" },
  { code: "NP", emoji: "🇳🇵", dialCode: "+977" },
  { code: "BT", emoji: "🇧🇹", dialCode: "+975" },
  { code: "AE", emoji: "🇦🇪", dialCode: "+971" },
  { code: "SA", emoji: "🇸🇦", dialCode: "+966" },
  { code: "OM", emoji: "🇴🇲", dialCode: "+968" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi / हिन्दी" },
  { value: "ne", label: "Nepali / नेपाली" },
  { value: "dz", label: "Dzongkha / རྫོང་ཁ" },
  { value: "ar", label: "Arabic / العربية" },
] as const;

const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD ($)" },
  { code: "INR", label: "INR (₹)" },
  { code: "NPR", label: "NPR (रू)" },
  { code: "BTN", label: "BTN (Nu.)" },
  { code: "AED", label: "AED (د.إ)" },
  { code: "SAR", label: "SAR (﷼)" },
  { code: "OMR", label: "OMR (ر.ع.)" },
] as const;

const BUYER_STEP_META = [
  { id: 1, key: "identity", Icon: Building2 },
  { id: 2, key: "contact", Icon: Phone },
  { id: 3, key: "business", Icon: FileText },
  { id: 4, key: "buyingProfile", Icon: ShoppingCart },
  { id: 5, key: "review", Icon: CheckCircle },
] as const;

const SELLER_STEP_META = [
  { id: 1, key: "identity", Icon: User },
  { id: 2, key: "contact", Icon: Phone },
  { id: 3, key: "business", Icon: FileText },
  { id: 4, key: "origin", Icon: Leaf },
  { id: 5, key: "preferences", Icon: Lock },
  { id: 6, key: "bankDetails", Icon: CreditCard },
] as const;

const BUYER_TYPE_META = [
  { value: "IMPORTER", key: "importer", Icon: Globe },
  { value: "EXPORTER", key: "exporter", Icon: Plane },
  { value: "BLENDER_PROCESSOR", key: "blenderProcessor", Icon: Settings2 },
  { value: "WHOLESALER", key: "wholesaler", Icon: Store },
  { value: "INSTITUTIONAL", key: "institutional", Icon: Building },
  { value: "TRADER", key: "trader", Icon: TrendingUp },
] as const;

const SELLER_TYPE_META = [
  { value: "INDIVIDUAL_FARMER", key: "individualFarmer", Icon: Leaf },
  { value: "AGGREGATOR", key: "aggregator", Icon: Package },
  { value: "FPO_COOPERATIVE", key: "fpoCooperative", Icon: Users },
  { value: "TRADER", key: "trader", Icon: TrendingUp },
  { value: "PROCESSOR", key: "processor", Icon: Settings2 },
] as const;

const BUYER_ORIGIN_META = [
  { value: "India - Sikkim", key: "indiaSikkim" },
  { value: "India - Darjeeling", key: "indiaDarjeeling" },
  { value: "India - NE States", key: "indiaNeStates" },
  { value: "Nepal - Taplejung", key: "nepalTaplejung" },
  { value: "Nepal - Ilam", key: "nepalIlam" },
  { value: "Bhutan - Eastern", key: "bhutanEastern" },
] as const;

const GRADE_META = [
  { value: "PREMIUM", key: "premium" },
  { value: "A", key: "a" },
  { value: "B", key: "b" },
  { value: "C", key: "c" },
] as const;

const EMPTY_VALUE = "—";
const UNKNOWN_VALUE = "?";

interface BuyerFormData {
  companyName: string;
  tradeName: string;
  buyerType: string;
  country: string;
  city: string;
  fullAddress: string;
  website: string;
  contactName: string;
  contactDesignation: string;
  email: string;
  dialCode: string;
  mobile: string;
  alternateContact: string;
  registrationNumber: string;
  taxId: string;
  importExportLicense: string;
  yearsInBusiness: string;
  typicalMonthlyVolumeMin: string;
  typicalMonthlyVolumeMax: string;
  preferredOrigins: string[];
  preferredGrades: string[];
  packagingPreference: string;
}

interface SellerFormData {
  sellerType: string;
  entityName: string;
  country: string;
  state: string;
  district: string;
  village: string;
  contactPersonName: string;
  dialCode: string;
  mobile: string;
  email: string;
  languagePreference: string;
  registrationId: string;
  fpoName: string;
  yearsOfActivity: string;
  typicalAnnualVolume: string;
  originRegion: string;
  harvestSeason: string;
  postHarvestProcess: string;
  indicativePriceExpectation: string;
  priceExpectationCurrency: string;
  minAcceptableQuantity: string;
  willingToNegotiate: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  bankIfscCode: string;
}

export function BuyerOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, accessToken, setUser } = useAuth();
  const sharedT = useTranslations("onboarding.shared");
  const buyerT = useTranslations("onboarding.buyer");
  const countryT = useTranslations("auth.register.countries");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Lock body scroll when wizard is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const steps = BUYER_STEP_META.map((stepMeta) => ({
    id: stepMeta.id,
    Icon: stepMeta.Icon,
    title: buyerT(`steps.${stepMeta.key}.title`),
    desc: buyerT(`steps.${stepMeta.key}.desc`),
  }));

  const buyerTypes = BUYER_TYPE_META.map((typeMeta) => ({
    value: typeMeta.value,
    Icon: typeMeta.Icon,
    label: buyerT(`types.${typeMeta.key}`),
  }));

  const countries = COUNTRY_META.map((country) => ({
    code: country.code,
    dialCode: country.dialCode,
    label: `${countryT(country.code)} ${country.emoji}`,
    name: countryT(country.code),
  }));

  const originOptions = BUYER_ORIGIN_META.map((origin) => ({
    value: origin.value,
    label: buyerT(`origins.${origin.key}`),
  }));

  const gradeOptions = GRADE_META.map((grade) => ({
    value: grade.value,
    label: buyerT(`grades.${grade.key}`),
  }));

  const buyingProfileNote = buyerT.rich("notes.buyingProfile", {
    strong: (chunks) => <strong>{chunks}</strong>,
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<BuyerFormData>({
    companyName: user?.name || "",
    tradeName: "",
    buyerType: "",
    country: user?.country || "IN",
    city: "",
    fullAddress: "",
    website: "",
    contactName: user?.name || "",
    contactDesignation: "",
    email: user?.email || "",
    dialCode: "+91",
    mobile: "",
    alternateContact: "",
    registrationNumber: "",
    taxId: "",
    importExportLicense: "",
    yearsInBusiness: "",
    typicalMonthlyVolumeMin: "",
    typicalMonthlyVolumeMax: "",
    preferredOrigins: [],
    preferredGrades: [],
    packagingPreference: "",
  });

  const update = (field: keyof BuyerFormData, value: string | string[] | null) => {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setTouched((prev) => new Set([...prev, field]));
  };

  const touch = (field: string) => setTouched((prev) => new Set([...prev, field]));

  const fieldError = (field: keyof BuyerFormData, required = true): string | null => {
    if (!touched.has(field)) return null;
    const val = form[field];
    const isEmpty = Array.isArray(val) ? (val as string[]).length === 0 : !val;
    if (required && isEmpty) return sharedT("errors.required");
    if (isEmpty) return null;
    const strVal = val as string;
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) return sharedT("errors.invalidEmail");
    if (field === "mobile" && !/^\d{7,15}$/.test(strVal.replace(/\s/g, ""))) return sharedT("errors.invalidMobile");
    if (field === "companyName" && strVal.length > 200) return sharedT("errors.tooLong");
    if (field === "contactName" && strVal.length > 100) return sharedT("errors.tooLong");
    return null;
  };

  const toggleArrayItem = (field: "preferredOrigins" | "preferredGrades", item: string) => {
    setForm((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(item)
          ? current.filter((value) => value !== item)
          : [...current, item],
      };
    });
  };

  const canProceed = () => {
    if (step === 1) return !!(form.companyName && form.buyerType && form.fullAddress);
    if (step === 2) return !!form.contactName;
    return true;
  };

  const touchStep = () => {
    const stepFields: Record<number, (keyof BuyerFormData)[]> = {
      1: ["companyName", "buyerType", "fullAddress"],
      2: ["contactName"],
    };
    const fields = stepFields[step];
    if (fields) {
      setTouched((prev) => new Set([...prev, ...fields]));
    }
  };

  const getSubmitErrorMessage = (status: number) => {
    if (status === 400) return sharedT("errors.validation");
    if (status === 401 || status === 403) return sharedT("errors.session");
    return sharedT("errors.save");
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      const payload = {
        companyName: form.companyName,
        tradeName: form.tradeName || "",
        buyerType: form.buyerType,
        fullAddress: form.fullAddress,
        city: form.city || "",
        website: form.website || "",
        contactDesignation: form.contactDesignation || "",
        alternateContact: form.alternateContact || "",
        mobile: form.mobile ? `${form.dialCode}${form.mobile}` : "",
        registrationNumber: form.registrationNumber || "",
        taxId: form.taxId || "",
        importExportLicense: form.importExportLicense || "",
        yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness, 10) : null,
        typicalMonthlyVolumeMin: form.typicalMonthlyVolumeMin ? parseFloat(form.typicalMonthlyVolumeMin) : null,
        typicalMonthlyVolumeMax: form.typicalMonthlyVolumeMax ? parseFloat(form.typicalMonthlyVolumeMax) : null,
        preferredOrigins: form.preferredOrigins,
        preferredGrades: form.preferredGrades,
        packagingPreference: form.packagingPreference || "",
      };

      const res = await fetch("/api/users/buyer-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(getSubmitErrorMessage(res.status));
        return;
      }

      if (user) {
        setUser({ ...user, onboardingComplete: true });
      }

      toast.success(sharedT("toasts.setupComplete"));
      onComplete();
    } catch {
      toast.error(sharedT("errors.network"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = steps[step - 1];
  const sidebarTextAlign = isRtl ? "text-right" : "text-left";
  const rowDirection = isRtl ? "flex-row-reverse text-right" : "";

  const getBuyerTypeLabel = (value: string) =>
    buyerTypes.find((option) => option.value === value)?.label ?? EMPTY_VALUE;

  const getCountryLabel = (value: string) =>
    countries.find((option) => option.code === value)?.label ?? EMPTY_VALUE;

  const getOriginLabel = (value: string) =>
    originOptions.find((option) => option.value === value)?.label ?? value;

  const getGradeLabel = (value: string) =>
    gradeOptions.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="onboarding-console fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-4 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="wizard-shell flex w-full max-w-5xl overflow-hidden shadow-2xl" style={{ height: "min(92vh, 720px)", minHeight: 0 }}>
        <aside className="wizard-sidebar hidden w-56 shrink-0 flex-col p-5 lg:flex">
          <div className="mb-7">
            <p className="font-heading text-lg font-bold tracking-tight text-white">Krishibridge</p>
            <p className="mt-0.5 text-xs text-sage-400">{buyerT("sidebarTitle")}</p>
          </div>

          <nav className="flex-1 space-y-0.5">
            {steps.map((stepItem) => {
              const isActive = stepItem.id === step;
              const isDone = stepItem.id < step;
              const StepIcon = stepItem.Icon;
              return (
                <button
                  key={stepItem.id}
                  type="button"
                  onClick={() => {
                    if (isDone) setStep(stepItem.id);
                  }}
                  className={`wizard-step flex w-full items-center gap-2.5 px-3 py-2.5 transition-all ${sidebarTextAlign} ${
                    isActive
                      ? "bg-white/10 text-white"
                      : isDone
                        ? "cursor-pointer text-sage-300 hover:bg-white/5"
                        : "cursor-default text-sage-600"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${
                      isActive ? "bg-white text-sage-900" : isDone ? "bg-sage-600 text-white" : "bg-sage-800 text-sage-600"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : <StepIcon className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${isActive ? "text-white" : isDone ? "text-sage-300" : "text-sage-600"}`}>
                      {stepItem.title}
                    </p>
                    <p className={`truncate text-[10px] leading-tight ${isActive ? "text-sage-400" : "text-sage-700"}`}>
                      {stepItem.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-2 border-t border-sage-800 pt-4">
            <div className="mb-1.5 flex justify-between text-[10px] text-sage-500">
              <span>{sharedT("progress")}</span>
              <span>{Math.round(((step - 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-sage-800">
              <div
                className="h-full rounded-full bg-sage-400 transition-all duration-500"
                style={{ width: `${((step - 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`shrink-0 bg-sage-800 px-4 py-3 lg:hidden ${isRtl ? "flex flex-row-reverse items-center gap-2" : "flex items-center gap-2"}`}>
            <div className="flex flex-1 items-center gap-1">
              {steps.map((stepItem) => (
                <div
                  key={stepItem.id}
                  className={`h-1 flex-1 rounded-full transition-all ${stepItem.id <= step ? "bg-white" : "bg-sage-600"}`}
                />
              ))}
            </div>
            <span className={`whitespace-nowrap text-xs font-medium text-white/70 ${isRtl ? "mr-2" : "ml-2"}`}>
              {step} / {steps.length}
            </span>
          </div>

          <div className={`flex shrink-0 items-center gap-3 border-b border-sage-100 bg-white/40 px-6 py-4 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sage-100 bg-sage-50">
              {(() => {
                const StepIcon = currentStep.Icon;
                return <StepIcon className="h-4 w-4 text-sage-700" />;
              })()}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight text-sage-900">{currentStep.title}</h2>
              <p className="mt-0.5 text-xs text-sage-500">{currentStep.desc}</p>
            </div>
            <span className={`${isRtl ? "mr-auto" : "ml-auto"} hidden text-xs text-sage-400 sm:block`}>
              {sharedT("stepCounter", { step, total: steps.length })}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-sage-600">
                    {buyerT("fields.buyerType")} <span className="text-terracotta">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {buyerTypes.map((typeOption) => {
                      const TypeIcon = typeOption.Icon;
                      const selected = form.buyerType === typeOption.value;
                      return (
                        <button
                          key={typeOption.value}
                          type="button"
                          onClick={() => update("buyerType", typeOption.value)}
                          className={`wizard-option flex flex-col items-center gap-1.5 border p-3 transition-all ${
                            selected ? "border-sage-600 bg-sage-50" : "border-sage-100 bg-white hover:border-sage-200"
                          }`}
                        >
                          <TypeIcon className={`h-5 w-5 ${selected ? "text-sage-700" : "text-sage-400"}`} />
                          <span className={`text-center text-[11px] font-medium leading-tight ${selected ? "text-sage-800" : "text-sage-500"}`}>
                            {typeOption.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">
                      {buyerT("fields.companyName")} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      value={form.companyName}
                      onChange={(event) => update("companyName", event.target.value)}
                      onBlur={() => touch("companyName")}
                      placeholder={buyerT("fields.companyNamePlaceholder")}
                      className={`h-10 rounded-xl border-sage-200${fieldError("companyName") ? " border-red-400" : ""}`}
                    />
                    {fieldError("companyName") && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("companyName")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.tradeName")}</Label>
                    <Input
                      value={form.tradeName}
                      onChange={(event) => update("tradeName", event.target.value)}
                      placeholder={buyerT("fields.tradeNamePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.country")}</Label>
                    <Select value={form.country} onValueChange={(value) => update("country", value)}>
                      <SelectTrigger className="h-10 rounded-xl border-sage-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.city")}</Label>
                    <Input
                      value={form.city}
                      onChange={(event) => update("city", event.target.value)}
                      placeholder={buyerT("fields.cityPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">
                    {buyerT("fields.fullAddress")} <span className="text-terracotta">*</span>
                  </Label>
                  <Textarea
                    value={form.fullAddress}
                    onChange={(event) => update("fullAddress", event.target.value)}
                    onBlur={() => touch("fullAddress")}
                    placeholder={buyerT("fields.fullAddressPlaceholder")}
                    rows={2}
                    className="resize-none rounded-xl border-sage-200"
                  />
                  {fieldError("fullAddress") && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {fieldError("fullAddress")}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{buyerT("fields.website")}</Label>
                  <Input
                    value={form.website}
                    onChange={(event) => update("website", event.target.value)}
                    placeholder={buyerT("fields.websitePlaceholder")}
                    className="h-10 rounded-xl border-sage-200"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">
                      {buyerT("fields.contactName")} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      value={form.contactName}
                      onChange={(event) => update("contactName", event.target.value)}
                      onBlur={() => touch("contactName")}
                      placeholder={buyerT("fields.contactNamePlaceholder")}
                      className={`h-10 rounded-xl border-sage-200${fieldError("contactName") ? " border-red-400" : ""}`}
                    />
                    {fieldError("contactName") && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("contactName")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.contactDesignation")}</Label>
                    <Input
                      value={form.contactDesignation}
                      onChange={(event) => update("contactDesignation", event.target.value)}
                      placeholder={buyerT("fields.contactDesignationPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.email")}</Label>
                    <Input value={form.email} disabled className="h-10 rounded-xl border-sage-200 bg-sage-50 text-sage-500" />
                    <p className="text-[11px] text-sage-400">{sharedT("autoFilled")}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.mobile")}</Label>
                    <div className="flex gap-2">
                      <Select value={form.dialCode} onValueChange={(value) => update("dialCode", value)}>
                        <SelectTrigger className="h-10 w-28 shrink-0 rounded-xl border-sage-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.dialCode}>
                              <span className="font-medium">{country.dialCode}</span>
                              <span className="ml-1.5 text-xs text-sage-500">{country.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={form.mobile}
                        onChange={(event) => update("mobile", event.target.value.replace(/[^0-9]/g, ""))}
                        onBlur={() => touch("mobile")}
                        placeholder={buyerT("fields.mobilePlaceholder")}
                        className={`h-10 flex-1 rounded-xl border-sage-200${fieldError("mobile", false) ? " border-red-400" : ""}`}
                      />
                    </div>
                    {fieldError("mobile", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("mobile", false)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{buyerT("fields.alternateContact")}</Label>
                  <Input
                    value={form.alternateContact}
                    onChange={(event) => update("alternateContact", event.target.value)}
                    placeholder={buyerT("fields.alternateContactPlaceholder")}
                    className="h-10 rounded-xl border-sage-200"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="wizard-note px-4 py-3 text-sm text-sage-600">{buyerT("notes.business")}</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.registrationNumber")}</Label>
                    <Input
                      value={form.registrationNumber}
                      onChange={(event) => update("registrationNumber", event.target.value)}
                      placeholder={buyerT("fields.registrationNumberPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.taxId")}</Label>
                    <Input
                      value={form.taxId}
                      onChange={(event) => update("taxId", event.target.value)}
                      placeholder={buyerT("fields.taxIdPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.importExportLicense")}</Label>
                    <Input
                      value={form.importExportLicense}
                      onChange={(event) => update("importExportLicense", event.target.value)}
                      placeholder={buyerT("fields.importExportLicensePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.yearsInBusiness")}</Label>
                    <Input
                      type="number"
                      value={form.yearsInBusiness}
                      onChange={(event) => update("yearsInBusiness", event.target.value)}
                      placeholder={buyerT("fields.yearsInBusinessPlaceholder")}
                      min="0"
                      max="200"
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="wizard-note px-4 py-3 text-sm text-sage-600">{buyingProfileNote}</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.typicalMonthlyVolumeMin")}</Label>
                    <Input
                      type="number"
                      value={form.typicalMonthlyVolumeMin}
                      onChange={(event) => update("typicalMonthlyVolumeMin", event.target.value)}
                      placeholder={buyerT("fields.typicalMonthlyVolumeMinPlaceholder")}
                      min="0"
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{buyerT("fields.typicalMonthlyVolumeMax")}</Label>
                    <Input
                      type="number"
                      value={form.typicalMonthlyVolumeMax}
                      onChange={(event) => update("typicalMonthlyVolumeMax", event.target.value)}
                      placeholder={buyerT("fields.typicalMonthlyVolumeMaxPlaceholder")}
                      min="0"
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{buyerT("fields.preferredOrigins")}</Label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {originOptions.map((origin) => (
                      <button
                        key={origin.value}
                        type="button"
                        onClick={() => toggleArrayItem("preferredOrigins", origin.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          form.preferredOrigins.includes(origin.value)
                            ? "border-sage-700 bg-sage-700 text-white"
                            : "border-sage-200 bg-white text-sage-600 hover:border-sage-400"
                        }`}
                      >
                        {origin.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{buyerT("fields.preferredGrades")}</Label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {gradeOptions.map((grade) => (
                      <button
                        key={grade.value}
                        type="button"
                        onClick={() => toggleArrayItem("preferredGrades", grade.value)}
                        className={`wizard-chip border px-4 py-1.5 text-xs font-medium transition-all ${
                          form.preferredGrades.includes(grade.value)
                            ? "border-sage-700 bg-sage-700 text-white"
                            : "border-sage-200 bg-white text-sage-600 hover:border-sage-400"
                        }`}
                      >
                        {grade.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{buyerT("fields.packagingPreference")}</Label>
                  <Textarea
                    value={form.packagingPreference}
                    onChange={(event) => update("packagingPreference", event.target.value)}
                    placeholder={buyerT("fields.packagingPreferencePlaceholder")}
                    rows={2}
                    className="resize-none rounded-xl border-sage-200"
                  />
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <p className={`text-sm text-sage-500 ${isRtl ? "text-right" : ""}`}>{buyerT("review.hint")}</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className={`wizard-summary-card space-y-2 border border-sage-100 bg-white p-4 ${isRtl ? "text-right" : ""}`}>
                    <div className={`mb-1 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <Building2 className="h-4 w-4 text-sage-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">{buyerT("review.identity.title")}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.identity.company")}</span><span className="font-medium text-sage-800">{form.companyName || EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.identity.type")}</span><span className="text-sage-800">{getBuyerTypeLabel(form.buyerType)}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.identity.country")}</span><span className="text-sage-800">{getCountryLabel(form.country)}</span></div>
                    </div>
                  </div>

                  <div className={`wizard-summary-card space-y-2 border border-sage-100 bg-white p-4 ${isRtl ? "text-right" : ""}`}>
                    <div className={`mb-1 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <Phone className="h-4 w-4 text-sage-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">{buyerT("review.contact.title")}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.contact.name")}</span><span className="font-medium text-sage-800">{form.contactName || EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.contact.email")}</span><span className="truncate text-sage-800">{form.email || EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.contact.mobile")}</span><span className="text-sage-800">{form.mobile ? `${form.dialCode} ${form.mobile}` : EMPTY_VALUE}</span></div>
                    </div>
                  </div>

                  <div className={`wizard-summary-card space-y-2 border border-sage-100 bg-white p-4 ${isRtl ? "text-right" : ""}`}>
                    <div className={`mb-1 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <FileText className="h-4 w-4 text-sage-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">{buyerT("review.business.title")}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.business.registrationNumber")}</span><span className="text-sage-800">{form.registrationNumber || EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.business.taxId")}</span><span className="text-sage-800">{form.taxId || EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.business.years")}</span><span className="text-sage-800">{form.yearsInBusiness || EMPTY_VALUE}</span></div>
                    </div>
                  </div>

                  <div className={`wizard-summary-card space-y-2 border border-sage-100 bg-white p-4 ${isRtl ? "text-right" : ""}`}>
                    <div className={`mb-1 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <ShoppingCart className="h-4 w-4 text-sage-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">{buyerT("review.buyingProfile.title")}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.buyingProfile.volume")}</span><span className="text-sage-800">{buyerT("review.buyingProfile.volumeValue", { min: form.typicalMonthlyVolumeMin || UNKNOWN_VALUE, max: form.typicalMonthlyVolumeMax || UNKNOWN_VALUE })}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.buyingProfile.origins")}</span><span className="text-sage-800">{form.preferredOrigins.length > 0 ? form.preferredOrigins.map(getOriginLabel).join(", ") : EMPTY_VALUE}</span></div>
                      <div className={`flex gap-2 ${rowDirection}`}><span className="w-20 shrink-0 text-sage-400">{buyerT("review.buyingProfile.grades")}</span><span className="text-sage-800">{form.preferredGrades.length > 0 ? form.preferredGrades.map(getGradeLabel).join(", ") : EMPTY_VALUE}</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`wizard-footer flex items-center justify-between border-t border-sage-100 bg-white/60 px-6 py-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-9 rounded-full border-sage-200 px-5 text-sm text-sage-600 hover:bg-sage-50"
                >
                  {commonT("back")}
                </Button>
              )}
            </div>
            <div>
              {step < steps.length ? (
                <Button
                  onClick={() => {
                    touchStep();
                    if (canProceed()) setStep(step + 1);
                  }}
                  disabled={!canProceed()}
                  className="h-9 rounded-full bg-sage-700 px-6 text-sm text-white hover:bg-sage-800"
                >
                  {sharedT("continue")}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-9 rounded-full bg-sage-700 px-6 text-sm text-white hover:bg-sage-800"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {sharedT("saving")}
                    </span>
                  ) : (
                    sharedT("completeSetup")
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SellerOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, accessToken, setUser } = useAuth();
  const sharedT = useTranslations("onboarding.shared");
  const sellerT = useTranslations("onboarding.seller");
  const countryT = useTranslations("auth.register.countries");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Lock body scroll when wizard is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const steps = SELLER_STEP_META.map((stepMeta) => ({
    id: stepMeta.id,
    Icon: stepMeta.Icon,
    title: sellerT(`steps.${stepMeta.key}.title`),
    desc: sellerT(`steps.${stepMeta.key}.desc`),
  }));

  const sellerTypes = SELLER_TYPE_META.map((typeMeta) => ({
    value: typeMeta.value,
    Icon: typeMeta.Icon,
    label: sellerT(`types.${typeMeta.key}`),
  }));

  const countries = COUNTRY_META.map((country) => ({
    code: country.code,
    dialCode: country.dialCode,
    label: `${countryT(country.code)} ${country.emoji}`,
    name: countryT(country.code),
  }));

  const preferencesNote = sellerT.rich("notes.preferences", {
    strong: (chunks) => <strong>{chunks}</strong>,
  });

  const bankNote = sellerT.rich("notes.bank", {
    strong: (chunks) => <strong>{chunks}</strong>,
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<SellerFormData>({
    sellerType: user?.role === "FARMER" ? "INDIVIDUAL_FARMER" : "AGGREGATOR",
    entityName: user?.name || "",
    country: user?.country || "IN",
    state: "",
    district: "",
    village: "",
    contactPersonName: user?.name || "",
    dialCode: "+91",
    mobile: "",
    email: user?.email || "",
    languagePreference: user?.preferredLang || "en",
    registrationId: "",
    fpoName: "",
    yearsOfActivity: "",
    typicalAnnualVolume: "",
    originRegion: "",
    harvestSeason: "",
    postHarvestProcess: "",
    indicativePriceExpectation: "",
    priceExpectationCurrency: "USD",
    minAcceptableQuantity: "",
    willingToNegotiate: "yes",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    bankIfscCode: "",
  });

  const update = (field: keyof SellerFormData, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setTouched((prev) => new Set([...prev, field]));
  };

  const touch = (field: string) => setTouched((prev) => new Set([...prev, field]));

  const fieldError = (field: keyof SellerFormData, required = true): string | null => {
    if (!touched.has(field)) return null;
    const val = form[field];
    if (required && !val) return sharedT("errors.required");
    if (!val) return null;
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return sharedT("errors.invalidEmail");
    if (field === "mobile" && !/^\d{7,15}$/.test(val.replace(/\s/g, ""))) return sharedT("errors.invalidMobile");
    if (field === "bankAccountNumber" && !/^\d{6,18}$/.test(val)) return sharedT("errors.invalidAccountNumber");
    if (field === "bankIfscCode" && val.length > 0 && !/^[A-Z0-9]{4,}$/i.test(val)) return sharedT("errors.invalidIfsc");
    if ((field === "yearsOfActivity" || field === "typicalAnnualVolume" || field === "indicativePriceExpectation" || field === "minAcceptableQuantity") && parseFloat(val) < 0) return sharedT("errors.nonNegative");
    if ((field === "yearsOfActivity") && (isNaN(parseInt(val, 10)) || parseInt(val, 10) <= 0)) return sharedT("errors.positiveNumber");
    if (field === "entityName" && val.length > 200) return sharedT("errors.tooLong");
    if (field === "contactPersonName" && val.length > 100) return sharedT("errors.tooLong");
    return null;
  };

  const canProceed = () => {
    if (step === 1) return !!form.sellerType && !!form.entityName;
    if (step === 2) return !!form.contactPersonName;
    return true;
  };

  const touchStep = () => {
    const stepFields: Record<number, (keyof SellerFormData)[]> = {
      1: ["sellerType", "entityName"],
      2: ["contactPersonName"],
    };
    const fields = stepFields[step];
    if (fields) {
      setTouched((prev) => new Set([...prev, ...fields]));
    }
  };

  const getSubmitErrorMessage = (status: number) => {
    if (status === 400) return sharedT("errors.validation");
    if (status === 401 || status === 403) return sharedT("errors.session");
    return sharedT("errors.save");
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);

    try {
      const payload = {
        sellerType: form.sellerType,
        entityName: form.entityName || "",
        contactPersonName: form.contactPersonName || "",
        mobile: form.mobile || "",
        languagePreference: form.languagePreference || "",
        state: form.state || "",
        district: form.district || "",
        village: form.village || "",
        registrationId: form.registrationId || "",
        fpoName: form.fpoName || "",
        yearsOfActivity: form.yearsOfActivity ? parseInt(form.yearsOfActivity, 10) : null,
        typicalAnnualVolume: form.typicalAnnualVolume ? parseFloat(form.typicalAnnualVolume) : null,
        originRegion: form.originRegion || "",
        harvestSeason: form.harvestSeason || "",
        postHarvestProcess: form.postHarvestProcess || "",
        indicativePriceExpectation: form.indicativePriceExpectation ? parseFloat(form.indicativePriceExpectation) : null,
        minAcceptableQuantity: form.minAcceptableQuantity ? parseFloat(form.minAcceptableQuantity) : null,
        willingToNegotiate: form.willingToNegotiate === "yes",
        bankAccountName: form.bankAccountName || "",
        bankAccountNumber: form.bankAccountNumber || "",
        bankName: form.bankName || "",
        bankBranch: form.bankBranch || "",
        bankIfscCode: form.bankIfscCode || "",
      };

      const res = await fetch("/api/users/seller-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(getSubmitErrorMessage(res.status));
        return;
      }

      if (user) {
        setUser({ ...user, onboardingComplete: true });
      }

      toast.success(sharedT("toasts.setupComplete"));
      onComplete();
    } catch {
      toast.error(sharedT("errors.network"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = steps[step - 1];
  const sidebarTextAlign = isRtl ? "text-right" : "text-left";

  return (
    <div className="onboarding-console fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 pt-4 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="wizard-shell flex w-full max-w-5xl overflow-hidden shadow-2xl" style={{ height: "min(92vh, 720px)", minHeight: 0 }}>
        <aside className="wizard-sidebar hidden w-56 shrink-0 flex-col p-5 lg:flex">
          <div className="mb-7">
            <p className="font-heading text-lg font-bold tracking-tight text-white">Krishibridge</p>
            <p className="mt-0.5 text-xs text-sage-400">{sellerT("sidebarTitle")}</p>
          </div>

          <nav className="flex-1 space-y-0.5">
            {steps.map((stepItem) => {
              const isActive = stepItem.id === step;
              const isDone = stepItem.id < step;
              const StepIcon = stepItem.Icon;
              return (
                <button
                  key={stepItem.id}
                  type="button"
                  onClick={() => {
                    if (isDone) setStep(stepItem.id);
                  }}
                  className={`wizard-step flex w-full items-center gap-2.5 px-3 py-2.5 transition-all ${sidebarTextAlign} ${
                    isActive
                      ? "bg-white/10 text-white"
                      : isDone
                        ? "cursor-pointer text-sage-300 hover:bg-white/5"
                        : "cursor-default text-sage-600"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${
                      isActive ? "bg-white text-sage-900" : isDone ? "bg-sage-600 text-white" : "bg-sage-800 text-sage-600"
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : <StepIcon className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${isActive ? "text-white" : isDone ? "text-sage-300" : "text-sage-600"}`}>
                      {stepItem.title}
                    </p>
                    <p className={`truncate text-[10px] leading-tight ${isActive ? "text-sage-400" : "text-sage-700"}`}>
                      {stepItem.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-2 border-t border-sage-800 pt-4">
            <div className="mb-1.5 flex justify-between text-[10px] text-sage-500">
              <span>{sharedT("progress")}</span>
              <span>{Math.round(((step - 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-sage-800">
              <div
                className="h-full rounded-full bg-sage-400 transition-all duration-500"
                style={{ width: `${((step - 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`shrink-0 bg-sage-800 px-4 py-3 lg:hidden ${isRtl ? "flex flex-row-reverse items-center gap-2" : "flex items-center gap-2"}`}>
            <div className="flex flex-1 items-center gap-1">
              {steps.map((stepItem) => (
                <div
                  key={stepItem.id}
                  className={`h-1 flex-1 rounded-full transition-all ${stepItem.id <= step ? "bg-white" : "bg-sage-600"}`}
                />
              ))}
            </div>
            <span className={`whitespace-nowrap text-xs font-medium text-white/70 ${isRtl ? "mr-2" : "ml-2"}`}>
              {step} / {steps.length}
            </span>
          </div>

          <div className={`flex shrink-0 items-center gap-3 border-b border-sage-100 bg-white/40 px-6 py-4 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sage-100 bg-sage-50">
              {(() => {
                const StepIcon = currentStep.Icon;
                return <StepIcon className="h-4 w-4 text-sage-700" />;
              })()}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight text-sage-900">{currentStep.title}</h2>
              <p className="mt-0.5 text-xs text-sage-500">{currentStep.desc}</p>
            </div>
            <span className={`${isRtl ? "mr-auto" : "ml-auto"} hidden text-xs text-sage-400 sm:block`}>
              {sharedT("stepCounter", { step, total: steps.length })}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-sage-600">
                    {sellerT("fields.sellerType")} <span className="text-terracotta">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
                    {sellerTypes.map((typeOption) => {
                      const TypeIcon = typeOption.Icon;
                      const selected = form.sellerType === typeOption.value;
                      return (
                        <button
                          key={typeOption.value}
                          type="button"
                          onClick={() => update("sellerType", typeOption.value)}
                          className={`wizard-option flex flex-col items-center gap-1.5 border p-3 transition-all ${
                            selected ? "border-sage-600 bg-sage-50" : "border-sage-100 bg-white hover:border-sage-200"
                          }`}
                        >
                          <TypeIcon className={`h-5 w-5 ${selected ? "text-sage-700" : "text-sage-400"}`} />
                          <span className={`text-center text-[11px] font-medium leading-tight ${selected ? "text-sage-800" : "text-sage-500"}`}>
                            {typeOption.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">
                    {sellerT("fields.entityName")} <span className="text-terracotta">*</span>
                  </Label>
                  <Input
                    value={form.entityName}
                    onChange={(event) => update("entityName", event.target.value)}
                    onBlur={() => touch("entityName")}
                    placeholder={sellerT("fields.entityNamePlaceholder")}
                    className={`h-10 rounded-xl border-sage-200${fieldError("entityName") ? " border-red-400" : ""}`}
                  />
                  {fieldError("entityName") && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {fieldError("entityName")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.country")}</Label>
                    <Select value={form.country} onValueChange={(value) => update("country", value)}>
                      <SelectTrigger className="h-10 rounded-xl border-sage-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.state")}</Label>
                    <Input
                      value={form.state}
                      onChange={(event) => update("state", event.target.value)}
                      placeholder={sellerT("fields.statePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.district")}</Label>
                    <Input
                      value={form.district}
                      onChange={(event) => update("district", event.target.value)}
                      placeholder={sellerT("fields.districtPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.village")}</Label>
                    <Input
                      value={form.village}
                      onChange={(event) => update("village", event.target.value)}
                      placeholder={sellerT("fields.villagePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">
                      {sellerT("fields.contactPersonName")} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      value={form.contactPersonName}
                      onChange={(event) => update("contactPersonName", event.target.value)}
                      onBlur={() => touch("contactPersonName")}
                      placeholder={sellerT("fields.contactPersonNamePlaceholder")}
                      className={`h-10 rounded-xl border-sage-200${fieldError("contactPersonName") ? " border-red-400" : ""}`}
                    />
                    {fieldError("contactPersonName") && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("contactPersonName")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.mobile")}</Label>
                    <div className="flex gap-2">
                      <Select value={form.dialCode} onValueChange={(value) => update("dialCode", value)}>
                        <SelectTrigger className="h-10 w-28 shrink-0 rounded-xl border-sage-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.dialCode}>
                              <span className="font-medium">{country.dialCode}</span>
                              <span className="ml-1.5 text-xs text-sage-500">{country.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={form.mobile}
                        onChange={(event) => update("mobile", event.target.value.replace(/[^0-9]/g, ""))}
                        onBlur={() => touch("mobile")}
                        placeholder={sellerT("fields.mobilePlaceholder")}
                        className={`h-10 flex-1 rounded-xl border-sage-200${fieldError("mobile", false) ? " border-red-400 focus:border-red-400" : ""}`}
                      />
                    </div>
                    {fieldError("mobile", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("mobile", false)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.email")}</Label>
                    <Input value={form.email} disabled className="h-10 rounded-xl border-sage-200 bg-sage-50 text-sage-500" />
                    <p className="text-[11px] text-sage-400">{sharedT("autoFilled")}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.languagePreference")}</Label>
                    <Select value={form.languagePreference} onValueChange={(value) => update("languagePreference", value)}>
                      <SelectTrigger className="h-10 rounded-xl border-sage-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((language) => (
                          <SelectItem key={language.value} value={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="wizard-note px-4 py-3 text-sm text-sage-600">{sellerT("notes.business")}</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.registrationId")}</Label>
                    <Input
                      value={form.registrationId}
                      onChange={(event) => update("registrationId", event.target.value)}
                      placeholder={sellerT("fields.registrationIdPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.fpoName")}</Label>
                    <Input
                      value={form.fpoName}
                      onChange={(event) => update("fpoName", event.target.value)}
                      placeholder={sellerT("fields.fpoNamePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.yearsOfActivity")}</Label>
                    <Input
                      type="number"
                      value={form.yearsOfActivity}
                      onChange={(event) => update("yearsOfActivity", event.target.value)}
                      placeholder={sellerT("fields.yearsOfActivityPlaceholder")}
                      min="0"
                      max="100"
                      className="h-10 rounded-xl border-sage-200"
                    />
                    {fieldError("yearsOfActivity", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("yearsOfActivity", false)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.typicalAnnualVolume")}</Label>
                    <Input
                      type="number"
                      value={form.typicalAnnualVolume}
                      onChange={(event) => update("typicalAnnualVolume", event.target.value)}
                      placeholder={sellerT("fields.typicalAnnualVolumePlaceholder")}
                      min="0"
                      className="h-10 rounded-xl border-sage-200"
                    />
                    {fieldError("typicalAnnualVolume", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("typicalAnnualVolume", false)}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.originRegion")}</Label>
                    <Input
                      value={form.originRegion}
                      onChange={(event) => update("originRegion", event.target.value)}
                      placeholder={sellerT("fields.originRegionPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.harvestSeason")}</Label>
                    <Input
                      value={form.harvestSeason}
                      onChange={(event) => update("harvestSeason", event.target.value)}
                      placeholder={sellerT("fields.harvestSeasonPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{sellerT("fields.postHarvestProcess")}</Label>
                  <Textarea
                    value={form.postHarvestProcess}
                    onChange={(event) => update("postHarvestProcess", event.target.value)}
                    placeholder={sellerT("fields.postHarvestProcessPlaceholder")}
                    rows={3}
                    className="resize-none rounded-xl border-sage-200"
                  />
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="wizard-note flex items-start gap-2 border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{preferencesNote}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">
                      {sellerT("fields.expectedPrice")} <span className="font-normal text-sage-400">{sellerT("fields.perKg")}</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select value={form.priceExpectationCurrency} onValueChange={(value) => update("priceExpectationCurrency", value)}>
                        <SelectTrigger className="h-10 w-28 shrink-0 rounded-xl border-sage-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={form.indicativePriceExpectation}
                        onChange={(event) => update("indicativePriceExpectation", event.target.value)}
                        onBlur={() => touch("indicativePriceExpectation")}
                        placeholder={sellerT("fields.expectedPricePlaceholder")}
                        min="0"
                        step="0.01"
                        className="h-10 flex-1 rounded-xl border-sage-200"
                      />
                    </div>
                    {fieldError("indicativePriceExpectation", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("indicativePriceExpectation", false)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.minimumOrderQuantity")}</Label>
                    <Input
                      type="number"
                      value={form.minAcceptableQuantity}
                      onChange={(event) => update("minAcceptableQuantity", event.target.value)}
                      onBlur={() => touch("minAcceptableQuantity")}
                      placeholder={sellerT("fields.minimumOrderQuantityPlaceholder")}
                      min="0"
                      className="h-10 rounded-xl border-sage-200"
                    />
                    {fieldError("minAcceptableQuantity", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("minAcceptableQuantity", false)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{sellerT("fields.willingToNegotiate")}</Label>
                  <Select value={form.willingToNegotiate} onValueChange={(value) => update("willingToNegotiate", value)}>
                    <SelectTrigger className="h-10 rounded-xl border-sage-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[260px]">
                      <SelectItem value="yes">{sellerT("options.negotiationYes")}</SelectItem>
                      <SelectItem value="no">{sellerT("options.negotiationNo")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <div className="wizard-note flex items-start gap-2 border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{bankNote}</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">{sellerT("fields.bankAccountName")}</Label>
                  <Input
                    value={form.bankAccountName}
                    onChange={(event) => update("bankAccountName", event.target.value)}
                    placeholder={sellerT("fields.bankAccountNamePlaceholder")}
                    className="h-10 rounded-xl border-sage-200"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.bankAccountNumber")}</Label>
                    <Input
                      value={form.bankAccountNumber}
                      onChange={(event) => update("bankAccountNumber", event.target.value)}
                      onBlur={() => touch("bankAccountNumber")}
                      placeholder={sellerT("fields.bankAccountNumberPlaceholder")}
                      className={`h-10 rounded-xl border-sage-200${fieldError("bankAccountNumber", false) ? " border-red-400" : ""}`}
                    />
                    {fieldError("bankAccountNumber", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("bankAccountNumber", false)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.bankName")}</Label>
                    <Input
                      value={form.bankName}
                      onChange={(event) => update("bankName", event.target.value)}
                      placeholder={sellerT("fields.bankNamePlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.bankBranch")}</Label>
                    <Input
                      value={form.bankBranch}
                      onChange={(event) => update("bankBranch", event.target.value)}
                      placeholder={sellerT("fields.bankBranchPlaceholder")}
                      className="h-10 rounded-xl border-sage-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">{sellerT("fields.bankIfscCode")}</Label>
                    <Input
                      value={form.bankIfscCode}
                      onChange={(event) => update("bankIfscCode", event.target.value.toUpperCase())}
                      onBlur={() => touch("bankIfscCode")}
                      placeholder={sellerT("fields.bankIfscCodePlaceholder")}
                      className={`h-10 rounded-xl border-sage-200${fieldError("bankIfscCode", false) ? " border-red-400" : ""}`}
                    />
                    {fieldError("bankIfscCode", false) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldError("bankIfscCode", false)}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`wizard-footer flex items-center justify-between border-t border-sage-100 bg-white/60 px-6 py-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-9 rounded-full border-sage-200 px-5 text-sm text-sage-600 hover:bg-sage-50"
                >
                  {commonT("back")}
                </Button>
              )}
            </div>
            <div>
              {step < steps.length ? (
                <Button
                  onClick={() => {
                    touchStep();
                    if (canProceed()) setStep(step + 1);
                  }}
                  disabled={!canProceed()}
                  className="h-9 rounded-full bg-sage-700 px-6 text-sm text-white hover:bg-sage-800"
                >
                  {sharedT("continue")}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-9 rounded-full bg-sage-700 px-6 text-sm text-white hover:bg-sage-800"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {sharedT("saving")}
                    </span>
                  ) : (
                    sharedT("completeSetup")
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

