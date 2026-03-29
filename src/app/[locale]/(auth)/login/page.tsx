"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await login(email, password);

    setIsSubmitting(false);

    if (result.success) {
      router.push(returnUrl || "/dashboard");
    } else {
      setError(result.error || "Login failed");
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
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sage-700 font-medium">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sage-700 font-medium">
              {t("password")}
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-sage-500 hover:text-sage-700 transition-colors"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
        >
          {isSubmitting ? "Signing in..." : t("submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sage-500 text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-sage-700 font-medium hover:underline">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
