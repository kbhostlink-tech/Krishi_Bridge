"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyOtpPage() {
  const t = useTranslations("auth.otp");
  const appT = useTranslations("app");
  const commonT = useTranslations("common");
  const navT = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "otp_not_found_or_expired":
        return t("expired");
      case "otp_attempts_exceeded":
        return t("attemptsExceeded");
      case "otp_invalid":
        return t("invalid");
      case "email_already_verified":
        return t("alreadyVerified");
      case "otp_rate_limited":
        return t("rateLimited");
      case "user_id_required":
      case "user_not_found":
        return t("invalidLink");
      case "validation_failed":
        return commonT("validationError");
      default:
        return commonT("error");
    }
  };

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError(t("codeIncomplete"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(getErrorMessage(data?.errorCode));
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(commonT("networkError"));
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(getErrorMessage(data?.errorCode));
        return;
      }

      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError(commonT("networkError"));
    }
  };

  if (!userId) {
    return (
      <div className="text-center">
        <p className="text-sage-500">{t("invalidLink")}</p>
        <Link href="/register" className="text-sage-700 font-medium hover:underline">
          {navT("register")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#2d5a3f" />
            <path d="M5 32 L15 14 L20.5 22 L25 16 L35 32 Z" fill="white" fillOpacity="0.92" />
            <path d="M15 14 L18 20 L12 20 Z" fill="white" />
            <circle cx="30" cy="10" r="3" fill="white" fillOpacity="0.45" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-sage-900 text-[15px] font-bold leading-none">Krishibridge</span>
            <span className="text-sage-500 text-[9px] leading-tight">{appT("tagline")}</span>
          </div>
        </Link>
      </div>

      <h1 className="font-heading text-sage-900 text-3xl font-bold mb-2">
        {t("title")}
      </h1>
      <p className="text-sage-500 mb-8">{t("subtitle")}</p>

      {success && (
        <div className="bg-sage-50 border border-sage-200 text-sage-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {t("success")} {commonT("redirecting")}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Input Grid */}
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-heading font-bold rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || success}
          className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
        >
          {isSubmitting ? t("verifying") : t("submit")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sage-700 font-medium text-sm hover:underline disabled:text-sage-300 disabled:no-underline"
        >
          {resendCooldown > 0
            ? t("resendIn", { seconds: resendCooldown })
            : t("resend")}
        </button>
      </div>
    </div>
  );
}
