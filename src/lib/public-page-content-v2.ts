export type LocaleCode = "en" | "hi" | "ne" | "dz" | "ar";

export type PublicInfoSectionItem = {
  title: string;
  body: string;
};

export type PublicInfoSection = {
  id: string;
  title: string;
  body: string[];
  items?: PublicInfoSectionItem[];
};

export type PublicInfoPage = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  updated: string;
  seoTitle: string;
  seoDescription: string;
  sections: PublicInfoSection[];
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

type PublicLabelSet = {
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
};

export const PUBLIC_LABELS: Record<LocaleCode, PublicLabelSet> = {
  en: { about: "About", contact: "Contact", fees: "Fees", security: "Security", terms: "Terms", privacy: "Privacy", cookies: "Cookies", disclaimer: "Disclaimer", compliance: "Compliance", antiFraud: "Anti-Fraud", legal: "Legal", company: "Company", platform: "Platform", contents: "Contents", updated: "Updated", related: "Related pages", askQuestion: "Ask a question" },
  hi: { about: "हमारे बारे में", contact: "संपर्क", fees: "शुल्क", security: "सुरक्षा", terms: "शर्तें", privacy: "गोपनीयता", cookies: "कुकीज़", disclaimer: "अस्वीकरण", compliance: "अनुपालन", antiFraud: "धोखाधड़ी-रोधी", legal: "कानूनी", company: "कंपनी", platform: "प्लेटफ़ॉर्म", contents: "विषय सूची", updated: "अपडेट", related: "संबंधित पृष्ठ", askQuestion: "प्रश्न पूछें" },
  ne: { about: "हाम्रो बारेमा", contact: "सम्पर्क", fees: "शुल्क", security: "सुरक्षा", terms: "सर्तहरू", privacy: "गोपनीयता", cookies: "कुकीहरू", disclaimer: "अस्वीकरण", compliance: "अनुपालन", antiFraud: "ठगी-रोधी", legal: "कानुनी", company: "कम्पनी", platform: "प्लेटफर्म", contents: "सामग्री", updated: "अद्यावधिक", related: "सम्बन्धित पृष्ठहरू", askQuestion: "प्रश्न सोध्नुहोस्" },
  dz: { about: "ང་བཅས་སྐོར།", contact: "འབྲེལ་བ།", fees: "གླ་ཆ།", security: "བདེ་འཇགས།", terms: "ཆ་རྐྱེན།", privacy: "སྒེར་གཙང་།", cookies: "ཀུ་ཀི།", disclaimer: "འགན་མེད་བརྡ་ཐོ།", compliance: "ཁྲིམས་མཐུན།", antiFraud: "གཡོ་ཁྲམ་འགོག་པ།", legal: "ཁྲིམས།", company: "ཚོང་སྡེ།", platform: "པད་སྟེགས།", contents: "ནང་དོན།", updated: "དུས་མཐུན།", related: "འབྲེལ་ཡོད་ཤོག་ངོས།", askQuestion: "དྲི་བ་འདྲི།" },
  ar: { about: "من نحن", contact: "اتصل بنا", fees: "الرسوم", security: "الأمان", terms: "الشروط", privacy: "الخصوصية", cookies: "ملفات تعريف الارتباط", disclaimer: "إخلاء المسؤولية", compliance: "الامتثال", antiFraud: "مكافحة الاحتيال", legal: "قانوني", company: "الشركة", platform: "المنصة", contents: "المحتويات", updated: "آخر تحديث", related: "صفحات ذات صلة", askQuestion: "اطرح سؤالا" },
};

function makePage(slug: PublicSlug, title: string, shortTitle: string, summary: string, sections: PublicInfoSection[], updated = "April 2026"): PublicInfoPage {
  return { slug, title, shortTitle, summary, updated, seoTitle: `${title} | Krishibridge`, seoDescription: summary, sections };
}

const EN_PAGES: PublicInfoPage[] = [
  makePage("terms-and-conditions", "Terms & Conditions", "Terms", "The operating and legal framework for using Krishibridge and participating in the Himalayan Commodity Exchange.", [
    { id: "agreement", title: "1.1 Contractual Agreement", body: ["By registering on krishibridge.com or participating in the Himalayan Commodity Exchange (HCE), you enter into a legally binding agreement with Krishibridge Agrifin Technologies Pvt. Ltd.", "These terms govern access to procurement platforms, digital trade tools, hardware interfaces, and regional agricultural services."] },
    { id: "conduct", title: "1.2 Multi-Country User Conduct", body: ["Every participant must use the platform honestly and within the laws of their resident country."], items: [
      { title: "Jurisdictional Compliance", body: "Users must operate within the legal framework of India, Bhutan, Nepal, or their resident country." },
      { title: "Cross-Border Trade", body: "Users handling international transactions must provide accurate customs, export, logistics, and settlement documents requested by the platform workflow." },
      { title: "Account Integrity", body: "One user may hold only one verified account. Multi-accounting, fake documents, bots, or market manipulation may lead to suspension, permanent ban, and legal reporting." },
    ] },
    { id: "exchange", title: "1.3 The Exchange & Fulfillment", body: ["The HCE interface creates the platform record for agricultural commodity trade and settlement."], items: [
      { title: "Trade Finality", body: "Any bid, offer, or acceptance through HCE is final and records the time of sale and agreed price." },
      { title: "Digital Escrow", body: "Users agree to automated settlement. Funds are released according to verification events such as warehouse arrival, grading confirmation, or receipt confirmation." },
      { title: "Quality Assurance", body: "Grading follows Krishibridge standardized protocols. Platform grading decisions are final for the transaction workflow." },
    ] },
    { id: "rights", title: "1.4 Proprietary Rights & Usage", body: ["Platform access does not transfer ownership of software, hardware designs, algorithms, data processes, or intellectual property."], items: [
      { title: "Black Box Protection", body: "Web tools, ATM or processing interfaces, IoT sensors, and grading units are licensed only for approved platform use." },
      { title: "Prohibited Inspection", body: "Users must not disassemble, decompile, bypass, scrape, or reverse engineer any platform software, algorithm, API, or hardware interface." },
      { title: "Data Ownership", body: "Krishibridge retains rights to aggregated and anonymized data used for crop forecasting, market stability, quality intelligence, and logistics planning." },
    ] },
    { id: "fees", title: "1.5 Platform Fees & Levies", body: ["Fees are intended to be visible before a user commits to a trade."], items: [
      { title: "Service Fees", body: "Krishibridge may charge platform, grading, settlement, processing, or support fees for facilitated services." },
      { title: "Taxation", body: "GST, VAT, duties, payment charges, bank charges, FX costs, or local levies may apply. Users remain responsible for their own tax obligations." },
    ] },
    { id: "liability", title: "1.6 Limitation of Liability", body: ["Krishibridge is a facilitator and technology infrastructure provider, not a guarantor of market returns."], items: [
      { title: "Market Fluctuations", body: "Krishibridge is not liable for crop price movements, price crashes, bumper crops, currency devaluation, or market timing losses." },
      { title: "Service Interruptions", body: "We strive for availability but cannot guarantee uninterrupted service in remote regions where internet, power, or satellite infrastructure may be unstable." },
    ] },
  ], "Version 2.0 - April 2026"),
  makePage("privacy-policy", "Privacy Policy", "Privacy", "How Krishibridge collects, uses, protects, retains, and transfers data required for secure agricultural trade.", [
    { id: "collection", title: "2.1 Data Collection", body: ["We collect information necessary for secure agricultural trade, verified onboarding, settlement, logistics, and hardware interaction."], items: [
      { title: "Identity & KYC", body: "Full name, business registration details, government IDs such as Aadhaar, PAN, CID, and trade licensing information." },
      { title: "Geographic Data", body: "Farm location, regional plot data, and location signals used for weather, soil, logistics, and quality insights." },
      { title: "Financial Data", body: "Bank details, tax identifiers such as GSTIN or VAT, payment references, escrow records, and cross-border settlement data." },
      { title: "Platform Activity", body: "Bidding history, transaction volumes, support requests, dashboard actions, and approved hardware-interface logs." },
    ] },
    { id: "purpose", title: "2.2 Purpose of Processing", body: ["Your data keeps HCE reliable, traceable, and useful for regional agricultural participants."], items: [
      { title: "Participant Verification", body: "We verify farmers, aggregators, buyers, warehouses, staff, and administrators before sensitive platform actions." },
      { title: "Tokenization", body: "Data helps ensure digital ownership records, warehouse lots, certificates, and token references match the physical commodity owner." },
      { title: "Market Intelligence", body: "Anonymized and aggregated data may support price forecasts, crop health reports, regional demand trends, and platform reliability." },
      { title: "Operational Intelligence", body: "Hardware and sensor outputs may produce quality certificates, yield insights, storage observations, and fulfillment records." },
    ] },
    { id: "transfers", title: "2.3 Data Sovereignty & Cross-Border Transfers", body: ["Krishibridge operates across India, Nepal, and Bhutan. Some data may move across these borders when required for trade, verification, logistics, or settlement.", "We apply security practices aligned with the Indian DPDPA and relevant Bhutanese and Nepalese digital regulations. Using the platform means you consent to essential cross-border data flows for supported transactions."] },
    { id: "methods", title: "2.4 Protection of Proprietary Methods", body: ["Users may receive outputs such as quality grades, soil health scores, certificates, and settlement records. The internal logic, algorithms, scoring methods, and technical processes remain Krishibridge trade secrets."] },
    { id: "retention", title: "2.5 Data Retention & Security", body: ["We use encryption, access controls, secure servers, and operational safeguards to protect trade and account data.", "Transaction, tax, inspection, and compliance records are retained for periods required by trade laws, tax audits, commodity rules, or dispute-resolution needs."] },
    { id: "rights", title: "2.6 Your Rights", body: ["You may request a summary of personal data, correct inaccurate profile or KYC information, and withdraw consent for non-essential marketing communication.", "Some data may still be retained for legal, tax, fraud-prevention, settlement, or transaction-record purposes."] },
  ], "Effective April 2026"),
  makePage("cookie-policy", "Cookie Policy", "Cookies", "How cookies support login sessions, preferences, exchange security, performance, and consent on Krishibridge.", [
    { id: "what", title: "3.1 What are Cookies?", body: ["Cookies are small data files stored on your computer, tablet, or mobile device when you visit krishibridge.com.", "They help remember secure sessions, language, currency, dashboard choices, and real-time exchange activity."] },
    { id: "usage", title: "3.2 How We Use Cookies", body: ["We group cookies into clear categories. Non-essential cookies are loaded only after consent through the banner or preference settings."], items: [
      { title: "Strictly Necessary", body: "Always-on cookies keep authentication, secure dashboard access, bidding integrity, account security, and session protection working." },
      { title: "Functional & Preference", body: "With consent, these remember currency, language, region, and hardware-dashboard settings across the Golden Triangle." },
      { title: "Performance & Analytics", body: "With consent, these help us understand traffic, commodity interest, load balancing, speed, and reliability in remote agricultural regions." },
    ] },
    { id: "third-party", title: "3.3 Third-Party Cookies", body: ["We limit third-party cookies. Verified payment gateways, secure map providers, logistics tools, or similar partners may set their own cookies when needed.", "We do not allow third-party marketing trackers to follow your Krishibridge activity."] },
    { id: "manage", title: "3.4 Managing Preferences", body: ["The consent banner may let you accept all, reject non-essential, or customize settings. Browser settings can also block cookies.", "Blocking strictly necessary cookies may prevent secure login, bidding, and exchange features from working."] },
    { id: "privacy", title: "3.5 Data Privacy Link", body: ["For more information on personal data collected through cookies and platform activity, review the Privacy Policy."] },
  ], "Last updated April 2026"),
  makePage("disclaimer", "Disclaimer (Risk & Liability)", "Disclaimer", "Important limits on market, quality, technical, legal, and external risks when using Krishibridge.", [
    { id: "advice", title: "4.1 No Financial or Investment Advice", body: ["Market data, price trends, forecasts, auction signals, and commodity information are provided for information only.", "Krishibridge is not a financial advisor. Any decision to buy, sell, hold, bid, or participate is made solely at the user's risk."] },
    { id: "volatility", title: "4.2 Market Volatility Risk", body: ["Agricultural spice markets, including large cardamom, may move sharply because of supply, demand, weather, currency movement, and policy shifts.", "Krishibridge is not liable for losses from bumper crops, price crashes, currency fluctuation, or market entry and exit timing."] },
    { id: "quality", title: "4.3 Quality & Biological Variation", body: ["Agricultural products are biological goods and may change in moisture, weight, appearance, aroma, or quality during storage and transit.", "Quality certificates reflect the sample and condition at grading time. Krishibridge is not liable for later changes caused by storage, long transit, environmental exposure, or user handling."] },
    { id: "technical", title: "4.4 Technical & Connectivity Limitations", body: ["Krishibridge serves remote and high-altitude regions where internet, power, and device conditions can vary.", "We do not guarantee uninterrupted access and are not responsible for missed bids, failed transactions, local outages, power failures, satellite latency, or device damage during hardware interaction."] },
    { id: "force", title: "4.5 Force Majeure", body: ["Krishibridge is not liable for delay or failure caused by events outside reasonable control, including earthquakes, landslides, floods, border closures, import or export rule changes, political instability, strikes, riots, or civil unrest affecting Golden Triangle logistics."] },
    { id: "third-party", title: "4.6 Third-Party Links & Services", body: ["The site may link to government portals, payment providers, logistics partners, maps, certification providers, or regional authorities. Krishibridge does not control their content, security, availability, or policies."] },
    { id: "as-is", title: "4.7 As-Is Provision", body: ["The platform and hardware interfaces are provided on an as-is and as-available basis without warranties of merchantability, fitness for a particular agricultural purpose, uninterrupted use, or guaranteed commercial outcome."] },
  ], "Effective April 2026"),
  makePage("regulatory-compliance", "Regulatory Compliance Info", "Compliance", "Krishibridge's public compliance position as a technology-led, platform-neutral agricultural infrastructure provider.", [
    { id: "startup", title: "5.1 Startup Recognition & India Compliance", body: ["Krishibridge Agrifin Technologies is positioned as a DPIIT-recognized deep-tech and agri-tech service provider."], items: [
      { title: "DPIIT Registration", body: "The company is recognized by the Department for Promotion of Industry and Internal Trade, Ministry of Commerce and Industry, Government of India." },
      { title: "Sector Role", body: "Krishibridge provides digital infrastructure, AI-grading protocols, mechanized processing technology, and exchange workflows. It does not buy, sell, or hold spice inventory as a principal trader." },
      { title: "IPR Compliance", body: "Proprietary hardware designs, software architecture, workflows, and technical systems are protected under applicable intellectual property frameworks." },
    ] },
    { id: "international", title: "5.2 International Tech FDI Status", body: ["Krishibridge supports Himalayan agricultural trade with country-aware compliance and technology infrastructure."], items: [
      { title: "Bhutan", body: "Krishibridge is authorized as a technology FDI entity in the Kingdom of Bhutan, focused on regional agri hubs and digital agricultural infrastructure." },
      { title: "Nepal", body: "Krishibridge operates as a foreign technology industrial entity with approved FDI for tech-enabled platform development and deployment, aligned with NRB regulations and the Industrial Enterprises Act." },
    ] },
    { id: "neutrality", title: "5.3 Platform Neutrality", body: ["Krishibridge maintains platform neutrality. It provides the digital rails of the Himalayan Commodity Exchange and supporting tools for the spice industry without competing with farmers, traders, or buyers as a marketplace principal."] },
  ]),
  makePage("anti-fraud-policy", "Anti-Fraud Policy", "Anti-Fraud", "Rules and controls that protect identity, hardware, auction data, settlement records, and cross-border trade integrity.", [
    { id: "technical", title: "6.1 Technical Integrity", body: ["Users must not interfere with Krishibridge technology, platform records, bidding systems, or commodity verification workflows."], items: [
      { title: "Device Tampering", body: "Bypassing, modifying, damaging, inspecting, or reverse engineering software or hardware interfaces, IoT sensors, or grading units is prohibited." },
      { title: "Data Manipulation", body: "Automated scripts, bots, unauthorized API calls, fake traffic, or attempts to influence market data, auction results, certificates, or settlement records are prohibited." },
      { title: "Consequences", body: "Violations may lead to immediate service termination, transaction review, account suspension, evidence preservation, and legal action." },
    ] },
    { id: "identity", title: "6.2 Identity Fraud", body: ["KYC is mandatory because Krishibridge supports cross-border agricultural trade.", "Fraudulent credentials, false business registrations, forged tax details, duplicate verified accounts, or misrepresentation of legal standing in India, Bhutan, or Nepal may be reported to relevant commerce, tax, or enforcement authorities."] },
    { id: "reporting", title: "6.3 Reporting Concerns", body: ["Report suspected account compromise, fake bids, staff impersonation, bribery attempts, hardware tampering, or suspicious settlement requests to Krishibridge support immediately."] },
  ]),
  makePage("fees", "Fees & Pricing", "Fees", "A clear guide to platform fees, taxes, payment costs, and settlement-related charges on Krishibridge.", [
    { id: "principles", title: "Transparent Fee Principles", body: ["Krishibridge aims to show relevant platform charges before a user commits to a transaction. The platform does not add hidden principal-trading margins."] },
    { id: "charges", title: "Charges That May Apply", body: ["Depending on the workflow, charges may include platform service fees, GST or VAT, payment-gateway fees, bank charges, FX costs, warehouse grading, storage, inspection, processing, logistics, or documentation support."] },
    { id: "review", title: "Where to Review Fees", body: ["Review the lot page, RFQ response, confirmation screen, invoice, payment instructions, tax breakdown, and dashboard transaction record before completing a trade."] },
    { id: "settlement", title: "Settlement & Currency", body: ["Cross-border transactions may include currency conversion, local bank processing time, compliance review, or additional documentation before settlement is completed."] },
  ]),
  makePage("security", "Security & Trust", "Security", "How Krishibridge protects accounts, trades, ownership records, payments, support workflows, and market integrity.", [
    { id: "accounts", title: "Verified Accounts", body: ["Trading and administrative actions are designed around KYC, role-based permissions, one verified account per user, and secure session management."] },
    { id: "trade", title: "Trade & Record Security", body: ["Auction, RFQ, payment, grading, warehouse, and token workflows create reviewable records. Ownership tokens may use signed QR verification and transaction references."] },
    { id: "payments", title: "Payment Protection", body: ["Where supported, settlement is connected to verification events, payment status, invoices, and role-aware permissions so funds and records move through controlled workflows."] },
    { id: "report", title: "Report Security Concerns", body: ["If you suspect account compromise, unauthorized bidding, fraud, market manipulation, fake support contact, or hardware tampering, contact Krishibridge support immediately."] },
  ]),
];

const HI_PAGES: PublicInfoPage[] = [
  makePage("terms-and-conditions", "नियम और शर्तें", "शर्तें", "Krishibridge और Himalayan Commodity Exchange उपयोग करने का संचालन और कानूनी ढांचा।", [
    { id: "agreement", title: "1.1 अनुबंध", body: ["krishibridge.com पर खाता बनाकर या HCE में भाग लेकर आप Krishibridge Agrifin Technologies Pvt. Ltd. के साथ कानूनी समझौते में प्रवेश करते हैं।", "ये शर्तें procurement platforms, digital trade tools, hardware interfaces और क्षेत्रीय कृषि सेवाओं तक पहुंच को नियंत्रित करती हैं।"] },
    { id: "conduct", title: "1.2 बहु-देशीय उपयोगकर्ता आचरण", body: ["हर user को अपने निवासी देश के कानूनों में रहकर ईमानदारी से platform उपयोग करना होगा।"], items: [
      { title: "क्षेत्राधिकार अनुपालन", body: "Users भारत, भूटान, नेपाल या अपने निवासी देश के कानूनी ढांचे में काम करेंगे।" },
      { title: "सीमा-पार व्यापार", body: "International transactions के लिए सही customs, export, logistics और settlement documents देने होंगे।" },
      { title: "खाता अखंडता", body: "एक user केवल एक verified account रख सकता है। multi-accounting, नकली documents, bots या market manipulation पर suspension, permanent ban और legal reporting हो सकती है।" },
    ] },
    { id: "exchange", title: "1.3 Exchange और Fulfillment", body: ["HCE interface agricultural commodity trade और settlement का platform record बनाता है।"], items: [
      { title: "Trade Finality", body: "HCE पर की गई bid, offer या acceptance final होती है और time of sale तथा agreed price record करती है।" },
      { title: "Digital Escrow", body: "Funds warehouse arrival, grading confirmation या receipt confirmation जैसे verification events के आधार पर release होते हैं।" },
      { title: "Quality Assurance", body: "Grading Krishibridge standardized protocols से होती है और transaction workflow के लिए final मानी जाती है।" },
    ] },
    { id: "rights", title: "1.4 Proprietary Rights और Usage", body: ["Platform access से software, hardware designs, algorithms, data processes या intellectual property का ownership transfer नहीं होता।"], items: [
      { title: "Black Box Protection", body: "Web tools, processing interfaces, IoT sensors और grading units केवल approved platform use के लिए licensed हैं।" },
      { title: "Prohibited Inspection", body: "Software, algorithms, APIs या hardware interfaces को disassemble, decompile, bypass, scrape या reverse engineer करना मना है।" },
      { title: "Data Ownership", body: "Krishibridge aggregated और anonymized data पर अधिकार रखता है, जिसका उपयोग forecasting, quality intelligence, logistics planning और market stability में होता है।" },
    ] },
    { id: "fees", title: "1.5 Platform Fees और Levies", body: ["User trade commit करने से पहले fees देख सके, यही उद्देश्य है।"], items: [
      { title: "Service Fees", body: "Facilitated services के लिए platform, grading, settlement, processing या support fees लग सकती हैं।" },
      { title: "Taxation", body: "GST, VAT, duties, payment charges, bank charges, FX costs या local levies लागू हो सकते हैं। Users अपने tax obligations के लिए जिम्मेदार हैं।" },
    ] },
    { id: "liability", title: "1.6 दायित्व की सीमा", body: ["Krishibridge facilitator और technology infrastructure provider है, market returns का guarantor नहीं।"], items: [
      { title: "Market Fluctuations", body: "Crop price movement, price crash, bumper crop, currency devaluation या market timing loss के लिए Krishibridge liable नहीं है।" },
      { title: "Service Interruptions", body: "Remote regions में internet, power या satellite instability के कारण uninterrupted service guarantee नहीं की जा सकती।" },
    ] },
  ], "Version 2.0 - April 2026"),
  makePage("privacy-policy", "गोपनीयता नीति", "गोपनीयता", "सुरक्षित कृषि व्यापार के लिए जरूरी data को Krishibridge कैसे collect, use, protect, retain और transfer करता है।", [
    { id: "collection", title: "2.1 Data Collection", body: ["हम secure agricultural trade, onboarding, settlement, logistics और hardware interaction के लिए जरूरी जानकारी collect करते हैं।"], items: [
      { title: "Identity और KYC", body: "नाम, business registration, Aadhaar, PAN, CID जैसे government IDs और trade licensing details।" },
      { title: "Geographic Data", body: "Farm location, plot data और weather, soil, logistics, quality insights के location signals।" },
      { title: "Financial Data", body: "Bank details, GSTIN/VAT, payment references, escrow records और cross-border settlement data।" },
      { title: "Platform Activity", body: "Bidding history, transaction volumes, support requests, dashboard actions और hardware-interface logs।" },
    ] },
    { id: "purpose", title: "2.2 Processing का उद्देश्य", body: ["आपका data HCE को reliable, traceable और regional users के लिए useful रखता है।"], items: [
      { title: "Participant Verification", body: "Farmers, aggregators, buyers, warehouses, staff और admins को sensitive actions से पहले verify किया जाता है।" },
      { title: "Tokenization", body: "Data digital ownership records, warehouse lots, certificates और token references को physical owner से match करता है।" },
      { title: "Market Intelligence", body: "Anonymized aggregated data forecasts, crop health reports, demand trends और reliability सुधार में use हो सकता है।" },
      { title: "Operational Intelligence", body: "Hardware और sensor outputs से quality certificates, yield insights और fulfillment records बनते हैं।" },
    ] },
    { id: "transfers", title: "2.3 Data Sovereignty और Cross-Border Transfers", body: ["Krishibridge India, Nepal और Bhutan में operate करता है। trade, verification, logistics या settlement के लिए data borders के बीच transfer हो सकता है।", "हम Indian DPDPA और Bhutan/Nepal digital regulations के अनुरूप security practices use करते हैं। platform उपयोग करके आप essential cross-border data flow से सहमत होते हैं।"] },
    { id: "methods", title: "2.4 Proprietary Methods की सुरक्षा", body: ["Users को quality grades, soil scores, certificates और settlement records मिल सकते हैं, पर internal algorithms, scoring methods और technical processes Krishibridge trade secrets रहते हैं।"] },
    { id: "retention", title: "2.5 Data Retention और Security", body: ["हम encryption, access controls, secure servers और safeguards से trade/account data protect करते हैं।", "Records trade laws, tax audits, commodity rules या dispute needs के हिसाब से retain किए जाते हैं।"] },
    { id: "rights", title: "2.6 आपके अधिकार", body: ["आप personal data summary मांग सकते हैं, inaccurate profile/KYC सुधार सकते हैं और non-essential marketing consent वापस ले सकते हैं।", "Legal, tax, fraud-prevention, settlement या transaction-record purposes के लिए कुछ data रखा जा सकता है।"] },
  ], "Effective April 2026"),
  makePage("cookie-policy", "कुकी नीति", "कुकीज़", "Krishibridge पर cookies login, preferences, security, performance और consent को कैसे support करती हैं।", [
    { id: "what", title: "3.1 Cookies क्या हैं?", body: ["Cookies छोटे data files हैं जो krishibridge.com visit करने पर device में store होते हैं।", "ये secure session, language, currency, dashboard choices और real-time exchange activity याद रखते हैं।"] },
    { id: "usage", title: "3.2 हम Cookies कैसे Use करते हैं", body: ["Cookies categories में रखी जाती हैं। non-essential cookies consent के बाद load होती हैं।"], items: [
      { title: "Strictly Necessary", body: "Authentication, dashboard access, bidding integrity, account security और session protection के लिए जरूरी।" },
      { title: "Functional और Preference", body: "Consent के साथ currency, language, region और hardware-dashboard settings याद रहती हैं।" },
      { title: "Performance और Analytics", body: "Consent के साथ traffic, commodity interest, load balancing, speed और reliability समझने में मदद करती हैं।" },
    ] },
    { id: "third-party", title: "3.3 Third-Party Cookies", body: ["Verified payment gateways, secure maps या logistics partners जरूरत पर cookies set कर सकते हैं।", "हम third-party marketing trackers को Krishibridge activity follow नहीं करने देते।"] },
    { id: "manage", title: "3.4 Preferences Manage करना", body: ["Consent banner से accept, reject non-essential या customize किया जा सकता है। Browser settings से भी block कर सकते हैं।", "Strictly necessary cookies block करने पर login, bidding और exchange features बंद हो सकते हैं।"] },
    { id: "privacy", title: "3.5 Data Privacy Link", body: ["Cookies और platform activity से जुड़े personal data के लिए Privacy Policy देखें।"] },
  ], "Last updated April 2026"),
  makePage("disclaimer", "अस्वीकरण (जोखिम और दायित्व)", "अस्वीकरण", "Krishibridge उपयोग करते समय market, quality, technical, legal और external risks की सीमाएं।", [
    { id: "advice", title: "4.1 Financial या Investment Advice नहीं", body: ["Market data, price trends, forecasts और commodity information केवल information के लिए हैं।", "Krishibridge financial advisor नहीं है। buy, sell, hold, bid या participate करने का निर्णय user के risk पर है।"] },
    { id: "volatility", title: "4.2 Market Volatility Risk", body: ["Large cardamom सहित spice markets supply, demand, weather, currency और policy shifts से तेजी से बदल सकते हैं।", "Bumper crop, price crash, currency fluctuation या market timing loss के लिए Krishibridge liable नहीं है।"] },
    { id: "quality", title: "4.3 Quality और Biological Variation", body: ["Agricultural products biological goods हैं और storage/transit में moisture, weight, aroma या quality बदल सकती है।", "Quality certificates grading-time sample पर based होते हैं। बाद के storage, transit या handling changes के लिए Krishibridge liable नहीं है।"] },
    { id: "technical", title: "4.4 Technical और Connectivity Limitations", body: ["Remote और high-altitude regions में internet, power और devices की स्थिति बदल सकती है।", "Missed bids, failed transactions, local outages, power failures, satellite latency या device damage के लिए Krishibridge responsible नहीं है।"] },
    { id: "force", title: "4.5 Force Majeure", body: ["Earthquakes, landslides, floods, border closures, sudden import/export changes, political instability, strikes, riots या Golden Triangle logistics disturbance से delay/failure पर Krishibridge liable नहीं है।"] },
    { id: "third-party", title: "4.6 Third-Party Links और Services", body: ["Government portals, payment providers, logistics partners, maps या authorities के links हो सकते हैं। Krishibridge उनके content, security या policies control नहीं करता।"] },
    { id: "as-is", title: "4.7 As-Is Provision", body: ["Platform और hardware interfaces as-is और as-available basis पर दिए जाते हैं, बिना guaranteed commercial outcome या uninterrupted use warranty के।"] },
  ], "Effective April 2026"),
  makePage("regulatory-compliance", "नियामकीय अनुपालन जानकारी", "अनुपालन", "Technology-led, platform-neutral agricultural infrastructure provider के रूप में Krishibridge की public compliance position।", [
    { id: "startup", title: "5.1 Startup Recognition और India Compliance", body: ["Krishibridge Agrifin Technologies DPIIT-recognized deep-tech/agri-tech service provider के रूप में positioned है।"], items: [
      { title: "DPIIT Registration", body: "Company Department for Promotion of Industry and Internal Trade, Government of India द्वारा recognized है।" },
      { title: "Sector Role", body: "Krishibridge digital infrastructure, AI-grading, mechanized processing और exchange workflows देता है। यह principal trader की तरह spice inventory buy/sell/hold नहीं करता।" },
      { title: "IPR Compliance", body: "Hardware designs, software architecture, workflows और technical systems IP frameworks के तहत protected हैं।" },
    ] },
    { id: "international", title: "5.2 International Tech FDI Status", body: ["Krishibridge country-aware compliance और technology infrastructure से Himalayan agricultural trade support करता है।"], items: [
      { title: "Bhutan", body: "Krishibridge Kingdom of Bhutan में technology FDI entity के रूप में authorized है।" },
      { title: "Nepal", body: "Krishibridge approved FDI के साथ tech-enabled platform development/deployment करता है, NRB regulations और Industrial Enterprises Act के अनुरूप।" },
    ] },
    { id: "neutrality", title: "5.3 Platform Neutrality", body: ["Krishibridge platform neutrality रखता है और marketplace principal बनकर farmers, traders या buyers से compete नहीं करता।"] },
  ]),
  makePage("anti-fraud-policy", "धोखाधड़ी-रोधी नीति", "धोखाधड़ी-रोधी", "Identity, hardware, auction data, settlement records और cross-border trade integrity को protect करने वाले rules।", [
    { id: "technical", title: "6.1 Technical Integrity", body: ["Users Krishibridge technology, platform records, bidding systems या verification workflows में interference नहीं करेंगे।"], items: [
      { title: "Device Tampering", body: "Software/hardware interfaces, IoT sensors या grading units को bypass, modify, damage, inspect या reverse engineer करना prohibited है।" },
      { title: "Data Manipulation", body: "Scripts, bots, unauthorized API calls, fake traffic या market/auction/certificate/settlement records influence करना prohibited है।" },
      { title: "Consequences", body: "Violations पर service termination, transaction review, account suspension, evidence preservation और legal action हो सकता है।" },
    ] },
    { id: "identity", title: "6.2 Identity Fraud", body: ["Cross-border agricultural trade के कारण KYC mandatory है।", "Fraudulent credentials, false registrations, forged tax details, duplicate accounts या legal standing misrepresentation authorities को report हो सकती है।"] },
    { id: "reporting", title: "6.3 Reporting Concerns", body: ["Account compromise, fake bids, staff impersonation, bribery, hardware tampering या suspicious settlement requests तुरंत support को report करें।"] },
  ]),
  makePage("fees", "शुल्क और मूल्य", "शुल्क", "Platform fees, taxes, payment costs और settlement-related charges की स्पष्ट guide।", [
    { id: "principles", title: "Transparent Fee Principles", body: ["Krishibridge user के transaction commit करने से पहले relevant charges दिखाने का प्रयास करता है। Hidden principal-trading margins नहीं जोड़े जाते।"] },
    { id: "charges", title: "लागू Charges", body: ["Platform service fees, GST/VAT, gateway fees, bank charges, FX costs, warehouse grading, storage, inspection, processing, logistics या documentation support charges लागू हो सकते हैं।"] },
    { id: "review", title: "Fees कहां Review करें", body: ["Lot page, RFQ response, confirmation screen, invoice, payment instructions, tax breakdown और dashboard transaction record देखें।"] },
    { id: "settlement", title: "Settlement और Currency", body: ["Cross-border transactions में currency conversion, bank processing, compliance review या additional documents लग सकते हैं।"] },
  ]),
  makePage("security", "सुरक्षा और भरोसा", "सुरक्षा", "Krishibridge accounts, trades, ownership records, payments और market integrity को कैसे protect करता है।", [
    { id: "accounts", title: "Verified Accounts", body: ["Trading और administrative actions KYC, role-based permissions, one verified account per user और secure sessions पर based हैं।"] },
    { id: "trade", title: "Trade और Record Security", body: ["Auction, RFQ, payment, grading, warehouse और token workflows reviewable records बनाते हैं। ownership tokens signed QR verification use कर सकते हैं।"] },
    { id: "payments", title: "Payment Protection", body: ["Settlement verification events, payment status, invoices और role-aware permissions से controlled workflows में चलता है।"] },
    { id: "report", title: "Security Concerns Report करें", body: ["Account compromise, unauthorized bidding, fraud, market manipulation, fake support या hardware tampering का संदेह हो तो support से तुरंत contact करें।"] },
  ]),
];

const NE_PAGES: PublicInfoPage[] = localizeFromHindi("ne");
const DZ_PAGES: PublicInfoPage[] = localizeFromHindi("dz");
const AR_PAGES: PublicInfoPage[] = localizeFromHindi("ar");

function localizeFromHindi(locale: "ne" | "dz" | "ar"): PublicInfoPage[] {
  const packs: Record<"ne" | "dz" | "ar", { title: Record<PublicSlug, [string, string, string]>; sectionPrefix: string; body: string }> = {
    ne: {
      title: {
        "terms-and-conditions": ["सेवाका सर्तहरू", "सर्तहरू", "Krishibridge र Himalayan Commodity Exchange प्रयोग गर्नका लागि सञ्चालन तथा कानुनी ढाँचा।"],
        "privacy-policy": ["गोपनीयता नीति", "गोपनीयता", "सुरक्षित कृषि व्यापारका लागि आवश्यक data Krishibridge ले कसरी collect, use, protect, retain र transfer गर्छ।"],
        "cookie-policy": ["कुकी नीति", "कुकीहरू", "Krishibridge मा cookies ले login, preferences, security, performance र consent कसरी support गर्छन्।"],
        disclaimer: ["अस्वीकरण (जोखिम र दायित्व)", "अस्वीकरण", "Krishibridge प्रयोग गर्दा market, quality, technical, legal र external risks का सीमा।"],
        "regulatory-compliance": ["नियामकीय अनुपालन जानकारी", "अनुपालन", "Technology-led, platform-neutral agricultural infrastructure provider का रूपमा Krishibridge को public compliance position।"],
        "anti-fraud-policy": ["ठगी-रोधी नीति", "ठगी-रोधी", "Identity, hardware, auction data, settlement records र cross-border trade integrity जोगाउने rules।"],
        fees: ["शुल्क र मूल्य", "शुल्क", "Platform fees, taxes, payment costs र settlement-related charges को स्पष्ट guide।"],
        security: ["सुरक्षा र भरोसा", "सुरक्षा", "Krishibridge ले accounts, trades, ownership records, payments र market integrity कसरी protect गर्छ।"],
      },
      sectionPrefix: "यो खण्डले Krishibridge को नियम, प्रमाणिकरण, व्यापार अभिलेख, कर/शुल्क, settlement, data सुरक्षा र प्रयोगकर्ताको जिम्मेवारीलाई स्पष्ट गर्छ।",
      body: "प्रयोगकर्ताले आफ्नो देशका कानुन, KYC, customs/export documents, platform verification events, quality grading decisions, cookie consent, fraud-prevention controls र support reporting requirements पालना गर्नुपर्छ।",
    },
    dz: {
      title: {
        "terms-and-conditions": ["ཞབས་ཏོག་གི་ཆ་རྐྱེན།", "ཆ་རྐྱེན།", "Krishibridge དང Himalayan Commodity Exchange ལག་ལེན་གྱི་ལས་སྒོ་དང་ཁྲིམས་མཐུན་གཞི་རྩ།"],
        "privacy-policy": ["སྒེར་གཙང་སྲིད་བྱུས།", "སྒེར་གཙང་།", "ཉེན་སྲུང་ཅན་གྱི་སོ་ནམ་ཚོང་འབྲེལ་དོན་ལུ data སྡུད་ ལག་ལེན་ སྲུང་ ཉར་ དང་སྤོ་བཤུད་འབད་ཐངས།"],
        "cookie-policy": ["ཀུ་ཀི་སྲིད་བྱུས།", "ཀུ་ཀི།", "Krishibridge ནང cookies གིས login, preferences, security, performance དང consent ལུ་རྒྱབ་སྐྱོར་འབད་ཐངས།"],
        disclaimer: ["འགན་མེད་བརྡ་ཐོ།", "འགན་མེད།", "Krishibridge ལག་ལེན་སྐབས market, quality, technical, legal དང external risks གི་ཚད་བཀག།"],
        "regulatory-compliance": ["ཁྲིམས་མཐུན་བརྡ་དོན།", "ཁྲིམས་མཐུན།", "technology-led, platform-neutral agricultural infrastructure provider སྦེ Krishibridge གི public compliance position།"],
        "anti-fraud-policy": ["གཡོ་ཁྲམ་འགོག་པའི་སྲིད་བྱུས།", "གཡོ་ཁྲམ།", "Identity, hardware, auction data, settlement records དང cross-border trade integrity སྲུང་མི rules།"],
        fees: ["གླ་ཆ་དང་གོང་ཚད།", "གླ་ཆ།", "Platform fees, taxes, payment costs དང settlement-related charges གི་གསལ་བཤད།"],
        security: ["བདེ་འཇགས་དང་ཡིད་ཆེས།", "བདེ་འཇགས།", "Krishibridge གིས accounts, trades, ownership records, payments དང market integrity སྲུང་ཐངས།"],
      },
      sectionPrefix: "དོན་ཚན་འདི་གིས Krishibridge གི་སྒྲིག་ཁྲིམས་ ངོ་སྦྱོར་ ཚོང་ཐོ་ ཁྲལ/གླ་ཆ་ settlement དང data བདེ་འཇགས་གསལ་བཤད་འབདཝ་ཨིན།",
      body: "ལག་ལེན་པ་གིས་རང་སོའི་རྒྱལ་ཁབ་ཀྱི་ཁྲིམས་ KYC, customs/export documents, platform verification events, quality grading decisions, cookie consent, fraud-prevention controls དང support reporting requirements ལུ་གནས་དགོ།",
    },
    ar: {
      title: {
        "terms-and-conditions": ["الشروط والأحكام", "الشروط", "الإطار التشغيلي والقانوني لاستخدام Krishibridge والمشاركة في Himalayan Commodity Exchange."],
        "privacy-policy": ["سياسة الخصوصية", "الخصوصية", "كيف تجمع Krishibridge البيانات المطلوبة للتجارة الزراعية الآمنة وتستخدمها وتحميها وتحتفظ بها وتنقلها."],
        "cookie-policy": ["سياسة ملفات تعريف الارتباط", "الكوكيز", "كيف تدعم ملفات تعريف الارتباط جلسات الدخول والتفضيلات والأمان والأداء والموافقة في Krishibridge."],
        disclaimer: ["إخلاء المسؤولية (المخاطر والمسؤولية)", "إخلاء المسؤولية", "حدود مهمة لمخاطر السوق والجودة والتقنية والقانون والعوامل الخارجية عند استخدام Krishibridge."],
        "regulatory-compliance": ["معلومات الامتثال التنظيمي", "الامتثال", "موقف Krishibridge العام كمزود بنية تحتية زراعية تقني ومحايد للمنصة."],
        "anti-fraud-policy": ["سياسة مكافحة الاحتيال", "مكافحة الاحتيال", "قواعد تحمي الهوية والأجهزة وبيانات المزاد وسجلات التسوية ونزاهة التجارة عبر الحدود."],
        fees: ["الرسوم والتسعير", "الرسوم", "دليل واضح لرسوم المنصة والضرائب وتكاليف الدفع والرسوم المرتبطة بالتسوية."],
        security: ["الأمان والثقة", "الأمان", "كيف تحمي Krishibridge الحسابات والتداولات وسجلات الملكية والمدفوعات ونزاهة السوق."],
      },
      sectionPrefix: "يوضح هذا القسم قواعد Krishibridge الخاصة بالتحقق وسجلات التداول والضرائب والرسوم والتسوية وحماية البيانات ومسؤوليات المستخدم.",
      body: "يجب على المستخدمين الالتزام بقوانين بلدهم وKYC ووثائق الجمارك والتصدير وأحداث التحقق في المنصة وقرارات تصنيف الجودة وموافقة ملفات تعريف الارتباط وضوابط مكافحة الاحتيال ومتطلبات الإبلاغ للدعم.",
    },
  };

  const pack = packs[locale];
  return EN_PAGES.map((page) => {
    const [title, shortTitle, summary] = pack.title[page.slug as PublicSlug];
    return makePage(
      page.slug as PublicSlug,
      title,
      shortTitle,
      summary,
      page.sections.map((section) => ({
        ...section,
        title: translateSectionTitle(locale, section.title),
        body: [pack.sectionPrefix, pack.body],
        items: section.items?.map((item) => ({ title: translateSectionTitle(locale, item.title), body: pack.body })),
      })),
      page.updated,
    );
  });
}

function translateSectionTitle(locale: "ne" | "dz" | "ar", title: string) {
  const prefixMatch = title.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const number = prefixMatch?.[1];
  const plainTitle = prefixMatch?.[2] || title;
  const headings: Record<typeof locale, Record<string, string>> = {
    ne: {
      "Contractual Agreement": "सम्झौता",
      "Multi-Country User Conduct": "बहु-देशीय प्रयोगकर्ता आचरण",
      "The Exchange & Fulfillment": "Exchange र fulfillment",
      "Proprietary Rights & Usage": "स्वामित्व अधिकार र उपयोग",
      "Platform Fees & Levies": "Platform fees र levies",
      "Limitation of Liability": "दायित्वको सीमा",
      "Data Collection": "Data collection",
      "Purpose of Processing": "Processing को उद्देश्य",
      "Data Sovereignty & Cross-Border Transfers": "Data sovereignty र cross-border transfers",
      "Protection of Proprietary Methods": "Proprietary methods को सुरक्षा",
      "Data Retention & Security": "Data retention र security",
      "Your Rights": "तपाईंका अधिकार",
      "What are Cookies?": "Cookies के हुन्?",
      "How We Use Cookies": "हामी cookies कसरी प्रयोग गर्छौं",
      "Third-Party Cookies": "Third-party cookies",
      "Managing Preferences": "Preferences व्यवस्थापन",
      "Data Privacy Link": "Data privacy link",
      "No Financial or Investment Advice": "Financial वा investment advice होइन",
      "Market Volatility Risk": "Market volatility risk",
      "Quality & Biological Variation": "Quality र biological variation",
      "Technical & Connectivity Limitations": "Technical र connectivity limitations",
      "Force Majeure": "Force majeure",
      "Third-Party Links & Services": "Third-party links र services",
      "As-Is Provision": "As-is provision",
      "Startup Recognition & India Compliance": "Startup recognition र India compliance",
      "International Tech FDI Status": "International tech FDI status",
      "Platform Neutrality": "Platform neutrality",
      "Technical Integrity": "Technical integrity",
      "Identity Fraud": "Identity fraud",
      "Reporting Concerns": "Concerns report गर्ने",
      "Transparent Fee Principles": "Transparent fee principles",
      "Charges That May Apply": "लागू हुन सक्ने charges",
      "Where to Review Fees": "Fees कहाँ review गर्ने",
      "Settlement & Currency": "Settlement र currency",
      "Verified Accounts": "Verified accounts",
      "Trade & Record Security": "Trade र record security",
      "Payment Protection": "Payment protection",
      "Report Security Concerns": "Security concerns report गर्ने",
      "Jurisdictional Compliance": "क्षेत्राधिकार अनुपालन",
      "Cross-Border Trade": "सीमापार व्यापार",
      "Account Integrity": "खाता अखण्डता",
      "Trade Finality": "Trade finality",
      "Digital Escrow": "Digital escrow",
      "Quality Assurance": "Quality assurance",
      "Black Box Protection": "Black box protection",
      "Prohibited Inspection": "निषेधित निरीक्षण",
      "Data Ownership": "Data ownership",
      "Service Fees": "Service fees",
      Taxation: "Taxation",
      "Identity & KYC": "Identity र KYC",
      "Geographic Data": "Geographic data",
      "Financial Data": "Financial data",
      "Platform Activity": "Platform activity",
      "Participant Verification": "Participant verification",
      Tokenization: "Tokenization",
      "Market Intelligence": "Market intelligence",
      "Operational Intelligence": "Operational intelligence",
      "Strictly Necessary": "Strictly necessary",
      "Functional & Preference": "Functional र preference",
      "Performance & Analytics": "Performance र analytics",
      "DPIIT Registration": "DPIIT registration",
      "Sector Role": "Sector role",
      "IPR Compliance": "IPR compliance",
      Bhutan: "भुटान",
      Nepal: "नेपाल",
      "Device Tampering": "Device tampering",
      "Data Manipulation": "Data manipulation",
      Consequences: "परिणाम",
    },
    dz: {
      "Contractual Agreement": "གན་རྒྱ།",
      "Multi-Country User Conduct": "རྒྱལ་ཁབ་མང་པོའི་ལག་ལེན་པའི་སྤྱོད་ལམ།",
      "The Exchange & Fulfillment": "Exchange དང fulfillment།",
      "Proprietary Rights & Usage": "བདག་དབང་དང་ལག་ལེན།",
      "Platform Fees & Levies": "Platform fees དང levies།",
      "Limitation of Liability": "འགན་ཁུར་ཚད་བཀག",
      "Data Collection": "Data collection།",
      "Purpose of Processing": "Processing གི་དམིགས་ཡུལ།",
      "Data Sovereignty & Cross-Border Transfers": "Data sovereignty དང cross-border transfers།",
      "Protection of Proprietary Methods": "Proprietary methods སྲུང་སྐྱོབ།",
      "Data Retention & Security": "Data retention དང security།",
      "Your Rights": "ཁྱོད་ཀྱི་དབང་ཆ།",
      "What are Cookies?": "Cookies ག་ཅི་སྨོ།",
      "How We Use Cookies": "cookies ལག་ལེན་འཐབ་ཐངས།",
      "Third-Party Cookies": "Third-party cookies།",
      "Managing Preferences": "Preferences འཛིན་སྐྱོང་།",
      "Data Privacy Link": "Data privacy link།",
      "No Financial or Investment Advice": "Financial ཡང་ན investment advice མེན།",
      "Market Volatility Risk": "Market volatility risk།",
      "Quality & Biological Variation": "Quality དང biological variation།",
      "Technical & Connectivity Limitations": "Technical དང connectivity limitations།",
      "Force Majeure": "Force majeure།",
      "Third-Party Links & Services": "Third-party links དང services།",
      "As-Is Provision": "As-is provision།",
      "Startup Recognition & India Compliance": "Startup recognition དང India compliance།",
      "International Tech FDI Status": "International tech FDI status།",
      "Platform Neutrality": "Platform neutrality།",
      "Technical Integrity": "Technical integrity།",
      "Identity Fraud": "Identity fraud།",
      "Reporting Concerns": "ཚ་གྱང་སྙན་ཞུ།",
      "Transparent Fee Principles": "Transparent fee principles།",
      "Charges That May Apply": "འཇུག་འོང་མི charges།",
      "Where to Review Fees": "Fees ག་ཏེ review འབད་ནི།",
      "Settlement & Currency": "Settlement དང currency།",
      "Verified Accounts": "Verified accounts།",
      "Trade & Record Security": "Trade དང record security།",
      "Payment Protection": "Payment protection།",
      "Report Security Concerns": "Security concerns སྙན་ཞུ།",
      "Jurisdictional Compliance": "ཁྲིམས་ཁོངས་མཐུན་སྒྲིག",
      "Cross-Border Trade": "ས་མཚམས་བརྒལ་ཚོང་།",
      "Account Integrity": "རྩིས་ཁྲའི་གཙང་སྦྲ།",
      "Trade Finality": "Trade finality།",
      "Digital Escrow": "Digital escrow།",
      "Quality Assurance": "Quality assurance།",
      "Black Box Protection": "Black box protection།",
      "Prohibited Inspection": "བཀག་དམ་ཅན་གྱི་བརྟག་ཞིབ།",
      "Data Ownership": "Data ownership།",
      "Service Fees": "Service fees།",
      Taxation: "Taxation།",
      "Identity & KYC": "Identity དང KYC།",
      "Geographic Data": "Geographic data།",
      "Financial Data": "Financial data།",
      "Platform Activity": "Platform activity།",
      "Participant Verification": "Participant verification།",
      Tokenization: "Tokenization།",
      "Market Intelligence": "Market intelligence།",
      "Operational Intelligence": "Operational intelligence།",
      "Strictly Necessary": "Strictly necessary།",
      "Functional & Preference": "Functional དང preference།",
      "Performance & Analytics": "Performance དང analytics།",
      "DPIIT Registration": "DPIIT registration།",
      "Sector Role": "Sector role།",
      "IPR Compliance": "IPR compliance།",
      Bhutan: "Bhutan།",
      Nepal: "Nepal།",
      "Device Tampering": "Device tampering།",
      "Data Manipulation": "Data manipulation།",
      Consequences: "འབྲས་བུ།",
    },
    ar: {
      "Contractual Agreement": "الاتفاق التعاقدي",
      "Multi-Country User Conduct": "سلوك المستخدم متعدد الدول",
      "The Exchange & Fulfillment": "البورصة والتنفيذ",
      "Proprietary Rights & Usage": "الحقوق الملكية والاستخدام",
      "Platform Fees & Levies": "رسوم المنصة والجبايات",
      "Limitation of Liability": "حدود المسؤولية",
      "Data Collection": "جمع البيانات",
      "Purpose of Processing": "غرض المعالجة",
      "Data Sovereignty & Cross-Border Transfers": "سيادة البيانات والتحويلات عبر الحدود",
      "Protection of Proprietary Methods": "حماية الأساليب الملكية",
      "Data Retention & Security": "الاحتفاظ بالبيانات والأمان",
      "Your Rights": "حقوقك",
      "What are Cookies?": "ما هي ملفات تعريف الارتباط؟",
      "How We Use Cookies": "كيف نستخدم ملفات تعريف الارتباط",
      "Third-Party Cookies": "ملفات الطرف الثالث",
      "Managing Preferences": "إدارة التفضيلات",
      "Data Privacy Link": "رابط خصوصية البيانات",
      "No Financial or Investment Advice": "لا توجد مشورة مالية أو استثمارية",
      "Market Volatility Risk": "مخاطر تقلب السوق",
      "Quality & Biological Variation": "الجودة والتغير الحيوي",
      "Technical & Connectivity Limitations": "القيود التقنية والاتصال",
      "Force Majeure": "القوة القاهرة",
      "Third-Party Links & Services": "روابط وخدمات الطرف الثالث",
      "As-Is Provision": "تقديم الخدمة كما هي",
      "Startup Recognition & India Compliance": "الاعتراف كشركة ناشئة والامتثال في الهند",
      "International Tech FDI Status": "حالة FDI التقنية الدولية",
      "Platform Neutrality": "حياد المنصة",
      "Technical Integrity": "السلامة التقنية",
      "Identity Fraud": "احتيال الهوية",
      "Reporting Concerns": "الإبلاغ عن المخاوف",
      "Transparent Fee Principles": "مبادئ شفافية الرسوم",
      "Charges That May Apply": "رسوم قد تطبق",
      "Where to Review Fees": "أين تراجع الرسوم",
      "Settlement & Currency": "التسوية والعملة",
      "Verified Accounts": "حسابات موثقة",
      "Trade & Record Security": "أمان التداول والسجلات",
      "Payment Protection": "حماية المدفوعات",
      "Report Security Concerns": "الإبلاغ عن مخاوف الأمان",
      "Jurisdictional Compliance": "الامتثال للاختصاص القضائي",
      "Cross-Border Trade": "التجارة عبر الحدود",
      "Account Integrity": "سلامة الحساب",
      "Trade Finality": "نهائية الصفقة",
      "Digital Escrow": "الضمان الرقمي",
      "Quality Assurance": "ضمان الجودة",
      "Black Box Protection": "حماية الصندوق الأسود",
      "Prohibited Inspection": "الفحص المحظور",
      "Data Ownership": "ملكية البيانات",
      "Service Fees": "رسوم الخدمة",
      Taxation: "الضرائب",
      "Identity & KYC": "الهوية وKYC",
      "Geographic Data": "البيانات الجغرافية",
      "Financial Data": "البيانات المالية",
      "Platform Activity": "نشاط المنصة",
      "Participant Verification": "التحقق من المشاركين",
      Tokenization: "الترميز",
      "Market Intelligence": "ذكاء السوق",
      "Operational Intelligence": "الذكاء التشغيلي",
      "Strictly Necessary": "ضرورية دائما",
      "Functional & Preference": "وظيفية وتفضيلية",
      "Performance & Analytics": "الأداء والتحليلات",
      "DPIIT Registration": "تسجيل DPIIT",
      "Sector Role": "دور القطاع",
      "IPR Compliance": "امتثال الملكية الفكرية",
      Bhutan: "بوتان",
      Nepal: "نيبال",
      "Device Tampering": "العبث بالأجهزة",
      "Data Manipulation": "التلاعب بالبيانات",
      Consequences: "العواقب",
    },
  };
  const translated = headings[locale][plainTitle] || plainTitle;
  return number ? `${number} ${translated}` : translated;
}

const PAGES_BY_LOCALE: Record<LocaleCode, PublicInfoPage[]> = {
  en: EN_PAGES,
  hi: HI_PAGES,
  ne: NE_PAGES,
  dz: DZ_PAGES,
  ar: AR_PAGES,
};

export function normalizeLocale(locale: string): LocaleCode {
  return (["en", "hi", "ne", "dz", "ar"] as string[]).includes(locale) ? (locale as LocaleCode) : "en";
}

export function getPublicLabels(locale: string) {
  return PUBLIC_LABELS[normalizeLocale(locale)];
}

export function getPublicInfoPages(locale: string = "en") {
  return PAGES_BY_LOCALE[normalizeLocale(locale)];
}

export function getPublicInfoPage(slug: string, locale: string = "en") {
  return getPublicInfoPages(locale).find((page) => page.slug === slug);
}
