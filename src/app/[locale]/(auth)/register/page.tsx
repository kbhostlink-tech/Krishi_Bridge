"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Leaf, Building2, ShoppingBag, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
];

const COUNTRY_CODES = [
  { code: "IN", flag: "🇮🇳", dialCode: "+91", name: "India" },
  { code: "NP", flag: "🇳🇵", dialCode: "+977", name: "Nepal" },
  { code: "BT", flag: "🇧🇹", dialCode: "+975", name: "Bhutan" },
  { code: "AE", flag: "🇦🇪", dialCode: "+971", name: "UAE" },
  { code: "SA", flag: "🇸🇦", dialCode: "+966", name: "Saudi Arabia" },
  { code: "OM", flag: "🇴🇲", dialCode: "+968", name: "Oman" },
];

// Requires: lowercase, uppercase, digit, and at least one special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':",.<>/?\\|`~])/;

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { register } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    dialCode: "+91",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "" as "FARMER" | "BUYER" | "AGGREGATOR" | "",
    country: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role || !form.country) {
      setError("Please select your role and country");
      return;
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      setError(
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (e.g. !@#$%)"
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const fullPhone = form.phone ? `${form.dialCode}${form.phone}` : undefined;

    const result = await register({
      name: form.name,
      email: form.email,
      phone: fullPhone || undefined,
      password: form.password,
      role: form.role as "FARMER" | "BUYER" | "AGGREGATOR",
      country: form.country,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push(`/verify-otp?userId=${result.userId}`);
    } else {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center py-6 px-4 sm:px-6">
      {/* Header Section */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-5 hover:opacity-80 transition-opacity">
          <div className="relative">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2d5a3f" />
              <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
              <path d="M15 14 L18 20 L12 20 Z" fill="white" />
              <circle cx="30" cy="10" r="3" fill="white" fillOpacity="0.45" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-heading text-sage-900 text-base font-bold">HCE-X</span>
            <span className="text-sage-500 text-xs font-medium">Himalayan Commodity Exchange</span>
          </div>
        </Link>

        <h1 className="font-heading text-sage-900 text-3xl font-bold mb-1.5 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sage-600 text-sm font-medium max-w-sm mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500 flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 font-medium text-xs">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <Label 
                htmlFor="name" 
                className="text-sage-800 font-semibold text-xs"
              >
                {t("name")}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full h-10 px-3.5 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label 
                htmlFor="email" 
                className="text-sage-800 font-semibold text-xs"
              >
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3.5 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
              />
            </div>
          </div>

          {/* Phone with Country Code */}
          <div className="space-y-1.5">
            <Label 
              htmlFor="phone" 
              className="text-sage-800 font-semibold text-xs"
            >
              {t("phone")}
            </Label>
            <div className="flex gap-2.5">
              <Select
                value={form.dialCode}
                onValueChange={(v) => handleChange("dialCode", v ?? "+91")}
              >
                <SelectTrigger className="h-10 w-28 shrink-0 rounded-lg border-2 border-sage-200 bg-white focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.dialCode}>
                      <span className="flex items-center gap-1">
                        <span>{c.flag}</span>
                        <span className="font-medium text-sage-900 text-sm">{c.dialCode}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder={t("phonePlaceholder")}
                className="w-full h-10 px-3.5 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sage-800 font-semibold text-xs block">
              {t("role")}
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: "FARMER" as const, icon: Leaf, label: t("roleFarmer") },
                { value: "AGGREGATOR" as const, icon: Building2, label: t("roleAggregator") },
                { value: "BUYER" as const, icon: ShoppingBag, label: t("roleBuyer") },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange("role", value)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-300 group ${
                    form.role === value
                      ? "border-sage-600 bg-sage-50 shadow-md scale-105"
                      : "border-sage-200 bg-white hover:border-sage-400 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-1.5 transition-all duration-300 ${
                    form.role === value
                      ? "bg-sage-600 text-white"
                      : "bg-sage-100 text-sage-700 group-hover:bg-sage-200"
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-bold text-sage-900 text-center leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Country Selection */}
          <div className="space-y-1.5">
            <Label 
              htmlFor="country"
              className="text-sage-800 font-semibold text-xs"
            >
              {t("country")}
            </Label>
            <Select 
              value={form.country} 
              onValueChange={(v) => handleChange("country", v ?? "")}
            >
              <SelectTrigger className="h-10 rounded-lg border-2 border-sage-200 bg-white focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 text-sm">
                <SelectValue placeholder={t("selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sage-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-sage-500 font-medium">
                {t("securitySection")}
              </span>
            </div>
          </div>

          {/* Password & Confirm Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Password Field */}
            <div className="space-y-1.5">
              <Label 
                htmlFor="password" 
                className="text-sage-800 font-semibold text-xs"
              >
                {t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 pr-9 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500 hover:text-sage-700 transition-colors duration-200 p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label 
                htmlFor="confirmPassword" 
                className="text-sage-800 font-semibold text-xs"
              >
              {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 pr-9 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-500 hover:text-sage-700 transition-colors duration-200 p-0.5"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <p className="text-xs text-sage-600 font-medium flex items-start gap-1.5 px-1">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.5} />
            <span>{t("passwordHint")}</span>
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-gradient-to-r from-sage-700 to-sage-800 hover:from-sage-800 hover:to-sage-900 text-white font-bold rounded-lg transition-all duration-300 transform hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide mt-5"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("creating")}
              </span>
            ) : (
              t("submit")
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sage-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-sage-500 font-medium">
              {t("hasAccount")}
            </span>
          </div>
        </div>

        {/* Sign In Link */}
        <Link
          href="/login"
          className="block w-full h-10 rounded-lg border-2 border-sage-300 bg-white text-sage-700 font-bold text-sm text-center flex items-center justify-center hover:bg-sage-50 transition-all duration-200 tracking-wide"
        >
          {t("login")}
        </Link>
      </div>

      {/* Footer Help Text */}
      <p className="mt-4 text-center text-sage-600 text-xs font-medium max-w-md mx-auto">
        {t("needHelp")}{" "}
        <a href="mailto:support@hce-x.com" className="text-sage-700 font-bold hover:underline">
          {t("contactSupport")}
        </a>
      </p>
    </div>
  );
}
