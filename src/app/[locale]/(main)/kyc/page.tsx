"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

// Country-specific document requirements
const COUNTRY_DOCS: Record<string, { docType: string; label: string; required: boolean }[]> = {
  IN: [
    { docType: "aadhaar", label: "Aadhaar Card", required: true },
    { docType: "pan", label: "PAN Card", required: true },
    { docType: "gst", label: "GST Certificate (Farmers only)", required: false },
  ],
  NP: [
    { docType: "citizenship", label: "Citizenship Card", required: true },
    { docType: "pan", label: "PAN Card", required: true },
  ],
  BT: [
    { docType: "citizenship_id", label: "Citizenship ID", required: true },
  ],
  AE: [
    { docType: "emirates_id", label: "Emirates ID", required: true },
    { docType: "trade_license", label: "Trade License", required: false },
  ],
  SA: [
    { docType: "iqama", label: "Iqama / National ID", required: true },
    { docType: "trade_license", label: "Trade License", required: false },
  ],
  OM: [
    { docType: "national_id", label: "National ID", required: true },
    { docType: "trade_license", label: "Trade License", required: false },
  ],
};

interface UploadedDoc {
  id: string;
  docType: string;
  docUrl: string;
  viewUrl?: string;
  remarks: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

const KYC_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function KycPage() {
  const t = useTranslations("kyc");
  const { user, accessToken } = useAuth();

  const [kycStatus, setKycStatus] = useState<string>("PENDING");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // Fetch KYC status on mount
  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/kyc/status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKycStatus(data.kycStatus);
        setDocuments(data.documents);
      }
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, [accessToken]);

  // Load on first render
  useState(() => {
    fetchStatus();
  });

  const handleUpload = async (docType: string, file: File) => {
    if (!accessToken) return;
    setUploading((prev) => ({ ...prev, [docType]: true }));
    setError("");

    try {
      // Send file directly to our API — server uploads to R2, no CORS issues
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const uploadRes = await fetch("/api/kyc/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        setError(data.error || "Failed to upload file. Please try again.");
        return;
      }

      const { key } = await uploadRes.json();

      // Record the document in our DB
      const submitRes = await fetch("/api/kyc/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ docType, docUrl: key }),
      });

      if (!submitRes.ok) {
        const data = await submitRes.json();
        setError(data.error || "Failed to save document record");
        return;
      }

      // Refresh status
      await fetchStatus();
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading((prev) => ({ ...prev, [docType]: false }));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-sage-500 mb-4">Please log in to manage your KYC documents.</p>
        <Link href="/login" className="inline-flex h-10 px-6 items-center bg-sage-700 text-white rounded-full font-medium text-sm">
          Go to Login
        </Link>
      </div>
    );
  }

  const countryDocs = COUNTRY_DOCS[user.country] || COUNTRY_DOCS["IN"];
  const statusInfo = KYC_STATUS_MAP[kycStatus] || KYC_STATUS_MAP.PENDING;
  const uploadedTypes = new Set(documents.map((d) => d.docType));

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p className="font-script text-sage-500 text-lg">{t("tagline")}</p>
        <h1 className="font-heading text-sage-900 text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Status Card */}
      <Card className="rounded-3xl border-sage-100">
        <CardHeader>
          <CardTitle className="font-heading text-sage-900">{t("statusTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sage-600 text-sm">{t("currentStatus")}:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {kycStatus === "REJECTED" && documents.some((d) => d.remarks) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <strong>{t("rejectionReason")}:</strong>{" "}
              {documents.find((d) => d.remarks)?.remarks}
            </div>
          )}
          {kycStatus === "APPROVED" && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              {t("approvedMessage")}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Document Upload Section */}
      <Card className="rounded-3xl border-sage-100">
        <CardHeader>
          <CardTitle className="font-heading text-sage-900">{t("documentsTitle")}</CardTitle>
          <p className="text-sage-500 text-sm">{t("documentsSubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {countryDocs.map((docReq) => {
            const isUploaded = uploadedTypes.has(docReq.docType);
            const docRecord = documents.find((d) => d.docType === docReq.docType);
            const isUploading = uploading[docReq.docType];

            return (
              <div
                key={docReq.docType}
                className="flex items-center justify-between p-4 rounded-2xl border border-sage-100 bg-sage-50/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sage-900 text-sm">{docReq.label}</span>
                    {docReq.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {isUploaded && docRecord && (
                    <p className="text-xs text-sage-500 mt-1">
                      Uploaded {new Date(docRecord.createdAt).toLocaleDateString()}
                      {docRecord.verifiedAt && " • Verified"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isUploaded && docRecord?.viewUrl && (
                    <a
                      href={docRecord.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 px-4 items-center text-sage-700 border border-sage-200 rounded-full text-xs font-medium hover:bg-sage-50 transition-colors"
                    >
                      {t("viewDoc")}
                    </a>
                  )}
                  {kycStatus !== "APPROVED" && (
                    <label className={`inline-flex h-9 px-4 items-center rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isUploaded
                        ? "bg-sage-100 text-sage-700 hover:bg-sage-200"
                        : "bg-sage-700 text-white hover:bg-sage-800"
                    } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {isUploading ? t("uploading") : isUploaded ? t("reupload") : t("upload")}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              setError("File must be under 10MB");
                              return;
                            }
                            handleUpload(docReq.docType, file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card className="rounded-3xl border-sage-100">
        <CardContent className="pt-6">
          <h3 className="font-heading text-sage-900 text-sm font-semibold mb-3">{t("guidelinesTitle")}</h3>
          <ul className="space-y-1.5 text-sage-500 text-xs">
            <li>• {t("guideline1")}</li>
            <li>• {t("guideline2")}</li>
            <li>• {t("guideline3")}</li>
            <li>• {t("guideline4")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
