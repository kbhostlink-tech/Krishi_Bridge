"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India",
  NP: "Nepal",
  BT: "Bhutan",
  AE: "UAE",
  SA: "Saudi Arabia",
  OM: "Oman",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ne: "Nepali",
  dz: "Dzongkha",
  ar: "Arabic",
};

export default function ProfilePage() {
  const t = useTranslations("common");
  const { user, accessToken, setUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [preferredLang, setPreferredLang] = useState(user?.preferredLang || "en");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Fetch full profile on mount
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.user.name);
          setPhone(data.user.phone || "");
          setPreferredLang(data.user.preferredLang || "en");
        } else {
          toast.error("Failed to load profile");
        }
      } catch {
        toast.error("Network error loading profile");
      } finally {
        setLoaded(true);
      }
    })();
  }, [accessToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, phone: phone || undefined, preferredLang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setUser(data.user);
      setSuccess("Profile updated successfully");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-sage-500 mb-4">Please log in to view your profile.</p>
        <Link href="/login" className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm">
          Go to Login
        </Link>
      </div>
    );
  }

  const kycBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pending", variant: "secondary" },
    UNDER_REVIEW: { label: "Under Review", variant: "outline" },
    APPROVED: { label: "Approved", variant: "default" },
    REJECTED: { label: "Rejected", variant: "destructive" },
  };
  const kyc = kycBadge[user.kycStatus] || kycBadge.PENDING;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="font-script text-sage-500 text-lg">Your account</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">Profile & Settings</h1>
      </div>

      {/* Account Info Card */}
      <Card className="rounded-3xl border-sage-100">
        <CardHeader>
          <CardTitle className="font-heading text-sage-900">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center text-sage-700 font-heading text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-heading font-bold text-sage-900 text-lg">{user.name}</p>
              <p className="text-sage-500 text-sm">{user.email}</p>
            </div>
          </div>
          <Separator className="bg-sage-100" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-sage-400 text-xs uppercase tracking-wider">Role</span>
              <p className="font-medium text-sage-900 mt-0.5">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </p>
            </div>
            <div>
              <span className="text-sage-400 text-xs uppercase tracking-wider">Country</span>
              <p className="font-medium text-sage-900 mt-0.5">
                {COUNTRY_NAMES[user.country] || user.country}
              </p>
            </div>
            <div>
              <span className="text-sage-400 text-xs uppercase tracking-wider">KYC Status</span>
              <div className="mt-1">
                <Badge variant={kyc.variant} className="text-xs">{kyc.label}</Badge>
              </div>
            </div>
            <div>
              <span className="text-sage-400 text-xs uppercase tracking-wider">Email Verified</span>
              <p className="font-medium text-sage-900 mt-0.5">
                {user.emailVerified ? "Yes ✓" : "No — Check your inbox"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="rounded-3xl border-sage-100">
        <CardHeader>
          <CardTitle className="font-heading text-sage-900">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-sage-50 border border-sage-200 text-sage-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sage-700 font-medium">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sage-700 font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="h-12 rounded-xl border-sage-200 bg-white focus:border-sage-500 focus:ring-sage-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang" className="text-sage-700 font-medium">Preferred Language</Label>
              <Select value={preferredLang} onValueChange={(val) => { if (val) setPreferredLang(val); }}>
                <SelectTrigger className="h-12 rounded-xl border-sage-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_NAMES).map(([code, label]) => (
                    <SelectItem key={code} value={code}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 px-8 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-full transition-colors duration-200"
            >
              {isSaving ? "Saving..." : t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="rounded-3xl border-sage-100">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Link
              href="/kyc"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span>📋</span>
                <span className="text-sage-700 text-sm font-medium">KYC Documents</span>
              </div>
              <span className="text-sage-400">→</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span>📊</span>
                <span className="text-sage-700 text-sm font-medium">Dashboard</span>
              </div>
              <span className="text-sage-400">→</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
