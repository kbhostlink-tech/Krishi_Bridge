"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield, Lock, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, AlertTriangle, PartyPopper,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPLIANCE_ADMIN: "Compliance Admin",
  OPS_ADMIN: "Operations Admin",
  DATA_AUDIT_ADMIN: "Data & Audit Admin",
  READ_ONLY_ADMIN: "Read-Only Admin",
};

interface InviteInfo {
  email: string;
  name: string;
  adminRole: string;
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const token = params.token || "";

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "success">("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("No invitation token provided.");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/admin-setup?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setInvite(data.invitation);
          setStatus("valid");
        } else if (res.status === 410) {
          setStatus("expired");
          setErrorMsg(data.error || "This invitation has expired.");
        } else {
          setStatus("invalid");
          setErrorMsg(data.error || "Invalid invitation link.");
        }
      } catch {
        setStatus("invalid");
        setErrorMsg("Could not verify invitation. Please try again.");
      }
    };

    validateToken();
  }, [token]);

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPassed && passwordsMatch && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/admin-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        toast.success("Account created! Redirecting to login...");
        setTimeout(() => {
          router.push("/en/login");
        }, 3000);
      } else {
        toast.error(data.error || "Failed to set up account");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───────────────────────────────

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sage-500 animate-spin mx-auto mb-3" />
          <p className="text-sage-500 text-sm">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / Expired ─────────────────────

  if (status === "invalid" || status === "expired") {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sage-100 shadow-lg p-8 text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              status === "expired" ? "bg-amber-50" : "bg-red-50"
            }`}
          >
            {status === "expired" ? (
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold mb-2">
            {status === "expired" ? "Invitation Expired" : "Invalid Invitation"}
          </h1>
          <p className="text-sage-500 text-sm mb-6 leading-relaxed">{errorMsg}</p>
          <p className="text-sage-400 text-xs">
            Please contact the Super Admin to request a new invitation.
          </p>
        </div>
      </div>
    );
  }

  // ─── Success ───────────────────────────────

  if (status === "success") {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sage-100 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <PartyPopper className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-heading text-sage-900 text-2xl font-bold mb-2">Account Created!</h1>
          <p className="text-sage-500 text-sm mb-4">
            Your admin account has been set up successfully. You can now log in with your email and password.
          </p>
          <div className="flex items-center justify-center gap-2 text-sage-400 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Redirecting to login...
          </div>
        </div>
      </div>
    );
  }

  // ─── Valid — Password Setup Form ───────────

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header Card */}
        <div className="bg-sage-900 rounded-t-3xl p-6 text-center">
          <div className="w-12 h-12 bg-sage-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading text-white text-xl font-bold mb-1">Set Up Your Admin Account</h1>
          <p className="text-sage-400 text-sm">Krishibridge</p>
        </div>

        {/* Invite Info */}
        <div className="bg-sage-800 px-6 py-4 flex items-center justify-between text-sm">
          <div>
            <p className="text-sage-300 text-xs">Invited as</p>
            <p className="text-white font-semibold">{ROLE_LABELS[invite?.adminRole || ""] || invite?.adminRole}</p>
          </div>
          <div className="text-right">
            <p className="text-sage-300 text-xs">Email</p>
            <p className="text-white font-medium text-xs">{invite?.email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-3xl border border-t-0 border-sage-100 shadow-lg p-6 sm:p-8">
          <p className="text-sage-600 text-sm mb-6">
            Welcome, <strong>{invite?.name}</strong>! Create a strong password to activate your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-sage-700 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-sage-200 bg-linen text-sage-900 text-sm placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Rules */}
            {password.length > 0 && (
              <div className="bg-sage-50 rounded-xl p-4 space-y-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-sage-300" />
                      )}
                      <span className={passed ? "text-emerald-700" : "text-sage-400"}>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label className="block text-sage-700 text-sm font-medium mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-sage-200 bg-linen text-sage-900 text-sm placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 disabled:bg-sage-300 text-white rounded-full font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Activate Admin Account
                </>
              )}
            </button>
          </form>

          <p className="text-sage-400 text-xs text-center mt-5 leading-relaxed">
            By activating your account, you agree to the platform&apos;s terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
