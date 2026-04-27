export type LocaleCode = "en" | "hi" | "ne" | "dz" | "ar";

export type PublicInfoPage = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  updated: string;
  seoTitle: string;
  seoDescription: string;
  sections: Array<{
    id: string;
    title: string;
    body: string[];
  }>;
};

export const PUBLIC_INFO_PAGE_SLUGS = [
  "terms-and-conditions",
  "privacy-policy",
  "cookie-policy",
  "disclaimer",
  "regulatory-compliance",
  "anti-fraud-policy",
  "fees",
  "security",
] as const;

type PublicSlug = (typeof PUBLIC_INFO_PAGE_SLUGS)[number];

export const PUBLIC_LABELS: Record<LocaleCode, {
  about: string;
  contact: string;
  fees: string;
  security: string;
  terms: string;
  privacy: string;
  cookies: string;
  disclaimer: string;
  compliance: string;
  antiFraud: string;
  legal: string;
  company: string;
  platform: string;
  contents: string;
  updated: string;
  related: string;
  askQuestion: string;
}> = {
  en: { about: "About", contact: "Contact", fees: "Fees", security: "Security", terms: "Terms", privacy: "Privacy", cookies: "Cookies", disclaimer: "Disclaimer", compliance: "Compliance", antiFraud: "Anti-Fraud", legal: "Legal", company: "Company", platform: "Platform", contents: "Contents", updated: "Updated", related: "Related pages", askQuestion: "Ask a question" },
  hi: { about: "हमारे बारे में", contact: "संपर्क", fees: "शुल्क", security: "सुरक्षा", terms: "शर्तें", privacy: "गोपनीयता", cookies: "कुकीज़", disclaimer: "अस्वीकरण", compliance: "अनुपालन", antiFraud: "धोखाधड़ी-रोधी", legal: "कानूनी", company: "कंपनी", platform: "प्लेटफ़ॉर्म", contents: "विषय सूची", updated: "अपडेट", related: "संबंधित पृष्ठ", askQuestion: "प्रश्न पूछें" },
  ne: { about: "हाम्रो बारेमा", contact: "सम्पर्क", fees: "शुल्क", security: "सुरक्षा", terms: "सर्तहरू", privacy: "गोपनीयता", cookies: "कुकीहरू", disclaimer: "अस्वीकरण", compliance: "अनुपालन", antiFraud: "ठगी-रोधी", legal: "कानुनी", company: "कम्पनी", platform: "प्लेटफर्म", contents: "सामग्री", updated: "अद्यावधिक", related: "सम्बन्धित पृष्ठहरू", askQuestion: "प्रश्न सोध्नुहोस्" },
  dz: { about: "ང་བཅས་སྐོར།", contact: "འབྲེལ་བ།", fees: "གླ་ཆ།", security: "བདེ་འཇགས།", terms: "ཆ་རྐྱེན།", privacy: "སྒེར་གཙང་།", cookies: "ཀུ་ཀི།", disclaimer: "འགན་མེད་བརྡ་ཐོ།", compliance: "ཁྲིམས་མཐུན།", antiFraud: "གཡོ་ཁྲམ་འགོག་པ།", legal: "ཁྲིམས།", company: "ཚོང་སྡེ།", platform: "པད་སྟེགས།", contents: "ནང་དོན།", updated: "དུས་མཐུན།", related: "འབྲེལ་ཡོད་ཤོག་ངོས།", askQuestion: "དྲི་བ་འདྲི།" },
  ar: { about: "من نحن", contact: "اتصل بنا", fees: "الرسوم", security: "الأمان", terms: "الشروط", privacy: "الخصوصية", cookies: "ملفات تعريف الارتباط", disclaimer: "إخلاء المسؤولية", compliance: "الامتثال", antiFraud: "مكافحة الاحتيال", legal: "قانوني", company: "الشركة", platform: "المنصة", contents: "المحتويات", updated: "آخر تحديث", related: "صفحات ذات صلة", askQuestion: "اطرح سؤالا" },
};

function makePage(slug: PublicSlug, title: string, shortTitle: string, summary: string, sections: PublicInfoPage["sections"], updated = "April 2026"): PublicInfoPage {
  return { slug, title, shortTitle, summary, updated, seoTitle: `${title} | Krishibridge`, seoDescription: summary, sections };
}

const BASE_PAGES: PublicInfoPage[] = [
  makePage("terms-and-conditions", "Terms & Conditions", "Terms", "Rules for using Krishibridge and participating in the Himalayan Commodity Exchange.", [
    { id: "agreement", title: "Agreement", body: ["By registering or trading on Krishibridge, you agree to the operating rules of Krishibridge Agrifin Technologies Pvt. Ltd. and the Himalayan Commodity Exchange."] },
    { id: "conduct", title: "User conduct", body: ["Users must follow the laws of their resident country. One verified user may operate only one account. False documents, bots, multi-accounting, or market manipulation can lead to suspension or legal action."] },
    { id: "trade", title: "Trade, fees, and liability", body: ["Bids, offers, and acceptances are treated as final trade records. Fees are shown before completion. Krishibridge facilitates trade and is not liable for natural market volatility, crop price movement, currency changes, or remote-region connectivity issues."] },
  ]),
  makePage("privacy-policy", "Privacy Policy", "Privacy", "How Krishibridge collects, uses, protects, and transfers data needed for secure agricultural trade.", [
    { id: "data", title: "Data we collect", body: ["We collect identity and KYC details, farm or business information, bank and tax details, platform activity, and records needed for trade, settlement, and support."] },
    { id: "use", title: "How we use data", body: ["Data is used to verify participants, support tokenized ownership records, process payments, generate quality certificates, and improve market intelligence using aggregated information."] },
    { id: "rights", title: "Your rights", body: ["You may request a summary of your data, correct inaccurate profile or KYC information, and withdraw consent for non-essential communication."] },
  ], "Effective April 2026"),
  makePage("cookie-policy", "Cookie Policy", "Cookies", "How cookies support login sessions, preferences, security, and performance on Krishibridge.", [
    { id: "necessary", title: "Necessary cookies", body: ["These keep authentication, bidding integrity, and account security working. Without them, key exchange features cannot operate."] },
    { id: "preferences", title: "Preference and analytics cookies", body: ["With consent, we may remember language, currency, and dashboard choices, and use limited analytics to improve speed and reliability."] },
    { id: "manage", title: "Managing cookies", body: ["You can manage cookies through the consent banner or browser settings. Blocking necessary cookies may prevent bidding and secure dashboard access."] },
  ], "Last updated April 2026"),
  makePage("disclaimer", "Disclaimer (Risk & Liability)", "Disclaimer", "Important market, quality, technical, and external-risk limits for using the platform.", [
    { id: "advice", title: "No financial advice", body: ["Market data, price trends, and forecasts are informational. Krishibridge does not provide financial or investment advice."] },
    { id: "market", title: "Market and quality risk", body: ["Agricultural prices can change quickly. Commodities may also change in weight or quality during storage and transit because they are biological goods."] },
    { id: "external", title: "External events", body: ["Remote connectivity, disasters, border closures, political changes, strikes, third-party portals, or logistics issues may affect trade and are outside the platform's control."] },
  ], "Effective April 2026"),
  makePage("regulatory-compliance", "Regulatory Compliance Info", "Compliance", "Krishibridge's public position as a platform-neutral agri-tech infrastructure provider.", [
    { id: "startup", title: "India startup status", body: ["Krishibridge Agrifin Technologies is positioned as a DPIIT-recognized deep-tech and agri-tech service provider."] },
    { id: "regional", title: "Regional operations", body: ["The platform supports technology-led agricultural trade infrastructure across India, Nepal, and Bhutan, with country-aware KYC, tax, currency, and settlement flows."] },
    { id: "neutrality", title: "Platform neutrality", body: ["Krishibridge provides digital rails, grading workflows, and exchange infrastructure. It does not compete with users as a principal spice trader."] },
  ]),
  makePage("anti-fraud-policy", "Anti-Fraud Policy", "Anti-Fraud", "Conduct rules that protect identity, hardware, auction data, and cross-border trade integrity.", [
    { id: "technical", title: "Technical integrity", body: ["Tampering with Krishibridge software, IoT sensors, grading units, APIs, or hardware interfaces is prohibited and may lead to termination or legal action."] },
    { id: "market", title: "Market manipulation", body: ["Bots, unauthorized scripts, fake bids, duplicate accounts, or attempts to influence market data are not allowed."] },
    { id: "identity", title: "Identity fraud", body: ["KYC is mandatory. Fraudulent business credentials or misrepresentation of legal standing may be reported to relevant regional authorities."] },
  ]),
  makePage("fees", "Fees & Pricing", "Fees", "A simple explanation of platform fees, taxes, and settlement-related costs.", [
    { id: "principles", title: "Pricing principles", body: ["Krishibridge aims to show platform charges before a user commits to a transaction. No hidden principal trading margin is added by the platform."] },
    { id: "charges", title: "Charges that may apply", body: ["Platform service fees, taxes, payment gateway charges, bank fees, FX costs, warehouse grading, storage, logistics, or inspection costs may apply depending on the trade workflow."] },
    { id: "review", title: "Where to review", body: ["Always review the transaction confirmation screen, invoice, payment instructions, and dashboard tax breakdown before completing a trade."] },
  ]),
  makePage("security", "Security & Trust", "Security", "How Krishibridge protects accounts, trades, ownership records, payments, and support workflows.", [
    { id: "identity", title: "Verified accounts", body: ["Trading actions are designed around KYC, role-based permissions, and one verified account per user."] },
    { id: "trade", title: "Trade security", body: ["Auction, RFQ, payment, and token workflows create records that can be reviewed when needed. Ownership tokens may use signed QR verification."] },
    { id: "report", title: "Report concerns", body: ["If you suspect account compromise, fraud, market manipulation, or hardware tampering, contact Krishibridge support immediately."] },
  ]),
];

type PageOverride = Partial<Omit<PublicInfoPage, "slug">> & { sections?: PublicInfoPage["sections"] };

const OVERRIDES: Record<Exclude<LocaleCode, "en">, Partial<Record<PublicSlug, PageOverride>>> = {
  hi: {
    "terms-and-conditions": { title: "नियम और शर्तें", shortTitle: "शर्तें", summary: "Krishibridge और Himalayan Commodity Exchange का उपयोग करने के नियम।", sections: [
      { id: "agreement", title: "अनुबंध", body: ["खाता बनाने या व्यापार करने पर आप Krishibridge Agrifin Technologies Pvt. Ltd. के संचालन नियमों से सहमत होते हैं।"] },
      { id: "conduct", title: "उपयोगकर्ता आचरण", body: ["उपयोगकर्ता अपने देश के कानूनों का पालन करेंगे। गलत दस्तावेज, बॉट, बहु-खाता या बाज़ार हेरफेर पर कार्रवाई हो सकती है।"] },
      { id: "trade", title: "व्यापार, शुल्क और दायित्व", body: ["बोली, ऑफ़र और स्वीकृति अंतिम रिकॉर्ड मानी जाती है। शुल्क पहले दिखाए जाते हैं। बाजार उतार-चढ़ाव, कीमत, मुद्रा या कनेक्टिविटी जोखिम उपयोगकर्ता के हैं।"] },
    ] },
    "privacy-policy": { title: "गोपनीयता नीति", shortTitle: "गोपनीयता", summary: "सुरक्षित कृषि व्यापार के लिए आवश्यक डेटा कैसे लिया, उपयोग और सुरक्षित किया जाता है।", sections: [
      { id: "data", title: "हम जो डेटा लेते हैं", body: ["हम पहचान/KYC, खेत या व्यवसाय जानकारी, बैंक और कर विवरण, प्लेटफ़ॉर्म गतिविधि और समर्थन रिकॉर्ड लेते हैं।"] },
      { id: "use", title: "डेटा का उपयोग", body: ["डेटा प्रतिभागियों की पुष्टि, स्वामित्व रिकॉर्ड, भुगतान, गुणवत्ता प्रमाणपत्र और समेकित बाजार जानकारी के लिए उपयोग होता है।"] },
      { id: "rights", title: "आपके अधिकार", body: ["आप डेटा सारांश मांग सकते हैं, गलत जानकारी सुधार सकते हैं और गैर-आवश्यक संचार से सहमति वापस ले सकते हैं।"] },
    ] },
    "cookie-policy": { title: "कुकी नीति", shortTitle: "कुकीज़", summary: "लॉगिन, पसंद, सुरक्षा और प्रदर्शन के लिए कुकीज़ का उपयोग।" },
    disclaimer: { title: "अस्वीकरण", shortTitle: "अस्वीकरण", summary: "बाजार, गुणवत्ता, तकनीकी और बाहरी जोखिमों की सीमाएं।" },
    "regulatory-compliance": { title: "नियामकीय अनुपालन", shortTitle: "अनुपालन", summary: "Krishibridge की प्लेटफ़ॉर्म-न्यूट्रल एग्री-टेक स्थिति।" },
    "anti-fraud-policy": { title: "धोखाधड़ी-रोधी नीति", shortTitle: "धोखाधड़ी-रोधी", summary: "पहचान, हार्डवेयर, नीलामी डेटा और व्यापार अखंडता की सुरक्षा।" },
    fees: { title: "शुल्क और मूल्य", shortTitle: "शुल्क", summary: "प्लेटफ़ॉर्म शुल्क, कर और सेटलमेंट लागत की सरल जानकारी।" },
    security: { title: "सुरक्षा और भरोसा", shortTitle: "सुरक्षा", summary: "खातों, व्यापार, स्वामित्व रिकॉर्ड और भुगतान की सुरक्षा।" },
  },
  ne: {
    "terms-and-conditions": { title: "सेवाका सर्तहरू", shortTitle: "सर्तहरू", summary: "Krishibridge र Himalayan Commodity Exchange प्रयोग गर्ने नियमहरू।" },
    "privacy-policy": { title: "गोपनीयता नीति", shortTitle: "गोपनीयता", summary: "सुरक्षित कृषि व्यापारका लागि आवश्यक डेटा कसरी संकलन, प्रयोग र सुरक्षा गरिन्छ।" },
    "cookie-policy": { title: "कुकी नीति", shortTitle: "कुकीहरू", summary: "लगइन, प्राथमिकता, सुरक्षा र प्रदर्शनका लागि कुकीहरूको प्रयोग।" },
    disclaimer: { title: "जोखिम अस्वीकरण", shortTitle: "अस्वीकरण", summary: "बजार, गुणस्तर, प्राविधिक र बाह्य जोखिमहरूको सीमा।" },
    "regulatory-compliance": { title: "नियामकीय अनुपालन", shortTitle: "अनुपालन", summary: "Krishibridge को प्लेटफर्म-न्यूट्रल एग्री-टेक स्थिति।" },
    "anti-fraud-policy": { title: "ठगी-रोधी नीति", shortTitle: "ठगी-रोधी", summary: "पहिचान, हार्डवेयर, लिलामी डेटा र व्यापार अखण्डताको सुरक्षा।" },
    fees: { title: "शुल्क र मूल्य", shortTitle: "शुल्क", summary: "प्लेटफर्म शुल्क, कर र सेटलमेन्ट लागतको सरल जानकारी।" },
    security: { title: "सुरक्षा र भरोसा", shortTitle: "सुरक्षा", summary: "खाता, व्यापार, स्वामित्व अभिलेख र भुक्तानीको सुरक्षा।" },
  },
  dz: {
    "terms-and-conditions": { title: "ཞབས་ཏོག་གི་ཆ་རྐྱེན།", shortTitle: "ཆ་རྐྱེན།", summary: "Krishibridge དང Himalayan Commodity Exchange ལག་ལེན་གྱི་གཞི་རྩའི་སྒྲིག་ཁྲིམས།" },
    "privacy-policy": { title: "སྒེར་གཙང་སྲིད་བྱུས།", shortTitle: "སྒེར་གཙང་།", summary: "ཉེན་སྲུང་ཅན་གྱི་སོ་ནམ་ཚོང་འབྲེལ་དོན་ལུ་གནས་སྡུད་ལག་ལེན།" },
    "cookie-policy": { title: "ཀུ་ཀི་སྲིད་བྱུས།", shortTitle: "ཀུ་ཀི།", summary: "ནང་འཛུལ་ གདམ་ཁ་ བདེ་འཇགས་ དང་ལས་འགུལ་ལུ་ཀུ་ཀི་ལག་ལེན།" },
    disclaimer: { title: "འགན་མེད་བརྡ་ཐོ།", shortTitle: "འགན་མེད།", summary: "ཁྲོམ་ སྤུས་ཚད་ ལག་རྩལ་ དང་ཕྱི་རྐྱེན་ཉེན་ཁའི་ཚད་བཀག།" },
    "regulatory-compliance": { title: "ཁྲིམས་མཐུན་བརྡ་དོན།", shortTitle: "ཁྲིམས་མཐུན།", summary: "Krishibridge གི་སོ་ནམ་ལག་རྩལ་པད་སྟེགས་གནས་སྟངས།" },
    "anti-fraud-policy": { title: "གཡོ་ཁྲམ་འགོག་པའི་སྲིད་བྱུས།", shortTitle: "གཡོ་ཁྲམ།", summary: "ངོ་རྟགས་ ལག་ཆས་ རིན་འདེབས་གནས་སྡུད་ དང་ཚོང་འབྲེལ་གཙང་སྦྲ།" },
    fees: { title: "གླ་ཆ་དང་གོང་ཚད།", shortTitle: "གླ་ཆ།", summary: "པད་སྟེགས་གླ་ཆ་ ཁྲལ་ དང་དངུལ་སྤྲོད་འབྲེལ་བའི་གནས་སྡུད།" },
    security: { title: "བདེ་འཇགས་དང་ཡིད་ཆེས།", shortTitle: "བདེ་འཇགས།", summary: "རྩིས་ཁྲ་ ཚོང་ བདག་དབང་ཐོ་ དང་དངུལ་སྤྲོད་སྲུང་སྐྱོབ།" },
  },
  ar: {
    "terms-and-conditions": { title: "الشروط والأحكام", shortTitle: "الشروط", summary: "قواعد استخدام Krishibridge والمشاركة في Himalayan Commodity Exchange." },
    "privacy-policy": { title: "سياسة الخصوصية", shortTitle: "الخصوصية", summary: "كيف تجمع Krishibridge البيانات اللازمة للتجارة الزراعية الآمنة وتستخدمها وتحميها." },
    "cookie-policy": { title: "سياسة ملفات تعريف الارتباط", shortTitle: "الكوكيز", summary: "كيف تدعم ملفات تعريف الارتباط تسجيل الدخول والتفضيلات والأمان والأداء." },
    disclaimer: { title: "إخلاء المسؤولية", shortTitle: "إخلاء المسؤولية", summary: "حدود مهمة لمخاطر السوق والجودة والتقنية والعوامل الخارجية." },
    "regulatory-compliance": { title: "معلومات الامتثال", shortTitle: "الامتثال", summary: "موقف Krishibridge كمزود بنية تحتية زراعية تقنية ومحايد للمنصة." },
    "anti-fraud-policy": { title: "سياسة مكافحة الاحتيال", shortTitle: "مكافحة الاحتيال", summary: "قواعد تحمي الهوية والأجهزة وبيانات المزاد ونزاهة التجارة." },
    fees: { title: "الرسوم والتسعير", shortTitle: "الرسوم", summary: "شرح بسيط لرسوم المنصة والضرائب وتكاليف التسوية." },
    security: { title: "الأمان والثقة", shortTitle: "الأمان", summary: "كيف تحمي Krishibridge الحسابات والتداولات وسجلات الملكية والمدفوعات." },
  },
};

export function normalizeLocale(locale: string): LocaleCode {
  return (["en", "hi", "ne", "dz", "ar"] as string[]).includes(locale) ? (locale as LocaleCode) : "en";
}

export function getPublicLabels(locale: string) {
  return PUBLIC_LABELS[normalizeLocale(locale)];
}

export function getPublicInfoPages(locale: string = "en") {
  const localeCode = normalizeLocale(locale);
  if (localeCode === "en") return BASE_PAGES;

  return BASE_PAGES.map((page) => {
    const override = OVERRIDES[localeCode][page.slug as PublicSlug];
    if (!override) return page;
    const localized = { ...page, ...override };
    return {
      ...localized,
      seoTitle: `${localized.title} | Krishibridge`,
      seoDescription: localized.summary,
      sections: override.sections || page.sections,
    };
  });
}

export function getPublicInfoPage(slug: string, locale: string = "en") {
  return getPublicInfoPages(locale).find((page) => page.slug === slug);
}
