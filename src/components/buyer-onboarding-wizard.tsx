"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Building2,
  Phone,
  FileText,
  ShoppingCart,
  CheckCircle,
  Globe,
  Plane,
  Settings2,
  Store,
  Building,
  TrendingUp,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Identity",       desc: "Your company & location",         Icon: Building2    },
  { id: 2, title: "Contact",        desc: "Primary contact details",          Icon: Phone        },
  { id: 3, title: "Business",       desc: "Registration & credentials",       Icon: FileText     },
  { id: 4, title: "Buying Profile", desc: "What & how much you buy",          Icon: ShoppingCart },
  { id: 5, title: "Review",         desc: "Confirm and complete",             Icon: CheckCircle  },
];

const BUYER_TYPES = [
  { value: "IMPORTER",           label: "Importer",             Icon: Globe       },
  { value: "EXPORTER",           label: "Exporter",             Icon: Plane       },
  { value: "BLENDER_PROCESSOR",  label: "Blender / Processor",  Icon: Settings2   },
  { value: "WHOLESALER",         label: "Wholesaler",           Icon: Store       },
  { value: "INSTITUTIONAL",      label: "Institutional",        Icon: Building    },
  { value: "TRADER",             label: "Trader",               Icon: TrendingUp  },
];

const COUNTRIES = [
  { value: "IN", label: "India 🇮🇳" },
  { value: "NP", label: "Nepal 🇳🇵" },
  { value: "BT", label: "Bhutan 🇧🇹" },
  { value: "AE", label: "UAE 🇦🇪" },
  { value: "SA", label: "Saudi Arabia 🇸🇦" },
  { value: "OM", label: "Oman 🇴🇲" },
];

const ORIGINS = [
  { value: "India - Sikkim", label: "India - Sikkim" },
  { value: "India - Darjeeling", label: "India - Darjeeling" },
  { value: "India - NE States", label: "India - NE States" },
  { value: "Nepal - Taplejung", label: "Nepal - Taplejung" },
  { value: "Nepal - Ilam", label: "Nepal - Ilam" },
  { value: "Bhutan - Eastern", label: "Bhutan - Eastern" },
];

const GRADES = ["PREMIUM", "A", "B", "C"];

const COUNTRY_CODES = [
  { code: "IN", dialCode: "+91",  name: "India"        },
  { code: "NP", dialCode: "+977", name: "Nepal"        },
  { code: "BT", dialCode: "+975", name: "Bhutan"       },
  { code: "AE", dialCode: "+971", name: "UAE"          },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia" },
  { code: "OM", dialCode: "+968", name: "Oman"         },
];

interface BuyerFormData {
  // Identity
  companyName: string;
  tradeName: string;
  buyerType: string;
  country: string;
  city: string;
  fullAddress: string;
  website: string;
  // Contact
  contactName: string;
  contactDesignation: string;
  email: string;
  dialCode: string;
  mobile: string;
  alternateContact: string;
  // Business
  registrationNumber: string;
  taxId: string;
  importExportLicense: string;
  yearsInBusiness: string;
  // Buying Profile
  typicalMonthlyVolumeMin: string;
  typicalMonthlyVolumeMax: string;
  preferredOrigins: string[];
  preferredGrades: string[];
  packagingPreference: string;
}

export function BuyerOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, accessToken, setUser } = useAuth();
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

  const fieldError = (field: keyof BuyerFormData): string | null => {
    if (!touched.has(field)) return null;
    if (!form[field] || (Array.isArray(form[field]) ? (form[field] as string[]).length === 0 : form[field] === "")) return "This field is required";
    return null;
  };

  const toggleArrayItem = (field: "preferredOrigins" | "preferredGrades", item: string) => {
    setForm((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(item)
          ? current.filter((i) => i !== item)
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
    if (fields) setTouched((prev) => new Set([...prev, ...fields]));
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
        yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : null,
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
        const data = await res.json();
        toast.error(data.error || "Failed to save profile");
        return;
      }

      if (user) {
        setUser({ ...user, onboardingComplete: true });
      }

      toast.success("Profile setup complete! Now complete your KYC to start trading.");
      onComplete();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const currentStep = STEPS[step - 1];

  return (
    <div className="onboarding-console fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="wizard-shell w-full max-w-5xl shadow-2xl flex overflow-hidden"
           style={{ height: "min(90vh, 720px)" }}>

        {/* ── Left sidebar (desktop only) ── */}
        <aside className="wizard-sidebar hidden lg:flex flex-col w-56 shrink-0 p-5">
          <div className="mb-7">
            <p className="text-white font-heading text-lg font-bold tracking-tight">Krishibridge</p>
            <p className="text-sage-400 text-xs mt-0.5">Buyer Profile Setup</p>
          </div>

          <nav className="flex-1 space-y-0.5">
            {STEPS.map((s) => {
              const isActive = s.id === step;
              const isDone = s.id < step;
              const StepIcon = s.Icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { if (isDone) setStep(s.id); }}
                  className={`wizard-step w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                    isActive
                      ? "bg-white/10 text-white"
                      : isDone
                      ? "text-sage-300 hover:bg-white/5 cursor-pointer"
                      : "text-sage-600 cursor-default"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${
                    isActive ? "bg-white text-sage-900" : isDone ? "bg-sage-600 text-white" : "bg-sage-800 text-sage-600"
                  }`}>
                    {isDone ? <Check className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : isDone ? "text-sage-300" : "text-sage-600"}`}>
                      {s.title}
                    </p>
                    <p className={`text-[10px] leading-tight truncate ${isActive ? "text-sage-400" : "text-sage-700"}`}>
                      {s.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-sage-800 mt-2">
            <div className="flex justify-between text-[10px] text-sage-500 mb-1.5">
              <span>Progress</span>
              <span>{Math.round(((step - 1) / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1 bg-sage-800 rounded-full overflow-hidden">
              <div className="h-full bg-sage-400 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile step bar */}
          <div className="lg:hidden flex items-center gap-2 px-4 py-3 bg-sage-800 shrink-0">
            <div className="flex items-center gap-1 flex-1">
              {STEPS.map((s) => (
                <div key={s.id} className={`h-1 flex-1 rounded-full transition-all ${s.id <= step ? "bg-white" : "bg-sage-600"}`} />
              ))}
            </div>
            <span className="text-white/70 text-xs font-medium ml-2 whitespace-nowrap">{step} / {STEPS.length}</span>
          </div>

          {/* Step header */}
          <div className="px-6 py-4 border-b border-sage-100 flex items-center gap-3 shrink-0 bg-white/40">
            <div className="w-9 h-9 rounded-md bg-sage-50 border border-sage-100 flex items-center justify-center shrink-0">
              {(() => { const I = currentStep.Icon; return <I className="w-4 h-4 text-sage-700" />; })()}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-sage-900 leading-tight">{currentStep.title}</h2>
              <p className="text-sage-500 text-xs mt-0.5">{currentStep.desc}</p>
            </div>
            <span className="ml-auto text-xs text-sage-400 hidden sm:block">Step {step} of {STEPS.length}</span>
          </div>

          {/* ── Form body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Step 1: Identity */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-sage-600 uppercase tracking-wide">Buyer Type <span className="text-terracotta">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUYER_TYPES.map((t) => {
                      const TypeIcon = t.Icon;
                      const sel = form.buyerType === t.value;
                      return (
                        <button key={t.value} type="button" onClick={() => update("buyerType", t.value)}
                          className={`wizard-option flex flex-col items-center gap-1.5 p-3 border transition-all ${
                            sel ? "border-sage-600 bg-sage-50" : "border-sage-100 hover:border-sage-200 bg-white"
                          }`}>
                          <TypeIcon className={`w-5 h-5 ${sel ? "text-sage-700" : "text-sage-400"}`} />
                          <span className={`text-[11px] font-medium text-center leading-tight ${sel ? "text-sage-800" : "text-sage-500"}`}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Company / Entity Name <span className="text-terracotta">*</span></Label>
                    <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)}
                      onBlur={() => touch("companyName")}
                      placeholder="Your company or business name" className="h-10 rounded-xl border-sage-200" />
                    {fieldError("companyName") && (
                      <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="w-3 h-3" />{fieldError("companyName")}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Trade Name (if different)</Label>
                    <Input value={form.tradeName} onChange={(e) => update("tradeName", e.target.value)}
                      placeholder="Trade name / DBA" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Country</Label>
                    <Select value={form.country} onValueChange={(v) => update("country", v)}>
                      <SelectTrigger className="h-10 rounded-xl border-sage-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">City</Label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)}
                      placeholder="e.g. Mumbai, Kathmandu" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Full Address <span className="text-terracotta">*</span></Label>
                  <Textarea value={form.fullAddress} onChange={(e) => update("fullAddress", e.target.value)}
                    onBlur={() => touch("fullAddress")}
                    placeholder="Complete business address" rows={2}
                    className="rounded-xl border-sage-200 resize-none" />
                  {fieldError("fullAddress") && (
                    <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="w-3 h-3" />{fieldError("fullAddress")}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Website (optional)</Label>
                  <Input value={form.website} onChange={(e) => update("website", e.target.value)}
                    placeholder="https://www.example.com" className="h-10 rounded-xl border-sage-200" />
                </div>
              </>
            )}

            {/* Step 2: Contact */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Primary Contact Name <span className="text-terracotta">*</span></Label>
                    <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)}
                      onBlur={() => touch("contactName")}
                      placeholder="Primary contact person" className="h-10 rounded-xl border-sage-200" />
                    {fieldError("contactName") && (
                      <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="w-3 h-3" />{fieldError("contactName")}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Designation</Label>
                    <Input value={form.contactDesignation} onChange={(e) => update("contactDesignation", e.target.value)}
                      placeholder="e.g. Procurement Manager" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Email</Label>
                    <Input value={form.email} disabled className="h-10 rounded-xl border-sage-200 bg-sage-50 text-sage-500" />
                    <p className="text-[11px] text-sage-400">Auto-filled from registration</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Mobile / WhatsApp</Label>
                    <div className="flex gap-2">
                      <Select value={form.dialCode} onValueChange={(v) => update("dialCode", v)}>
                        <SelectTrigger className="h-10 w-28 shrink-0 rounded-xl border-sage-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.code} value={c.dialCode}>
                              <span className="font-medium">{c.dialCode}</span>
                              <span className="ml-1.5 text-sage-500 text-xs">{c.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="98765 43210" className="h-10 rounded-xl border-sage-200 flex-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Alternate Contact (optional)</Label>
                  <Input value={form.alternateContact} onChange={(e) => update("alternateContact", e.target.value)}
                    placeholder="Alternate name / number" className="h-10 rounded-xl border-sage-200" />
                </div>
              </>
            )}

            {/* Step 3: Business Credentials */}
            {step === 3 && (
              <>
                <div className="wizard-note px-4 py-3 text-sm text-sage-600">
                  These details help verify your business identity. All fields can be updated later.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Company Registration No.</Label>
                    <Input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)}
                      placeholder="CIN, PAN, trade license…" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Tax ID / VAT / EIN</Label>
                    <Input value={form.taxId} onChange={(e) => update("taxId", e.target.value)}
                      placeholder="Country-specific tax ID" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Import–Export License</Label>
                    <Input value={form.importExportLicense} onChange={(e) => update("importExportLicense", e.target.value)}
                      placeholder="IEC number or equivalent" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Years in Business</Label>
                    <Input type="number" value={form.yearsInBusiness} onChange={(e) => update("yearsInBusiness", e.target.value)}
                      placeholder="e.g. 10" min="0" max="200" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Buying Profile */}
            {step === 4 && (
              <>
                <div className="wizard-note px-4 py-3 text-sm text-sage-600">
                  <strong>Commodity: Large Cardamom</strong> — Tell us about your buying preferences.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Monthly Volume Min (kg)</Label>
                    <Input type="number" value={form.typicalMonthlyVolumeMin} onChange={(e) => update("typicalMonthlyVolumeMin", e.target.value)}
                      placeholder="e.g. 500" min="0" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Monthly Volume Max (kg)</Label>
                    <Input type="number" value={form.typicalMonthlyVolumeMax} onChange={(e) => update("typicalMonthlyVolumeMax", e.target.value)}
                      placeholder="e.g. 5000" min="0" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Preferred Origins</Label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {ORIGINS.map((o) => (
                      <button key={o.value} type="button" onClick={() => toggleArrayItem("preferredOrigins", o.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.preferredOrigins.includes(o.value)
                            ? "bg-sage-700 text-white border-sage-700"
                            : "bg-white text-sage-600 border-sage-200 hover:border-sage-400"
                        }`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Preferred Grades</Label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {GRADES.map((g) => (
                      <button key={g} type="button" onClick={() => toggleArrayItem("preferredGrades", g)}
                        className={`wizard-chip px-4 py-1.5 text-xs font-medium border transition-all ${
                          form.preferredGrades.includes(g)
                            ? "bg-sage-700 text-white border-sage-700"
                            : "bg-white text-sage-600 border-sage-200 hover:border-sage-400"
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Packaging Preference</Label>
                  <Textarea value={form.packagingPreference} onChange={(e) => update("packagingPreference", e.target.value)}
                    placeholder="e.g. Jute bags, vacuum sealed, 25 kg boxes…" rows={2}
                    className="rounded-xl border-sage-200 resize-none" />
                </div>
              </>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <>
                <p className="text-sm text-sage-500">Review your information. Click any completed step in the sidebar to make changes.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Identity card */}
                  <div className="wizard-summary-card border border-sage-100 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-sage-600" />
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide">Identity</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Company</span><span className="text-sage-800 font-medium">{form.companyName || "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Type</span><span className="text-sage-800">{BUYER_TYPES.find(t => t.value === form.buyerType)?.label || "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Country</span><span className="text-sage-800">{COUNTRIES.find(c => c.value === form.country)?.label || "—"}</span></div>
                    </div>
                  </div>

                  {/* Contact card */}
                  <div className="wizard-summary-card border border-sage-100 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-sage-600" />
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide">Contact</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Name</span><span className="text-sage-800 font-medium">{form.contactName || "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Email</span><span className="text-sage-800 truncate">{form.email}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Mobile</span><span className="text-sage-800">{form.mobile || "—"}</span></div>
                    </div>
                  </div>

                  {/* Business card */}
                  <div className="wizard-summary-card border border-sage-100 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-sage-600" />
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide">Business</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Reg. No</span><span className="text-sage-800">{form.registrationNumber || "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Tax ID</span><span className="text-sage-800">{form.taxId || "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Years</span><span className="text-sage-800">{form.yearsInBusiness || "—"}</span></div>
                    </div>
                  </div>

                  {/* Buying profile card */}
                  <div className="wizard-summary-card border border-sage-100 bg-white p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-sage-600" />
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide">Buying Profile</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Volume</span><span className="text-sage-800">{form.typicalMonthlyVolumeMin || "?"} – {form.typicalMonthlyVolumeMax || "?"} kg/mo</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Origins</span><span className="text-sage-800">{form.preferredOrigins.length > 0 ? form.preferredOrigins.join(", ") : "—"}</span></div>
                      <div className="flex gap-2"><span className="text-sage-400 w-20 shrink-0">Grades</span><span className="text-sage-800">{form.preferredGrades.length > 0 ? form.preferredGrades.join(", ") : "—"}</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ── Footer nav ── */}
          <div className="wizard-footer border-t border-sage-100 px-6 py-4 flex items-center justify-between bg-white/60 shrink-0">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}
                  className="rounded-full px-5 h-9 text-sm border-sage-200 text-sage-600 hover:bg-sage-50">
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < STEPS.length ? (
                <Button onClick={() => { touchStep(); if (canProceed()) setStep(step + 1); }} disabled={!canProceed()}
                  className="rounded-full px-6 h-9 text-sm bg-sage-700 hover:bg-sage-800 text-white">
                  Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}
                  className="rounded-full px-6 h-9 text-sm bg-sage-700 hover:bg-sage-800 text-white">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </span>
                  ) : "Complete Setup"}
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
