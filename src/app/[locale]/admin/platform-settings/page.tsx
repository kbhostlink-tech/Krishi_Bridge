"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

interface PlatformAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  swiftCode: string;
  upiId: string;
  additionalInstructions: string;
}

const EMPTY_ACCOUNT: PlatformAccount = {
  accountHolderName: "",
  accountNumber: "",
  bankName: "",
  branchName: "",
  ifscCode: "",
  swiftCode: "",
  upiId: "",
  additionalInstructions: "",
};

export default function PlatformSettingsPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<PlatformAccount>(EMPTY_ACCOUNT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/admin/platform-settings", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setForm({ ...EMPTY_ACCOUNT, ...data.settings });
        }
      }
    } catch {
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Platform bank account settings saved!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformAccount, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Platform Settings</h1>
        <Card className="rounded-3xl border-sage-100 animate-pulse">
          <CardContent className="p-8">
            <div className="h-40 bg-sage-100 rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-sage-900 text-2xl font-bold">Platform Settings</h1>
        <p className="text-sage-500 text-sm mt-0.5">
          Configure the platform bank account that buyers pay into.
        </p>
      </div>

      <Card className="rounded-3xl border-sage-100">
        <CardContent className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-start gap-2">
            <Landmark className="w-4 h-4 mt-0.5 shrink-0" />
            <span>These details are shown to buyers when they initiate a payment. Ensure the account details are correct before saving.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sage-700 font-medium text-sm">Account Holder Name *</Label>
              <Input
                value={form.accountHolderName}
                onChange={(e) => updateField("accountHolderName", e.target.value)}
                placeholder="e.g. Krishibridge Pvt Ltd"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">Account Number *</Label>
              <Input
                value={form.accountNumber}
                onChange={(e) => updateField("accountNumber", e.target.value)}
                placeholder="e.g. 1234567890"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">Bank Name *</Label>
              <Input
                value={form.bankName}
                onChange={(e) => updateField("bankName", e.target.value)}
                placeholder="e.g. State Bank of India"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">Branch Name</Label>
              <Input
                value={form.branchName}
                onChange={(e) => updateField("branchName", e.target.value)}
                placeholder="e.g. MG Road Branch"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">IFSC Code</Label>
              <Input
                value={form.ifscCode}
                onChange={(e) => updateField("ifscCode", e.target.value)}
                placeholder="e.g. SBIN0001234"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">SWIFT Code</Label>
              <Input
                value={form.swiftCode}
                onChange={(e) => updateField("swiftCode", e.target.value)}
                placeholder="For international payments"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
            <div>
              <Label className="text-sage-700 font-medium text-sm">UPI ID</Label>
              <Input
                value={form.upiId}
                onChange={(e) => updateField("upiId", e.target.value)}
                placeholder="e.g. hcex@sbi"
                className="mt-1 rounded-xl border-sage-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-sage-700 font-medium text-sm">Additional Instructions</Label>
            <Textarea
              value={form.additionalInstructions}
              onChange={(e) => updateField("additionalInstructions", e.target.value)}
              placeholder="Any special instructions for buyers (shown during payment)..."
              rows={3}
              className="mt-1 rounded-xl border-sage-200"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !form.accountHolderName || !form.accountNumber || !form.bankName}
              className="rounded-full px-8 bg-sage-700 hover:bg-sage-800 text-white"
            >
              {saving ? "Saving..." : "Save Platform Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
