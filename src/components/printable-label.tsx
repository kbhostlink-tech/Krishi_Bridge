"use client";

import { useRef } from "react";

interface PrintableLabelProps {
  lotNumber: string;
  commodityType: string;
  grade: string;
  quantityKg: number;
  warehouseName: string;
  farmerName: string;
  origin: { country?: string; state?: string; district?: string };
  qrImageUrl: string | null;
}

const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Large Cardamom", TEA: "Tea", GINGER: "Ginger",
  TURMERIC: "Turmeric", PEPPER: "Pepper", COFFEE: "Coffee",
  SAFFRON: "Saffron", ARECA_NUT: "Areca Nut", CINNAMON: "Cinnamon", OTHER: "Other",
};

export function PrintableLabel(props: PrintableLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!labelRef.current) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const originStr = [props.origin?.district, props.origin?.state, props.origin?.country]
      .filter(Boolean)
      .join(", ");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label — ${props.lotNumber}</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          body { margin: 0; padding: 8mm; font-family: 'Segoe UI', sans-serif; }
          .label { border: 2px solid #1a3a2a; border-radius: 8px; padding: 6mm; }
          .header { text-align: center; border-bottom: 1px solid #d4e8dc; padding-bottom: 4mm; margin-bottom: 4mm; }
          .header h1 { font-size: 14pt; color: #1a3a2a; margin: 0; font-weight: 700; }
          .header p { font-size: 8pt; color: #4a7c5c; margin: 2mm 0 0; }
          .lot-number { text-align: center; font-size: 18pt; font-weight: 800; color: #1a3a2a; margin: 4mm 0; letter-spacing: 1px; }
          .details { font-size: 9pt; color: #2d5a3f; }
          .row { display: flex; justify-content: space-between; padding: 1.5mm 0; border-bottom: 1px dashed #d4e8dc; }
          .row:last-child { border-bottom: none; }
          .lbl { color: #8fb49e; font-weight: 500; }
          .val { font-weight: 600; text-align: right; }
          .qr-section { text-align: center; margin-top: 4mm; padding-top: 4mm; border-top: 1px solid #d4e8dc; }
          .qr-section img { width: 30mm; height: 30mm; }
          .qr-section p { font-size: 7pt; color: #8fb49e; margin-top: 2mm; }
          .footer { text-align: center; margin-top: 3mm; font-size: 7pt; color: #8fb49e; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <h1>AgriExchange</h1>
            <p>Agricultural Commodity Exchange</p>
          </div>
          <div class="lot-number">${props.lotNumber}</div>
          <div class="details">
            <div class="row"><span class="lbl">Commodity</span><span class="val">${COMMODITY_LABELS[props.commodityType] || props.commodityType}</span></div>
            <div class="row"><span class="lbl">Grade</span><span class="val">${props.grade}</span></div>
            <div class="row"><span class="lbl">Quantity</span><span class="val">${props.quantityKg.toLocaleString()} kg</span></div>
            <div class="row"><span class="lbl">Origin</span><span class="val">${originStr || "—"}</span></div>
            <div class="row"><span class="lbl">Warehouse</span><span class="val">${props.warehouseName}</span></div>
            <div class="row"><span class="lbl">Farmer</span><span class="val">${props.farmerName}</span></div>
          </div>
          ${props.qrImageUrl ? `
          <div class="qr-section">
            <img src="${props.qrImageUrl}" alt="QR" />
            <p>Scan to verify authenticity</p>
          </div>` : ""}
          <div class="footer">HMAC-SHA256 Verified &bull; ${new Date().toLocaleDateString()}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* On-screen preview */}
      <div ref={labelRef} className="border-2 border-sage-200 rounded-2xl p-5 bg-white max-w-xs mx-auto">
        <div className="text-center border-b border-sage-100 pb-3 mb-3">
          <p className="font-heading text-sage-900 text-sm font-bold">AgriExchange</p>
          <p className="text-sage-500 text-[10px]">Agricultural Commodity Exchange</p>
        </div>
        <p className="text-center font-heading text-sage-900 text-xl font-extrabold tracking-wide mb-3">
          {props.lotNumber}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-sage-400">Commodity</span>
            <span className="text-sage-800 font-medium">{COMMODITY_LABELS[props.commodityType] || props.commodityType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-400">Grade</span>
            <span className="text-sage-800 font-medium">{props.grade}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-400">Quantity</span>
            <span className="text-sage-800 font-medium">{props.quantityKg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-400">Warehouse</span>
            <span className="text-sage-800 font-medium">{props.warehouseName}</span>
          </div>
        </div>
        {props.qrImageUrl && (
          <div className="text-center mt-3 pt-3 border-t border-sage-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.qrImageUrl} alt="QR" className="w-24 h-24 mx-auto rounded-lg" />
            <p className="text-sage-400 text-[10px] mt-1">Scan to verify</p>
          </div>
        )}
      </div>

      <button
        onClick={handlePrint}
        className="mt-4 w-full py-2.5 bg-sage-700 text-white rounded-full text-sm font-medium hover:bg-sage-800 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Label
      </button>
    </div>
  );
}
