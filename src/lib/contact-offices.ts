export const COMPANY_LEGAL_NAME = "Krishibridge Agrifin Technologies Pvt. Ltd.";

export type ContactOffice = {
  id: "india" | "bhutan" | "nepal";
  countryLabel: Record<"en" | "hi" | "ne" | "dz" | "ar", string>;
  lines: string[];
  lat: number;
  lng: number;
  mapQuery: string;
};

export const CONTACT_OFFICES: ContactOffice[] = [
  {
    id: "india",
    countryLabel: {
      en: "India",
      hi: "भारत",
      ne: "भारत",
      dz: "India",
      ar: "الهند",
    },
    lines: [
      "Topuban Campus, Sensua, Jorhat",
      "Cinnamara",
      "Jorhat - 785008",
      "Assam",
    ],
    lat: 26.7382,
    lng: 94.1824,
    mapQuery: "Topuban Campus Sensua Jorhat Cinnamara Assam 785008",
  },
  {
    id: "bhutan",
    countryLabel: {
      en: "Bhutan",
      hi: "भूटान",
      ne: "भुटान",
      dz: "Bhutan",
      ar: "بوتان",
    },
    lines: [
      "Bhutan Innovation and Technology Centre (BITC)",
      "Thimphu Techpark Limited (TTPL)",
      "Thimphu",
    ],
    lat: 27.4712,
    lng: 89.6339,
    mapQuery: "Thimphu Techpark Limited BITC Bhutan",
  },
  {
    id: "nepal",
    countryLabel: {
      en: "Nepal",
      hi: "नेपाल",
      ne: "नेपाल",
      dz: "Nepal",
      ar: "نيبال",
    },
    lines: ["Mechinagar, Jhapa", "Dhulabari", "Nepal"],
    lat: 26.6417,
    lng: 88.1194,
    mapQuery: "Mechinagar Jhapa Dhulabari Nepal",
  },
];

export function officeMapEmbedUrl(office: ContactOffice): string {
  const query = encodeURIComponent(office.mapQuery);
  return `https://www.google.com/maps?q=${query}&hl=en&z=14&output=embed`;
}

export function officeMapExternalUrl(office: ContactOffice): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`;
}
