"use client";

import { useCallback, useEffect, useState } from "react";

import { MetricCard, PageHeader, Surface } from "@/components/ui/console-kit";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";

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
  BT: [{ docType: "citizenship_id", label: "Citizenship ID", required: true }],
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

const KYC_STATUS_MAP: Record<string, { label: string; color: string; tone: "amber" | "teal" | "rose" | "slate" }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", tone: "amber" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", tone: "slate" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", tone: "teal" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", tone: "rose" },
};

export default function KycPage() {
  const t = useTranslations("kyc");
  const { user, accessToken } = useAuth();

  const [kycStatus, setKycStatus] = useState<string>("PENDING");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUpload = async (docType: string, file: File) => {
    if (!accessToken) return;
    setUploading((prev) => ({ ...prev, [docType]: true }));
    setError("");

    try {
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

      await fetchStatus();
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading((prev) => ({ ...prev, [docType]: false }));
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse bg-[#ece4d6]" />
        <div className="h-10 w-72 animate-pulse bg-[#ece4d6]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse border border-[#ddd4c4] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-sage-500">Please log in to manage your KYC documents.</p>
        <Link href="/login" className="inline-flex h-10 items-center border border-[#405742] bg-[#405742] px-6 text-sm font-medium text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  const countryDocs = COUNTRY_DOCS[user.country] || COUNTRY_DOCS.IN;
  const statusInfo = KYC_STATUS_MAP[kycStatus] || KYC_STATUS_MAP.PENDING;
  const uploadedTypes = new Set(documents.map((d) => d.docType));
  const requiredCount = countryDocs.filter((doc) => doc.required).length;
  const uploadedRequiredCount = countryDocs.filter((doc) => doc.required && uploadedTypes.has(doc.docType)).length;
  const verifiedCount = documents.filter((doc) => doc.verifiedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label={t("currentStatus")} value={statusInfo.label} tone={statusInfo.tone} />
        <MetricCard label={t("requiredDocs")} value={requiredCount} tone="slate" />
        <MetricCard label={t("requiredUploaded")} value={uploadedRequiredCount} tone="olive" />
        <MetricCard label={t("verifiedFiles")} value={verifiedCount} tone="teal" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_360px]">
        <Surface className="p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone-950">{t("statusTitle")}</p>
              </div>
              <span className={`inline-flex items-center border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            {kycStatus === "REJECTED" && documents.some((doc) => doc.remarks) ? (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <strong>{t("rejectionReason")}:</strong> {documents.find((doc) => doc.remarks)?.remarks}
              </div>
            ) : null}

            {kycStatus === "APPROVED" ? (
              <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t("approvedMessage")}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-stone-950">{t("guidelinesTitle")}</p>
            </div>
            <div className="grid gap-3 text-sm text-stone-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#405742]" />
                <span>{t("guideline1")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#405742]" />
                <span>{t("guideline2")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#405742]" />
                <span>{t("guideline3")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#405742]" />
                <span>{t("guideline4")}</span>
              </div>
            </div>
          </div>
        </Surface>
      </div>

      <Surface className="p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-stone-950">{t("documentsTitle")}</p>
        </div>

        <div className="grid gap-3">
          {countryDocs.map((docReq) => {
            const isUploaded = uploadedTypes.has(docReq.docType);
            const docRecord = documents.find((doc) => doc.docType === docReq.docType);
            const isUploading = uploading[docReq.docType];

            return (
              <div key={docReq.docType} className="grid gap-3 border border-[#ddd4c4] bg-[#fffdf8] p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-950">{docReq.label}</p>
                    {docReq.required ? <Badge className="bg-amber-50 text-amber-700">Required</Badge> : <Badge variant="outline">Optional</Badge>}
                    {docRecord?.verifiedAt ? <Badge className="bg-emerald-50 text-emerald-700">Verified</Badge> : null}
                  </div>
                  <p className="text-sm text-stone-600">
                    {isUploaded && docRecord
                      ? `Uploaded ${new Date(docRecord.createdAt).toLocaleDateString()}`
                      : "No file uploaded yet."}
                  </p>
                  {docRecord?.remarks ? (
                    <p className="text-sm text-red-700">Reviewer note: {docRecord.remarks}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {isUploaded && docRecord?.viewUrl ? (
                    <a
                      href={docRecord.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center border border-[#d7cfbf] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      {t("viewDoc")}
                    </a>
                  ) : null}

                  {kycStatus !== "APPROVED" ? (
                    <label className={`inline-flex h-10 cursor-pointer items-center border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                      isUploaded
                        ? "border-[#d7cfbf] bg-white text-stone-700 hover:bg-[#faf6ee]"
                        : "border-[#405742] bg-[#405742] text-white hover:bg-[#2f422e]"
                    } ${isUploading ? "pointer-events-none opacity-50" : ""}`}>
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
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
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>


    </div>
  );
}