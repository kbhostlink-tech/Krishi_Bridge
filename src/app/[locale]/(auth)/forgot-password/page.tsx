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
        <Link href="/" className="font-heading text-sage-700 text-xl font-bold">
          AgriExchange
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
