"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/" className="font-heading text-sage-700 text-xl font-bold">
            AgriExchange
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

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <Label htmlFor="password" className="text-sage-700 font-medium">
                {t("newPassword")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                min={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={t("newPasswordPlaceholder")}
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sage-700 font-medium">
                {t("confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder={t("confirmPasswordPlaceholder")}
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
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
