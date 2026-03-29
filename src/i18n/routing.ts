import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi", "ne", "dz", "ar"],
  defaultLocale: "en",
});

export const localeNames: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  ne: "नेपाली",
  dz: "རྫོང་ཁ",
  ar: "العربية",
};

export const localeFlags: Record<string, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  ne: "🇳🇵",
  dz: "🇧🇹",
  ar: "🇸🇦",
};

export const rtlLocales = ["ar"];
