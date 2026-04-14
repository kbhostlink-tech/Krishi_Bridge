"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="w-full min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity">
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

        <h1 className="font-heading text-sage-900 text-3xl font-bold mb-2 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sage-600 text-sm font-medium max-w-sm mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 border-l-4 border-l-red-500 flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 font-medium text-xs">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="password" 
                className="text-sage-800 font-semibold text-xs"
              >
                {t("password")}
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-sage-600 hover:text-sage-800 hover:underline transition-colors duration-200"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onPaste={(e) => e.preventDefault()}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 pr-10 rounded-lg border-2 border-sage-200 bg-white text-sage-900 placeholder:text-sage-400 focus:border-sage-600 focus:ring-2 focus:ring-sage-600 focus:ring-offset-0 transition-all duration-200 font-medium text-sm"
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-sage-700 to-sage-800 hover:from-sage-800 hover:to-sage-900 text-white font-bold rounded-lg transition-all duration-300 transform hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide mt-6"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              t("submit")
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sage-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-sage-500 font-medium">
              New here?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <Link
          href="/register"
          className="block w-full h-11 rounded-lg border-2 border-sage-300 bg-white text-sage-700 font-bold text-sm text-center flex items-center justify-center hover:bg-sage-50 transition-all duration-200 tracking-wide"
        >
          Create Account
        </Link>
      </div>

      {/* Footer Help Text */}
      <p className="mt-6 text-center text-sage-600 text-xs font-medium max-w-md mx-auto">
        Having trouble? {" "}
        <a href="mailto:support@hce-x.com" className="text-sage-700 font-bold hover:underline">
          Contact us
        </a>
      </p>
    </div>
  );
}
