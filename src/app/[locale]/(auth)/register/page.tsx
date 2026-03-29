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

const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
];

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { register } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "" as "FARMER" | "BUYER" | "",
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

    setIsSubmitting(true);
    setError("");

    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      role: form.role as "FARMER" | "BUYER",
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
    <div>
      <div className="mb-8">
        <Link href="/" className="font-heading text-sage-700 text-xl font-bold">
          AgriExchange
        </Link>
      </div>

      <h1 className="font-heading text-sage-900 text-3xl font-bold mb-2">
        {t("title")}
      </h1>
      <p className="text-sage-500 mb-8">{t("subtitle")}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sage-700 font-medium">
            {t("name")}
          </Label>
          <Input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter your full name"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sage-700 font-medium">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sage-700 font-medium">
            {t("phone")}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sage-700 font-medium">
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label className="text-sage-700 font-medium">{t("role")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange("role", "FARMER")}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                form.role === "FARMER"
                  ? "border-sage-700 bg-sage-50 shadow-sm"
                  : "border-sage-100 bg-white hover:border-sage-300"
              }`}
            >
              <span className="text-2xl mb-1">🌾</span>
              <span className="text-sm font-medium text-sage-900">
                {t("roleFarmer")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleChange("role", "BUYER")}
              className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                form.role === "BUYER"
                  ? "border-sage-700 bg-sage-50 shadow-sm"
                  : "border-sage-100 bg-white hover:border-sage-300"
              }`}
            >
              <span className="text-2xl mb-1">🛒</span>
              <span className="text-sm font-medium text-sage-900">
                {t("roleBuyer")}
              </span>
            </button>
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label className="text-sage-700 font-medium">{t("country")}</Label>
          <Select value={form.country} onValueChange={(v) => handleChange("country", v ?? "")}>
            <SelectTrigger className="h-12 rounded-xl border-sage-200 bg-white">
              <SelectValue placeholder="Select your country" />
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

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
        >
          {isSubmitting ? "Creating account..." : t("submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sage-500 text-sm">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-sage-700 font-medium hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
