"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import {
  COMPANY_LEGAL_NAME,
  CONTACT_OFFICES,
  officeMapEmbedUrl,
  officeMapExternalUrl,
  type ContactOffice,
} from "@/lib/contact-offices";
import { normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";

const COPY: Record<
  LocaleCode,
  {
    title: string;
    subtitle: string;
    mapLabel: string;
    openInMaps: string;
  }
> = {
  en: {
    title: "Our offices",
    subtitle: "Visit or reach us at our registered locations across the Himalayan corridor.",
    mapLabel: "Location map",
    openInMaps: "Open in Google Maps",
  },
  hi: {
    title: "हमारे कार्यालय",
    subtitle: "हिमालयी कॉरिडोर में हमारे पंजीकृत स्थानों पर हमसे मिलें या संपर्क करें।",
    mapLabel: "स्थान मानचित्र",
    openInMaps: "Google Maps में खोलें",
  },
  ne: {
    title: "हाम्रा कार्यालयहरू",
    subtitle: "हिमालयी क्षेत्रभरि हाम्रा दर्ता भएका स्थानहरूमा भेट्नुहोस् वा सम्पर्क गर्नुहोस्।",
    mapLabel: "स्थान नक्सा",
    openInMaps: "Google Maps मा खोल्नुहोस्",
  },
  dz: {
    title: "ང་བཅས་ཀྱི་ལས་ཁུངས་ཚུ།",
    subtitle: "ཧི་མ་ལ་ཡའི་ལམ་བུ་ནང་གི་དྲ་ཐག་ཡོད་པའི་ས་གནས་ཚུ་ནང་འབྲེལ་བ་འབད།",
    mapLabel: "ས་གནས་ས་ཁྲ།",
    openInMaps: "Google Maps ནང་ཁ་ཕྱེ།",
  },
  ar: {
    title: "مكاتبنا",
    subtitle: "زرنا أو تواصل معنا في مواقعنا المسجلة عبر ممر الهيمالايا.",
    mapLabel: "خريطة الموقع",
    openInMaps: "فتح في خرائط Google",
  },
};

function OfficeCard({
  office,
  locale,
  selected,
  onSelect,
}: {
  office: ContactOffice;
  locale: LocaleCode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-5 text-left shadow-sm transition-colors ${
        selected
          ? "border-sage-400 bg-white ring-2 ring-sage-200"
          : "border-sage-100 bg-white hover:border-sage-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-800">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-terracotta">
            {office.countryLabel[locale]}
          </p>
          <address className="mt-2 space-y-0.5 not-italic text-sm leading-6 text-sage-700">
            {office.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      </div>
    </button>
  );
}

export function ContactOfficesMap() {
  const locale = normalizeLocale(useLocale());
  const copy = COPY[locale];
  const [selectedId, setSelectedId] = useState<ContactOffice["id"]>("india");
  const selected = CONTACT_OFFICES.find((office) => office.id === selectedId) ?? CONTACT_OFFICES[0];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{COMPANY_LEGAL_NAME}</p>
      <h2 className="mt-4 font-heading text-2xl font-semibold text-sage-950 sm:text-3xl">{copy.title}</h2>
      <p className="mt-3 max-w-3xl text-base leading-8 text-sage-700">{copy.subtitle}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {CONTACT_OFFICES.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              locale={locale}
              selected={office.id === selectedId}
              onSelect={() => setSelectedId(office.id)}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-sage-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-sage-100 px-4 py-3 sm:px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-500">{copy.mapLabel}</p>
              <p className="mt-1 text-sm font-semibold text-sage-950">
                {selected.countryLabel[locale]}
              </p>
            </div>
            <a
              href={officeMapExternalUrl(selected)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage-200 px-3 py-1.5 text-xs font-semibold text-sage-800 transition-colors hover:border-sage-300 hover:bg-sage-50"
            >
              {copy.openInMaps}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="relative aspect-[4/3] w-full bg-sage-50 sm:aspect-[16/11]">
            <iframe
              key={selected.id}
              title={`${selected.countryLabel[locale]} office location`}
              src={officeMapEmbedUrl(selected)}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
