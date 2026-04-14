"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span className="font-heading text-sage-900 text-[15px] font-bold leading-none">HCE-X</span>
            <span className="text-sage-500 text-[9px] leading-tight">Himalayan Commodity Exchange</span>
          </div>
        </Link>
      </div>

      <h1 className="font-heading text-sage-900 text-3xl font-bold mb-2">
        {t("title")}
      </h1>
      <p className="text-sage-500 mb-8">{t("subtitle")}</p>

      {sent ? (
        <div className="space-y-6">
          <div className="bg-sage-50 border border-sage-200 text-sage-700 px-4 py-4 rounded-xl text-sm leading-relaxed">
            <p className="font-medium mb-1">{t("sentTitle")}</p>
            <p>{t("sentMessage")}</p>
          </div>
          <p className="text-center text-sage-500 text-sm">
            <Link href="/login" className="text-sage-700 font-medium hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
            >
              {isSubmitting ? t("sending") : t("submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sage-500 text-sm">
            {t("rememberPassword")}{" "}
            <Link href="/login" className="text-sage-700 font-medium hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
