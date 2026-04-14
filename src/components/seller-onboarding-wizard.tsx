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
  User,
  Phone,
  FileText,
  Leaf,
  Lock,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  Settings2,
  Check,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Identity",       desc: "Who you are & where you farm",   Icon: User       },
  { id: 2, title: "Contact",        desc: "How we reach you",                Icon: Phone      },
  { id: 3, title: "Business",       desc: "Registration & credentials",      Icon: FileText   },
  { id: 4, title: "Origin & Harvest", desc: "Your crop origins",             Icon: Leaf       },
  { id: 5, title: "Preferences",    desc: "Pricing & negotiation",           Icon: Lock       },
  { id: 6, title: "Bank Details",   desc: "For receiving payments",          Icon: CreditCard },
];

const SELLER_TYPES = [
  { value: "INDIVIDUAL_FARMER", label: "Farmer / Grower",    Icon: Leaf      },
  { value: "AGGREGATOR",        label: "Aggregator",          Icon: Package   },
  { value: "FPO_COOPERATIVE",   label: "FPO / Cooperative",   Icon: Users     },
  { value: "TRADER",            label: "Trader",              Icon: TrendingUp },
  { value: "PROCESSOR",         label: "Processor",           Icon: Settings2 },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi / हिन्दी" },
  { value: "ne", label: "Nepali / नेपाली" },
  { value: "dz", label: "Dzongkha / རྫོང་ཁ" },
  { value: "ar", label: "Arabic / العربية" },
];

const COUNTRIES = [
  { value: "IN", label: "India 🇮🇳" },
  { value: "NP", label: "Nepal 🇳🇵" },
  { value: "BT", label: "Bhutan 🇧🇹" },
  { value: "AE", label: "UAE 🇦🇪" },
  { value: "SA", label: "Saudi Arabia 🇸🇦" },
  { value: "OM", label: "Oman 🇴🇲" },
];

interface FormData {
  // Identity
  sellerType: string;
  entityName: string;
  country: string;
  state: string;
  district: string;
  village: string;
  // Contact
  contactPersonName: string;
  mobile: string;
  email: string;
  languagePreference: string;
  // Business
  registrationId: string;
  fpoName: string;
  yearsOfActivity: string;
  typicalAnnualVolume: string;
  // Origin
  originRegion: string;
  harvestSeason: string;
  postHarvestProcess: string;
  // Private
  indicativePriceExpectation: string;
  minAcceptableQuantity: string;
  willingToNegotiate: string;
  // Bank Details
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  bankIfscCode: string;
}

export function SellerOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, accessToken, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    sellerType: user?.role === "FARMER" ? "INDIVIDUAL_FARMER" : "AGGREGATOR",
    entityName: user?.name || "",
    country: user?.country || "IN",
    state: "",
    district: "",
    village: "",
    contactPersonName: user?.name || "",
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
    minAcceptableQuantity: "",
    willingToNegotiate: "true",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",
    bankIfscCode: "",
  });

  const update = (field: keyof FormData, value: string | null) =>
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));

  const canProceed = () => {
    if (step === 1) return !!form.sellerType && !!form.entityName;
    if (step === 2) return !!form.contactPersonName;
    return true;
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
        yearsOfActivity: form.yearsOfActivity ? parseInt(form.yearsOfActivity) : null,
        typicalAnnualVolume: form.typicalAnnualVolume ? parseFloat(form.typicalAnnualVolume) : null,
        originRegion: form.originRegion || "",
        harvestSeason: form.harvestSeason || "",
        postHarvestProcess: form.postHarvestProcess || "",
        indicativePriceExpectation: form.indicativePriceExpectation ? parseFloat(form.indicativePriceExpectation) : null,
        minAcceptableQuantity: form.minAcceptableQuantity ? parseFloat(form.minAcceptableQuantity) : null,
        willingToNegotiate: form.willingToNegotiate === "true",
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
        const data = await res.json();
        toast.error(data.error || "Failed to save profile");
        return;
      }

      // Update user context with onboardingComplete = true
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-linen w-full max-w-5xl rounded-3xl shadow-2xl flex overflow-hidden"
           style={{ height: "min(90vh, 720px)" }}>

        {/* ── Left sidebar (desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-56 bg-sage-900 shrink-0 p-5">
          <div className="mb-7">
            <p className="text-white font-heading text-lg font-bold tracking-tight">HCE-X</p>
            <p className="text-sage-400 text-xs mt-0.5">Seller Profile Setup</p>
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-white/10 text-white"
                      : isDone
                      ? "text-sage-300 hover:bg-white/5 cursor-pointer"
                      : "text-sage-600 cursor-default"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
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
            <div className="w-9 h-9 rounded-xl bg-sage-50 border border-sage-100 flex items-center justify-center shrink-0">
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
                  <Label className="text-xs font-semibold text-sage-600 uppercase tracking-wide">I am a <span className="text-terracotta">*</span></Label>
                  <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                    {SELLER_TYPES.map((t) => {
                      const TypeIcon = t.Icon;
                      const sel = form.sellerType === t.value;
                      return (
                        <button key={t.value} type="button" onClick={() => update("sellerType", t.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            sel ? "border-sage-600 bg-sage-50" : "border-sage-100 hover:border-sage-200 bg-white"
                          }`}>
                          <TypeIcon className={`w-5 h-5 ${sel ? "text-sage-700" : "text-sage-400"}`} />
                          <span className={`text-[11px] font-medium text-center leading-tight ${sel ? "text-sage-800" : "text-sage-500"}`}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Name / Entity Name <span className="text-terracotta">*</span></Label>
                  <Input value={form.entityName} onChange={(e) => update("entityName", e.target.value)}
                    placeholder="Your name or business name" className="h-10 rounded-xl border-sage-200" />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label className="text-sm font-medium text-sage-700">State / Province</Label>
                    <Input value={form.state} onChange={(e) => update("state", e.target.value)}
                      placeholder="e.g. Sikkim" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">District</Label>
                    <Input value={form.district} onChange={(e) => update("district", e.target.value)}
                      placeholder="e.g. East Sikkim" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Village / Market</Label>
                    <Input value={form.village} onChange={(e) => update("village", e.target.value)}
                      placeholder="e.g. Rhenock" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Contact */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Contact Person Name <span className="text-terracotta">*</span></Label>
                    <Input value={form.contactPersonName} onChange={(e) => update("contactPersonName", e.target.value)}
                      placeholder="Primary contact name" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Mobile / WhatsApp</Label>
                    <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)}
                      placeholder="+91 98765 43210" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Email</Label>
                    <Input value={form.email} disabled className="h-10 rounded-xl border-sage-200 bg-sage-50 text-sage-500" />
                    <p className="text-[11px] text-sage-400">Auto-filled from registration</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Language Preference</Label>
                    <Select value={form.languagePreference} onValueChange={(v) => update("languagePreference", v)}>
                      <SelectTrigger className="h-10 rounded-xl border-sage-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Business */}
            {step === 3 && (
              <>
                <div className="rounded-xl bg-sage-50 border border-sage-100 px-4 py-3 text-sm text-sage-600">
                  These details help verify your identity. All fields are optional and can be updated later.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Registration / ID Proof</Label>
                    <Input value={form.registrationId} onChange={(e) => update("registrationId", e.target.value)}
                      placeholder="Aadhaar, PAN, Trade License…" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">FPO / Cooperative Name</Label>
                    <Input value={form.fpoName} onChange={(e) => update("fpoName", e.target.value)}
                      placeholder="Leave blank if not applicable" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Years of Activity</Label>
                    <Input type="number" value={form.yearsOfActivity} onChange={(e) => update("yearsOfActivity", e.target.value)}
                      placeholder="e.g. 5" min="0" max="100" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Typical Annual Volume (kg)</Label>
                    <Input type="number" value={form.typicalAnnualVolume} onChange={(e) => update("typicalAnnualVolume", e.target.value)}
                      placeholder="e.g. 5000" min="0" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Origin & Harvest */}
            {step === 4 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Exact Origin Region</Label>
                    <Input value={form.originRegion} onChange={(e) => update("originRegion", e.target.value)}
                      placeholder="e.g. East Sikkim, Taplejung" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Harvest Season</Label>
                    <Input value={form.harvestSeason} onChange={(e) => update("harvestSeason", e.target.value)}
                      placeholder="e.g. September – November" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Post-Harvest Processing</Label>
                  <Textarea value={form.postHarvestProcess} onChange={(e) => update("postHarvestProcess", e.target.value)}
                    placeholder="Describe drying, curing, or processing methods…" rows={3}
                    className="rounded-xl border-sage-200 resize-none" />
                </div>
              </>
            )}

            {/* Step 5: Preferences (private) */}
            {step === 5 && (
              <>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>These preferences are <strong>confidential</strong> and never shown to buyers. They help our platform match you with suitable buyers.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Expected Price (USD / kg)</Label>
                    <Input type="number" value={form.indicativePriceExpectation} onChange={(e) => update("indicativePriceExpectation", e.target.value)}
                      placeholder="Optional — per kg" min="0" step="0.01" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Minimum Order Quantity (kg)</Label>
                    <Input type="number" value={form.minAcceptableQuantity} onChange={(e) => update("minAcceptableQuantity", e.target.value)}
                      placeholder="Optional — min order" min="0" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Willingness to Negotiate</Label>
                  <Select value={form.willingToNegotiate} onValueChange={(v) => update("willingToNegotiate", v)}>
                    <SelectTrigger className="h-10 rounded-xl border-sage-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes — open to negotiation</SelectItem>
                      <SelectItem value="false">No — firm on prices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 6: Bank Details */}
            {step === 6 && (
              <>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Your bank details are <strong>confidential</strong> and only visible to platform administrators. Required for receiving payments.</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-sage-700">Account Holder Name</Label>
                  <Input value={form.bankAccountName} onChange={(e) => update("bankAccountName", e.target.value)}
                    placeholder="Name as per bank records" className="h-10 rounded-xl border-sage-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Account Number</Label>
                    <Input value={form.bankAccountNumber} onChange={(e) => update("bankAccountNumber", e.target.value)}
                      placeholder="e.g. 1234567890" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Bank Name</Label>
                    <Input value={form.bankName} onChange={(e) => update("bankName", e.target.value)}
                      placeholder="e.g. State Bank of India" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">Branch Name</Label>
                    <Input value={form.bankBranch} onChange={(e) => update("bankBranch", e.target.value)}
                      placeholder="e.g. MG Road Branch" className="h-10 rounded-xl border-sage-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-sage-700">IFSC / SWIFT Code</Label>
                    <Input value={form.bankIfscCode} onChange={(e) => update("bankIfscCode", e.target.value)}
                      placeholder="e.g. SBIN0001234" className="h-10 rounded-xl border-sage-200" />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ── Footer nav ── */}
          <div className="border-t border-sage-100 px-6 py-4 flex items-center justify-between bg-white/60 shrink-0">
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
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                  className="rounded-full px-6 h-9 text-sm bg-sage-700 hover:bg-sage-800 text-white">
                  Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}
                  className="rounded-full px-6 h-9 text-sm bg-sage-700 hover:bg-sage-800 text-white">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
