"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvitationInfo {
  id: string;
  email: string;
  staffRole: string;
  expiresAt: string;
  acceptedAt: string | null;
  isExpired: boolean;
  isAccepted: boolean;
  warehouse: { id: string; name: string; country: string; state: string | null };
  inviterName: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", NP: "🇳🇵", BT: "🇧🇹", AE: "🇦🇪", SA: "🇸🇦", OM: "🇴🇲",
};

const COUNTRY_OPTIONS = [
  { code: "IN", label: "India" },
  { code: "NP", label: "Nepal" },
  { code: "BT", label: "Bhutan" },
  { code: "AE", label: "UAE" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "OM", label: "Oman" },
];

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, accessToken, isLoading: authLoading, setUser, setAccessToken } = useAuth();
  const router = useRouter();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New user registration form
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    country: "",
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link — no token found.");
      setPageLoading(false);
      return;
    }

    fetch(`/api/warehouse/invitation?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvitation(data.invitation);
      })
      .catch(() => setError("Could not load invitation. Please try again."))
      .finally(() => setPageLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!accessToken || !token) return;
    setIsAccepting(true);
    try {
      const res = await fetch("/api/warehouse/invitation/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to accept invitation");
        return;
      }
      toast.success(`Welcome to ${data.warehouse.name}! 🎉`);
      router.push("/warehouse/inventory");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};
    if (!registerData.name.trim() || registerData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (registerData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerData.password)) {
      errors.password = "Must contain uppercase, lowercase, and a number";
    }
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (!registerData.country) {
      errors.country = "Please select your country";
    }
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterAndAccept = async () => {
    if (!token || !validateRegisterForm()) return;
    setIsRegistering(true);
    try {
      const res = await fetch("/api/warehouse/invitation/register-and-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          name: registerData.name.trim(),
          password: registerData.password,
          country: registerData.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details).flat()[0] as string;
          toast.error(firstError || data.error);
        } else {
          toast.error(data.error || "Failed to create account");
        }
        return;
      }
      // Set auth state
      setUser(data.user);
      setAccessToken(data.accessToken);
      toast.success(`Welcome to ${data.warehouse.name}! 🎉`);
      router.push("/warehouse/inventory");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const isLoading = authLoading || pageLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-3">
          <div className="h-40 bg-sage-100 rounded-3xl animate-pulse" />
          <div className="h-24 bg-sage-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl border-sage-100">
          <CardContent className="pt-8 pb-10 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="font-heading text-sage-900 text-xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-sage-500 text-sm max-w-xs mx-auto">{error || "Invitation not found."}</p>
            <Link
              href="/"
              className="inline-block mt-6 text-sage-700 text-sm hover:underline"
            >
              ← Back to AgriExchange
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmailMatch = user?.email?.toLowerCase() === invitation.email.toLowerCase();
  const roleLabel = invitation.staffRole === "MANAGER" ? "Warehouse Manager" : "Warehouse Staff";
  const returnUrl = `/accept-invitation?token=${token}`;

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-sage-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏪</span>
          </div>
          <p className="font-script text-sage-500 text-lg">You&apos;re invited to join</p>
          <h1 className="font-heading text-sage-900 text-2xl font-bold">
            {invitation.warehouse.name}
          </h1>
          <p className="text-sage-400 text-sm mt-1">
            {[COUNTRY_FLAGS[invitation.warehouse.country], invitation.warehouse.state, invitation.warehouse.country]
              .filter(Boolean)
              .join(" ")}
          </p>
        </div>

        {/* Card */}
        <Card className="rounded-3xl border-sage-100">
          <CardContent className="pt-6 pb-6">
            {invitation.isAccepted ? (
              // Already accepted
              <div className="text-center py-2">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-heading text-sage-900 font-bold text-lg">Already Accepted</h3>
                <p className="text-sage-500 text-sm mt-1">
                  This invitation was used on{" "}
                  {new Date(invitation.acceptedAt!).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}.
                </p>
                <Link
                  href="/warehouse/inventory"
                  className="inline-block mt-5 px-6 py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800"
                >
                  Go to Inventory →
                </Link>
              </div>
            ) : invitation.isExpired ? (
              // Expired
              <div className="text-center py-2">
                <div className="text-4xl mb-3">⏰</div>
                <h3 className="font-heading text-sage-900 font-bold text-lg">Invitation Expired</h3>
                <p className="text-sage-500 text-sm mt-1 max-w-xs mx-auto">
                  This invitation expired on{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}. Please ask your admin to send a new invitation.
                </p>
              </div>
            ) : (
              // Active invitation
              <div className="space-y-5">
                {/* Invitation details */}
                <div className="space-y-3 bg-sage-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sage-500">Warehouse</span>
                    <span className="text-sage-900 font-medium">{invitation.warehouse.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sage-500">Your Role</span>
                    <Badge className="bg-sage-700 text-white text-xs">{roleLabel}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sage-500">Invited by</span>
                    <span className="text-sage-900 font-medium">{invitation.inviterName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sage-500">Sent to</span>
                    <span className="text-sage-700 font-medium text-xs">{invitation.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-sage-500">Valid until</span>
                    <span className="text-sage-900 font-medium">
                      {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action area */}
                {!user ? (
                  // Not logged in — show register form or login option
                  <div className="space-y-3">
                    {!showRegisterForm ? (
                      <>
                        <p className="text-sage-500 text-sm text-center">
                          Create your account to accept this invitation, or log in if you already have one.
                        </p>
                        <button
                          onClick={() => setShowRegisterForm(true)}
                          className="block w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 text-center transition-colors"
                        >
                          Create Account & Accept
                        </button>
                        <Link
                          href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                          className="block w-full py-3 border border-sage-300 text-sage-700 rounded-full text-sm font-medium hover:bg-sage-50 text-center transition-colors"
                        >
                          I Already Have an Account
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="bg-sage-50 rounded-2xl p-3 text-xs text-sage-600 text-center">
                          Creating account for <strong>{invitation.email}</strong>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label className="text-sage-700 font-medium text-sm">Full Name</Label>
                          <Input
                            placeholder="Your full name"
                            value={registerData.name}
                            onChange={(e) => setRegisterData(d => ({ ...d, name: e.target.value }))}
                            className="rounded-xl"
                          />
                          {registerErrors.name && (
                            <p className="text-red-500 text-xs">{registerErrors.name}</p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <Label className="text-sage-700 font-medium text-sm">Set Password</Label>
                          <Input
                            type="password"
                            placeholder="Min 8 chars, uppercase + lowercase + number"
                            value={registerData.password}
                            onChange={(e) => setRegisterData(d => ({ ...d, password: e.target.value }))}
                            className="rounded-xl"
                          />
                          {registerErrors.password && (
                            <p className="text-red-500 text-xs">{registerErrors.password}</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <Label className="text-sage-700 font-medium text-sm">Confirm Password</Label>
                          <Input
                            type="password"
                            placeholder="Re-enter your password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData(d => ({ ...d, confirmPassword: e.target.value }))}
                            className="rounded-xl"
                          />
                          {registerErrors.confirmPassword && (
                            <p className="text-red-500 text-xs">{registerErrors.confirmPassword}</p>
                          )}
                        </div>

                        {/* Country */}
                        <div className="space-y-1.5">
                          <Label className="text-sage-700 font-medium text-sm">Country</Label>
                          <Select
                            value={registerData.country}
                            onValueChange={(v) => v && setRegisterData(d => ({ ...d, country: v }))}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_OPTIONS.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {COUNTRY_FLAGS[c.code]} {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {registerErrors.country && (
                            <p className="text-red-500 text-xs">{registerErrors.country}</p>
                          )}
                        </div>

                        <button
                          onClick={handleRegisterAndAccept}
                          disabled={isRegistering}
                          className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-60 transition-colors"
                        >
                          {isRegistering ? "Creating Account..." : `Create Account & Join ${invitation.warehouse.name}`}
                        </button>
                        <button
                          onClick={() => setShowRegisterForm(false)}
                          className="w-full py-2 text-sage-500 text-xs hover:text-sage-700 transition-colors"
                        >
                          ← Back to options
                        </button>
                      </>
                    )}
                  </div>
                ) : !isEmailMatch ? (
                  // Wrong account
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-amber-800 text-sm font-semibold mb-1">⚠ Email Mismatch</p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re
                      logged in as <strong>{user.email}</strong>. Please{" "}
                      <Link href="/login" className="underline">
                        log in
                      </Link>{" "}
                      with the correct account.
                    </p>
                  </div>
                ) : (
                  // Ready to accept
                  <div className="space-y-3">
                    <div className="bg-sage-50 rounded-2xl p-3 text-xs text-sage-600 text-center">
                      Logged in as <strong>{user.email}</strong>
                    </div>
                    <button
                      onClick={handleAccept}
                      disabled={isAccepting}
                      className="w-full py-3 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 disabled:opacity-60 transition-colors"
                    >
                      {isAccepting ? "Joining..." : `Accept & Join ${invitation.warehouse.name}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-sage-400">
          <Link href="/" className="hover:underline">
            ← AgriExchange
          </Link>
        </p>
      </div>
    </div>
  );
}
