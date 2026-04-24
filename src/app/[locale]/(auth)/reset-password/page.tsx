"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const appT = useTranslations("app");
  const commonT = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!token) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2d5a3f" />
              <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
              <path d="M15 14 L18 20 L12 20 Z" fill="white" />
              <circle cx="30" cy="10" r="3" fill="white" fillOpacity="0.45" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sage-900 text-sm font-bold leading-none">Krishibridge</span>
              <span className="text-sage-500 text-[9px] leading-tight tracking-wide">{appT("tagline")}</span>
            </div>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl text-sm">
          <p className="font-medium mb-1">{t("invalidLinkTitle")}</p>
          <p>{t("invalidLinkMessage")}</p>
        </div>
        <p className="mt-6 text-center text-sage-500 text-sm">
          <Link href="/forgot-password" className="text-sage-700 font-medium hover:underline">
            {t("requestNewLink")}
          </Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':",./<>?\\|`~])/.test(password)) {
      setError(t("passwordPolicy"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.errorCode === "reset_link_invalid") {
          setError(t("invalidLinkMessage"));
        } else if (data?.errorCode === "rate_limited") {
          setError(t("rateLimited"));
        } else if (data?.errorCode === "validation_failed") {
          setError(commonT("validationError"));
        } else {
          setError(commonT("error"));
        }
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError(commonT("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#2d5a3f" />
            <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
            <path d="M15 14 L18 20 L12 20 Z" fill="white" />
            <circle cx="30" cy="10" r="3" fill="white" fillOpacity="0.45" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-sage-900 text-sm font-bold leading-none">Krishibridge</span>
            <span className="text-sage-500 text-[9px] leading-tight tracking-wide">{appT("tagline")}</span>
          </div>
        </Link>
      </div>
      <h1 className="font-heading text-sage-900 text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sage-500 mb-8">{t("subtitle")}</p>

      {success ? (
        <div className="space-y-6">
          <div className="bg-sage-50 border border-sage-200 text-sage-700 px-4 py-4 rounded-xl text-sm leading-relaxed">
            <p className="font-medium mb-1">{t("successTitle")}</p>
            <p>{t("successMessage")}</p>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sage-700 font-medium">{t("newPassword")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("newPasswordPlaceholder")}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? commonT("hidePassword") : commonT("showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-700 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sage-700 font-medium">{t("confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? commonT("hidePassword") : commonT("showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-700 transition-colors p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
            >
              {isSubmitting ? t("resetting") : t("submit")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-sage-200 border-t-sage-700 animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
