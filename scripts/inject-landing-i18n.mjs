// One-off helper: injects a fully translated `landing` namespace into each
// locale JSON so the new homepage is translatable across en/hi/ne/ar/dz.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src", "i18n", "messages");

const landing = {
  en: {
    nav: {
      commodities: "Commodities",
      howItWorks: "How it works",
      whyUs: "Why Krishibridge",
      countries: "Countries",
    },
    hero: {
      badge: "South Asia → Gulf · Live exchange",
      title1: "Verified Himalayan commodities.",
      titleHighlight1: "Tokenised trade.",
      titleHighlight2: "Six countries.",
      description:
        "Krishibridge connects verified highland farmers and cooperatives with importers across India, Nepal, Bhutan, and the Gulf. Bid live, settle in your own currency, and redeem at the warehouse with a signed QR token.",
      ctaPrimary: "List your harvest",
      ctaSecondary: "Browse today’s lots",
      livePreview: "Live marketplace",
      updatedNow: "Updated just now",
      openMarketplace: "Open marketplace",
      settledToday: "Settled today",
    },
    commodities: {
      blackCardamom: { name: "Black Cardamom", origin: "Sikkim · East Nepal" },
      orthodoxTea: { name: "Orthodox Tea", origin: "Darjeeling · Ilam · Dhankuta" },
      blackTea: { name: "Black Tea", origin: "Assam · Terai" },
      activeLots: "{count} active lots",
      liveTag: "{count} live",
      indicativeBand: "Indicative band",
    },
    trust: {
      kyc: "100% KYC-verified accounts",
      alwaysOn: "24/7 live trading window",
      escrow: "Escrow-protected settlement",
      transparent: "Transparent fees, no hidden spreads",
    },
    metrics: {
      countries: "Countries connected",
      commodities: "Commodities listed",
      languages: "Languages supported",
      currencies: "Currencies settled",
    },
    sectionCommodities: {
      eyebrow: "What we trade",
      title: "Certified origin, indicative pricing, live inventory.",
      description: "Each listing is lab-graded and compliance-checked before it goes live.",
    },
    personas: {
      eyebrow: "For both sides of the trade",
      title: "One exchange, two workflows.",
      farmer: {
        title: "Farmers & aggregators",
        subtitle: "Reach global buyers without a middleman.",
        b1: "List your harvest in minutes",
        b2: "Accept bids in INR, NPR, BTN or USD",
        b3: "Payouts released the moment the buyer confirms receipt",
        cta: "List your harvest",
      },
      buyer: {
        title: "Importers & traders",
        subtitle: "Source verified Himalayan commodities with confidence.",
        b1: "Browse live lots with lab-certified grades",
        b2: "Bid or send an RFQ for custom volumes",
        b3: "Redeem at the warehouse with a signed QR token",
        cta: "Browse today’s lots",
      },
    },
    how: {
      eyebrow: "How it works",
      title: "Four steps from harvest to warehouse handover.",
      s1: {
        title: "Sign up & verify",
        desc: "Complete KYC in minutes. Farmers confirm identity and bank details; buyers confirm company and trade licence.",
      },
      s2: {
        title: "List or discover",
        desc: "Sellers upload lots with origin, grade, lab reports, and photos. Buyers browse live lots or post an RFQ.",
      },
      s3: {
        title: "Bid or negotiate",
        desc: "Open English auction with anti-sniping, or direct RFQ negotiation for large orders. Escrow holds funds.",
      },
      s4: {
        title: "Pay & redeem at the warehouse",
        desc: "Settle in your own currency. Receive a signed QR token. Scan at the warehouse to take delivery.",
      },
    },
    features: {
      eyebrow: "Why Krishibridge",
      title: "What sets this exchange apart.",
      f1: {
        title: "Tokenised QR redemption",
        desc: "Every settled lot becomes a signed digital token. Present the QR at the warehouse to take delivery — tamper-proof, transferable, and auditable.",
      },
      f2: {
        title: "Dzongkha, Hindi, Nepali, Arabic, English",
        desc: "The only commodity exchange with first-class Dzongkha support — plus RTL Arabic for Gulf importers.",
      },
      f3: {
        title: "Settle in your own currency",
        desc: "INR, NPR, BTN, AED, SAR, OMR, USD. Transparent FX, no hidden spreads. Payouts reach farmers in the local rail they already use.",
      },
      f4: {
        title: "Bank-grade security",
        desc: "Every account is KYC-verified. Every transaction is encrypted end-to-end. Every token is tamper-proof and verifiable offline.",
      },
      f5: {
        title: "Verified origin and quality",
        desc: "Lab-tested grades, phytosanitary docs, and origin certificates attached to every lot — reviewed before going live.",
      },
      f6: {
        title: "Live auctions + RFQ",
        desc: "Price discovery through open English auctions with anti-sniping, or direct quote requests for large custom orders.",
      },
      distinctive: "Distinctive",
      securityNote: "Technical specifications on encryption, token signing, and audit trails are available at /security.",
    },
    heritage: {
      eyebrow: "Our AgriTech heritage",
      title: "Built on a decade of farmer-first technology.",
      description:
        "KrishiBridge started as an AgriTech mission to bring precision farming within reach of every smallholder — weather intelligence, smart irrigation, and land protection. The commodity exchange is the next chapter: turning that verified ground truth into global market access.",
      weather: {
        title: "Weather Monitoring",
        desc: "Hyper-local climate data helps farmers plan sowing, harvest, and storage with confidence.",
      },
      irrigation: {
        title: "Smart Irrigation",
        desc: "Soil-moisture aware irrigation schedules cut water waste and lift yield per acre.",
      },
      land: {
        title: "Land Protection",
        desc: "Soil health, boundary integrity, and compliance — monitored so farms stay productive year on year.",
      },
    },
    countriesSection: {
      eyebrow: "Where we operate",
      title: "Six countries. Five languages. Seven currencies.",
      description:
        "Localised for every market we serve — including first-class Dzongkha for Bhutan and RTL Arabic for the Gulf.",
      in: "India",
      np: "Nepal",
      bt: "Bhutan",
      ae: "UAE",
      sa: "Saudi Arabia",
      om: "Oman",
      originBuyer: "Origin · Buyer",
      origin: "Origin (Dzongkha)",
      importer: "Importer",
    },
    finalCta: {
      title: "Ready to list — or ready to buy?",
      description:
        "Join verified farmers, cooperatives, and importers trading Himalayan commodities across six countries.",
      ctaPrimary: "List your harvest",
      ctaSecondary: "Browse today’s lots",
    },
    footer: {
      tagline: "Cross-border agri-commodity exchange for South Asia and the Gulf.",
      platformTitle: "Platform",
      platform: {
        marketplace: "Marketplace",
        how: "How it works",
        features: "Features",
        register: "Create account",
      },
      companyTitle: "Company",
      company: {
        about: "About",
        fees: "Fees",
        security: "Security",
        careers: "Careers",
      },
      supportTitle: "Support",
      support: {
        whatsapp: "WhatsApp",
        email: "Email",
        phonePrimary: "+91 91268 40029",
        phoneSecondary: "+91 89189 35236",
        contact: "Contact",
      },
      legalTitle: "Legal",
      legal: {
        terms: "Terms of service",
        privacy: "Privacy policy",
        compliance: "Compliance",
      },
      address: "Headquartered in Sikkim, India. Serving South Asia & the Gulf.",
      entity: "KrishiBridge Agrifin Technologies Private Limited",
      copyright: "All rights reserved.",
    },
  },

  hi: {
    nav: {
      commodities: "कमोडिटीज़",
      howItWorks: "यह कैसे काम करता है",
      whyUs: "क्रिशिब्रिज क्यों",
      countries: "देश",
    },
    hero: {
      badge: "दक्षिण एशिया → खाड़ी · लाइव एक्सचेंज",
      title1: "प्रमाणित हिमालयी कमोडिटीज़।",
      titleHighlight1: "टोकनाइज़्ड व्यापार।",
      titleHighlight2: "छह देश।",
      description:
        "क्रिशिब्रिज सत्यापित पहाड़ी किसानों और सहकारी समितियों को भारत, नेपाल, भूटान और खाड़ी देशों के आयातकों से जोड़ता है। लाइव बोली लगाएं, अपनी मुद्रा में भुगतान करें, और हस्ताक्षरित QR टोकन के साथ वेयरहाउस से माल लें।",
      ctaPrimary: "अपनी फ़सल सूचीबद्ध करें",
      ctaSecondary: "आज के लॉट देखें",
      livePreview: "लाइव मार्केटप्लेस",
      updatedNow: "अभी अपडेट किया गया",
      openMarketplace: "मार्केटप्लेस खोलें",
      settledToday: "आज निपटाया गया",
    },
    commodities: {
      blackCardamom: { name: "काली इलायची", origin: "सिक्किम · पूर्वी नेपाल" },
      orthodoxTea: { name: "ऑर्थोडॉक्स चाय", origin: "दार्जिलिंग · इलाम · धनकुटा" },
      blackTea: { name: "काली चाय", origin: "असम · तराई" },
      activeLots: "{count} सक्रिय लॉट",
      liveTag: "{count} लाइव",
      indicativeBand: "सांकेतिक मूल्य सीमा",
    },
    trust: {
      kyc: "100% KYC-सत्यापित खाते",
      alwaysOn: "24/7 लाइव ट्रेडिंग विंडो",
      escrow: "एस्क्रो-सुरक्षित निपटान",
      transparent: "पारदर्शी शुल्क, कोई छिपा हुआ अंतर नहीं",
    },
    metrics: {
      countries: "जुड़े हुए देश",
      commodities: "सूचीबद्ध कमोडिटीज़",
      languages: "समर्थित भाषाएँ",
      currencies: "निपटाई गई मुद्राएँ",
    },
    sectionCommodities: {
      eyebrow: "हम क्या व्यापार करते हैं",
      title: "प्रमाणित मूल, सांकेतिक मूल्य, लाइव इन्वेंटरी।",
      description: "हर लिस्टिंग लाइव होने से पहले प्रयोगशाला-प्रमाणित और अनुपालन-जाँची जाती है।",
    },
    personas: {
      eyebrow: "व्यापार के दोनों पक्षों के लिए",
      title: "एक एक्सचेंज, दो वर्कफ़्लो।",
      farmer: {
        title: "किसान और एग्रीगेटर",
        subtitle: "बिचौलिए के बिना वैश्विक खरीदारों तक पहुँचें।",
        b1: "मिनटों में अपनी फ़सल सूचीबद्ध करें",
        b2: "INR, NPR, BTN या USD में बोलियाँ स्वीकार करें",
        b3: "खरीदार की प्राप्ति पुष्टि होते ही भुगतान जारी",
        cta: "अपनी फ़सल सूचीबद्ध करें",
      },
      buyer: {
        title: "आयातक और व्यापारी",
        subtitle: "आत्मविश्वास के साथ प्रमाणित हिमालयी कमोडिटीज़ प्राप्त करें।",
        b1: "प्रयोगशाला-प्रमाणित ग्रेड के साथ लाइव लॉट देखें",
        b2: "कस्टम वॉल्यूम के लिए बोली लगाएं या RFQ भेजें",
        b3: "हस्ताक्षरित QR टोकन के साथ वेयरहाउस में रिडीम करें",
        cta: "आज के लॉट देखें",
      },
    },
    how: {
      eyebrow: "यह कैसे काम करता है",
      title: "फ़सल से वेयरहाउस सौंपने तक चार चरण।",
      s1: {
        title: "पंजीकरण और सत्यापन",
        desc: "मिनटों में KYC पूरा करें। किसान पहचान और बैंक विवरण की पुष्टि करते हैं; खरीदार कंपनी और व्यापार लाइसेंस की पुष्टि करते हैं।",
      },
      s2: {
        title: "सूची या खोज",
        desc: "विक्रेता मूल, ग्रेड, लैब रिपोर्ट और फ़ोटो के साथ लॉट अपलोड करते हैं। खरीदार लाइव लॉट देखते हैं या RFQ पोस्ट करते हैं।",
      },
      s3: {
        title: "बोली या बातचीत",
        desc: "एंटी-स्नाइपिंग के साथ ओपन इंग्लिश ऑक्शन, या बड़े ऑर्डर के लिए सीधी RFQ बातचीत। एस्क्रो फ़ंड रखता है।",
      },
      s4: {
        title: "भुगतान और वेयरहाउस में रिडीम",
        desc: "अपनी मुद्रा में निपटान करें। हस्ताक्षरित QR टोकन प्राप्त करें। डिलीवरी के लिए वेयरहाउस में स्कैन करें।",
      },
    },
    features: {
      eyebrow: "क्रिशिब्रिज क्यों",
      title: "यह एक्सचेंज क्या अलग बनाता है।",
      f1: {
        title: "टोकनाइज़्ड QR रिडेम्पशन",
        desc: "हर निपटाया गया लॉट एक हस्ताक्षरित डिजिटल टोकन बनता है। डिलीवरी के लिए वेयरहाउस में QR प्रस्तुत करें — छेड़छाड़-रोधी, हस्तांतरणीय और लेखापरीक्षा योग्य।",
      },
      f2: {
        title: "ज़ोंगखा, हिंदी, नेपाली, अरबी, अंग्रेज़ी",
        desc: "एकमात्र कमोडिटी एक्सचेंज जिसमें प्रथम श्रेणी ज़ोंगखा समर्थन है — साथ ही खाड़ी आयातकों के लिए RTL अरबी।",
      },
      f3: {
        title: "अपनी मुद्रा में निपटान",
        desc: "INR, NPR, BTN, AED, SAR, OMR, USD। पारदर्शी FX, कोई छिपा हुआ स्प्रेड नहीं। किसानों को स्थानीय रेल में भुगतान मिलता है।",
      },
      f4: {
        title: "बैंक-ग्रेड सुरक्षा",
        desc: "हर खाता KYC-सत्यापित। हर लेन-देन एंड-टू-एंड एन्क्रिप्टेड। हर टोकन छेड़छाड़-रोधी और ऑफ़लाइन सत्यापन योग्य।",
      },
      f5: {
        title: "प्रमाणित मूल और गुणवत्ता",
        desc: "प्रयोगशाला-परीक्षित ग्रेड, फाइटोसैनिटरी दस्तावेज़ और मूल प्रमाणपत्र हर लॉट से जुड़े — लाइव होने से पहले समीक्षित।",
      },
      f6: {
        title: "लाइव नीलामी + RFQ",
        desc: "एंटी-स्नाइपिंग के साथ ओपन इंग्लिश ऑक्शन के ज़रिए मूल्य खोज, या बड़े कस्टम ऑर्डर के लिए सीधे उद्धरण अनुरोध।",
      },
      distinctive: "विशिष्ट",
      securityNote: "एन्क्रिप्शन, टोकन हस्ताक्षर और ऑडिट ट्रेल पर तकनीकी विनिर्देश /security पर उपलब्ध हैं।",
    },
    heritage: {
      eyebrow: "हमारी एग्रीटेक विरासत",
      title: "किसान-पहले तकनीक के एक दशक पर निर्मित।",
      description:
        "क्रिशिब्रिज एक एग्रीटेक मिशन के रूप में शुरू हुआ ताकि हर छोटे किसान तक सटीक खेती पहुँचाई जा सके — मौसम की जानकारी, स्मार्ट सिंचाई और भूमि सुरक्षा। कमोडिटी एक्सचेंज अगला अध्याय है: उस सत्यापित ज़मीनी सच्चाई को वैश्विक बाज़ार पहुँच में बदलना।",
      weather: {
        title: "मौसम निगरानी",
        desc: "हाइपर-लोकल जलवायु डेटा किसानों को आत्मविश्वास के साथ बुवाई, कटाई और भंडारण की योजना बनाने में मदद करता है।",
      },
      irrigation: {
        title: "स्मार्ट सिंचाई",
        desc: "मृदा-नमी जागरूक सिंचाई कार्यक्रम पानी की बर्बादी कम करते हैं और प्रति एकड़ उपज बढ़ाते हैं।",
      },
      land: {
        title: "भूमि सुरक्षा",
        desc: "मिट्टी का स्वास्थ्य, सीमा अखंडता और अनुपालन — निगरानी ताकि खेत साल-दर-साल उत्पादक रहें।",
      },
    },
    countriesSection: {
      eyebrow: "हम कहाँ संचालित होते हैं",
      title: "छह देश। पाँच भाषाएँ। सात मुद्राएँ।",
      description:
        "हर बाज़ार के लिए स्थानीयकृत — भूटान के लिए प्रथम श्रेणी ज़ोंगखा और खाड़ी के लिए RTL अरबी सहित।",
      in: "भारत",
      np: "नेपाल",
      bt: "भूटान",
      ae: "यूएई",
      sa: "सऊदी अरब",
      om: "ओमान",
      originBuyer: "मूल · खरीदार",
      origin: "मूल (ज़ोंगखा)",
      importer: "आयातक",
    },
    finalCta: {
      title: "सूचीबद्ध करने के लिए तैयार — या खरीदने के लिए तैयार?",
      description:
        "छह देशों में हिमालयी कमोडिटीज़ का व्यापार करने वाले सत्यापित किसानों, सहकारी समितियों और आयातकों से जुड़ें।",
      ctaPrimary: "अपनी फ़सल सूचीबद्ध करें",
      ctaSecondary: "आज के लॉट देखें",
    },
    footer: {
      tagline: "दक्षिण एशिया और खाड़ी के लिए सीमा-पार कृषि कमोडिटी एक्सचेंज।",
      platformTitle: "प्लेटफ़ॉर्म",
      platform: {
        marketplace: "मार्केटप्लेस",
        how: "यह कैसे काम करता है",
        features: "विशेषताएँ",
        register: "खाता बनाएं",
      },
      companyTitle: "कंपनी",
      company: {
        about: "हमारे बारे में",
        fees: "शुल्क",
        security: "सुरक्षा",
        careers: "करियर",
      },
      supportTitle: "सहायता",
      support: {
        whatsapp: "व्हाट्सएप",
        email: "ईमेल",
        phonePrimary: "+91 91268 40029",
        phoneSecondary: "+91 89189 35236",
        contact: "संपर्क",
      },
      legalTitle: "क़ानूनी",
      legal: {
        terms: "सेवा की शर्तें",
        privacy: "गोपनीयता नीति",
        compliance: "अनुपालन",
      },
      address: "सिक्किम, भारत में मुख्यालय। दक्षिण एशिया और खाड़ी की सेवा।",
      entity: "क्रिशिब्रिज एग्रीफिन टेक्नोलॉजीज़ प्राइवेट लिमिटेड",
      copyright: "सर्वाधिकार सुरक्षित।",
    },
  },

  ne: {
    nav: {
      commodities: "कमोडिटीहरू",
      howItWorks: "यो कसरी काम गर्छ",
      whyUs: "किन कृषिब्रिज",
      countries: "देशहरू",
    },
    hero: {
      badge: "दक्षिण एसिया → खाडी · लाइभ एक्सचेन्ज",
      title1: "प्रमाणित हिमाली कमोडिटीहरू।",
      titleHighlight1: "टोकनाइज्ड व्यापार।",
      titleHighlight2: "छ देश।",
      description:
        "कृषिब्रिजले भारत, नेपाल, भुटान र खाडी क्षेत्रका प्रमाणित उच्च पहाडी किसान र सहकारीहरूलाई आयातकर्ताहरूसँग जोड्छ। प्रत्यक्ष बोली लगाउनुहोस्, आफ्नै मुद्रामा भुक्तानी गर्नुहोस्, र हस्ताक्षरित QR टोकनसहित गोदामबाट सामान लिनुहोस्।",
      ctaPrimary: "तपाईंको फसल सूचीबद्ध गर्नुहोस्",
      ctaSecondary: "आजका लटहरू हेर्नुहोस्",
      livePreview: "प्रत्यक्ष बजार",
      updatedNow: "भर्खरै अद्यावधिक",
      openMarketplace: "बजार खोल्नुहोस्",
      settledToday: "आज निपटान भएको",
    },
    commodities: {
      blackCardamom: { name: "कालो अलैंची", origin: "सिक्किम · पूर्वी नेपाल" },
      orthodoxTea: { name: "अर्थोडक्स चिया", origin: "दार्जिलिङ · इलाम · धनकुटा" },
      blackTea: { name: "कालो चिया", origin: "असम · तराई" },
      activeLots: "{count} सक्रिय लट",
      liveTag: "{count} प्रत्यक्ष",
      indicativeBand: "सांकेतिक मूल्य सीमा",
    },
    trust: {
      kyc: "१००% KYC-प्रमाणित खाताहरू",
      alwaysOn: "२४/७ प्रत्यक्ष ट्रेडिङ विन्डो",
      escrow: "एस्क्रो-सुरक्षित निपटान",
      transparent: "पारदर्शी शुल्क, कुनै लुकेको अन्तर छैन",
    },
    metrics: {
      countries: "जोडिएका देशहरू",
      commodities: "सूचीबद्ध कमोडिटीहरू",
      languages: "समर्थित भाषाहरू",
      currencies: "निपटान भएका मुद्राहरू",
    },
    sectionCommodities: {
      eyebrow: "हामी के व्यापार गर्छौं",
      title: "प्रमाणित स्रोत, सांकेतिक मूल्य, प्रत्यक्ष इन्भेन्टरी।",
      description: "प्रत्येक सूची लाइभ हुनुभन्दा अघि प्रयोगशाला-प्रमाणित र अनुपालन-जाँच गरिन्छ।",
    },
    personas: {
      eyebrow: "व्यापारका दुवै पक्षका लागि",
      title: "एक एक्सचेन्ज, दुई कार्यप्रवाह।",
      farmer: {
        title: "किसान र एग्रिगेटरहरू",
        subtitle: "बिचौलिया बिना विश्वव्यापी खरिदकर्ताहरूसम्म पुग्नुहोस्।",
        b1: "मिनेटमा आफ्नो फसल सूचीबद्ध गर्नुहोस्",
        b2: "INR, NPR, BTN वा USD मा बोली स्वीकार गर्नुहोस्",
        b3: "खरिदकर्ताले प्राप्ति पुष्टि गरेपछि तुरुन्तै भुक्तानी",
        cta: "तपाईंको फसल सूचीबद्ध गर्नुहोस्",
      },
      buyer: {
        title: "आयातकर्ता र व्यापारीहरू",
        subtitle: "आत्मविश्वासका साथ प्रमाणित हिमाली कमोडिटीहरू प्राप्त गर्नुहोस्।",
        b1: "प्रयोगशाला-प्रमाणित ग्रेडसहित प्रत्यक्ष लटहरू हेर्नुहोस्",
        b2: "कस्टम मात्राको लागि बोली लगाउनुहोस् वा RFQ पठाउनुहोस्",
        b3: "हस्ताक्षरित QR टोकनसहित गोदाममा रिडिम गर्नुहोस्",
        cta: "आजका लटहरू हेर्नुहोस्",
      },
    },
    how: {
      eyebrow: "यो कसरी काम गर्छ",
      title: "फसलदेखि गोदाम हस्तान्तरणसम्म चार चरण।",
      s1: {
        title: "दर्ता र प्रमाणीकरण",
        desc: "मिनेटमा KYC पूरा गर्नुहोस्। किसानहरूले पहिचान र बैंक विवरण पुष्टि गर्छन्; खरिदकर्ताहरूले कम्पनी र व्यापार इजाजतपत्र पुष्टि गर्छन्।",
      },
      s2: {
        title: "सूची वा खोज",
        desc: "बिक्रेताहरूले स्रोत, ग्रेड, ल्याब रिपोर्ट र फोटोहरूसहित लटहरू अपलोड गर्छन्। खरिदकर्ताहरूले प्रत्यक्ष लटहरू हेर्छन् वा RFQ पोस्ट गर्छन्।",
      },
      s3: {
        title: "बोली वा वार्ता",
        desc: "एन्टी-स्नाइपिङसहित खुला अङ्ग्रेजी लिलाम, वा ठूला अर्डरका लागि प्रत्यक्ष RFQ वार्ता। एस्क्रोले रकम राख्छ।",
      },
      s4: {
        title: "भुक्तानी र गोदाममा रिडिम",
        desc: "आफ्नै मुद्रामा निपटान गर्नुहोस्। हस्ताक्षरित QR टोकन प्राप्त गर्नुहोस्। डेलिभरीको लागि गोदाममा स्क्यान गर्नुहोस्।",
      },
    },
    features: {
      eyebrow: "किन कृषिब्रिज",
      title: "यस एक्सचेन्जलाई के फरक बनाउँछ।",
      f1: {
        title: "टोकनाइज्ड QR रिडेम्पसन",
        desc: "प्रत्येक निपटान भएको लट हस्ताक्षरित डिजिटल टोकन बन्छ। डेलिभरीको लागि गोदाममा QR प्रस्तुत गर्नुहोस् — छेडछाड-रोधी, हस्तान्तरणयोग्य, र लेखापरीक्षण योग्य।",
      },
      f2: {
        title: "जोङ्खा, हिन्दी, नेपाली, अरबी, अङ्ग्रेजी",
        desc: "एकमात्र कमोडिटी एक्सचेन्ज जसमा प्रथम श्रेणीको जोङ्खा समर्थन छ — र खाडी आयातकर्ताहरूका लागि RTL अरबी।",
      },
      f3: {
        title: "आफ्नै मुद्रामा निपटान",
        desc: "INR, NPR, BTN, AED, SAR, OMR, USD। पारदर्शी FX, कुनै लुकेको स्प्रेड छैन। किसानहरूले स्थानीय च्यानलमा भुक्तानी पाउँछन्।",
      },
      f4: {
        title: "बैंक-स्तरीय सुरक्षा",
        desc: "प्रत्येक खाता KYC-प्रमाणित। प्रत्येक कारोबार एन्ड-टु-एन्ड एन्क्रिप्टेड। प्रत्येक टोकन छेडछाड-रोधी र अफलाइन प्रमाणन योग्य।",
      },
      f5: {
        title: "प्रमाणित स्रोत र गुणस्तर",
        desc: "प्रयोगशाला-परीक्षित ग्रेडहरू, फाइटोसेनिटरी कागजातहरू, र स्रोत प्रमाणपत्रहरू प्रत्येक लटमा संलग्न — लाइभ हुनुभन्दा अघि समीक्षा गरिएको।",
      },
      f6: {
        title: "प्रत्यक्ष लिलाम + RFQ",
        desc: "एन्टी-स्नाइपिङसहित खुला अङ्ग्रेजी लिलाम मार्फत मूल्य खोज, वा ठूला कस्टम अर्डरका लागि प्रत्यक्ष उद्धरण अनुरोध।",
      },
      distinctive: "विशिष्ट",
      securityNote: "एन्क्रिप्सन, टोकन हस्ताक्षर, र अडिट ट्रेलमा प्राविधिक विनिर्देशहरू /security मा उपलब्ध छन्।",
    },
    heritage: {
      eyebrow: "हाम्रो एग्रीटेक विरासत",
      title: "किसान-पहिलो प्रविधिको एक दशकमा निर्मित।",
      description:
        "कृषिब्रिज एक एग्रीटेक मिशनको रूपमा सुरु भयो ताकि हरेक साना किसानसम्म परिशुद्ध खेती पुग्न सकोस् — मौसम बुद्धिमत्ता, स्मार्ट सिँचाइ, र भूमि संरक्षण। कमोडिटी एक्सचेन्ज अर्को अध्याय हो: त्यो प्रमाणित जमीनी सत्यलाई विश्वव्यापी बजार पहुँचमा परिणत गर्नु।",
      weather: {
        title: "मौसम अनुगमन",
        desc: "हाइपर-लोकल जलवायु डाटाले किसानहरूलाई आत्मविश्वासका साथ रोपाइँ, कटनी र भण्डारणको योजना बनाउन मद्दत गर्छ।",
      },
      irrigation: {
        title: "स्मार्ट सिँचाइ",
        desc: "माटोको नमी-सचेत सिँचाइ तालिकाले पानीको खेर जाने कम गर्छ र प्रति एकड उत्पादन बढाउँछ।",
      },
      land: {
        title: "भूमि संरक्षण",
        desc: "माटोको स्वास्थ्य, सीमाना अखण्डता, र अनुपालन — अनुगमन गरिएको ताकि खेतहरू वर्षौंसम्म उत्पादनशील रहून्।",
      },
    },
    countriesSection: {
      eyebrow: "हामी कहाँ सञ्चालन गर्छौं",
      title: "छ देश। पाँच भाषा। सात मुद्रा।",
      description:
        "हरेक बजारका लागि स्थानीयकृत — भुटानका लागि प्रथम श्रेणीको जोङ्खा र खाडीका लागि RTL अरबीसहित।",
      in: "भारत",
      np: "नेपाल",
      bt: "भुटान",
      ae: "यूएई",
      sa: "साउदी अरब",
      om: "ओमान",
      originBuyer: "स्रोत · खरिदकर्ता",
      origin: "स्रोत (जोङ्खा)",
      importer: "आयातकर्ता",
    },
    finalCta: {
      title: "सूचीबद्ध गर्न तयार — वा किन्न तयार?",
      description:
        "छ देशमा हिमाली कमोडिटीहरूको व्यापार गर्ने प्रमाणित किसानहरू, सहकारीहरू, र आयातकर्ताहरूसँग जोडिनुहोस्।",
      ctaPrimary: "तपाईंको फसल सूचीबद्ध गर्नुहोस्",
      ctaSecondary: "आजका लटहरू हेर्नुहोस्",
    },
    footer: {
      tagline: "दक्षिण एसिया र खाडीका लागि सीमा-पार कृषि कमोडिटी एक्सचेन्ज।",
      platformTitle: "प्लेटफर्म",
      platform: {
        marketplace: "बजार",
        how: "यो कसरी काम गर्छ",
        features: "विशेषताहरू",
        register: "खाता सिर्जना गर्नुहोस्",
      },
      companyTitle: "कम्पनी",
      company: {
        about: "हाम्रो बारेमा",
        fees: "शुल्क",
        security: "सुरक्षा",
        careers: "करियर",
      },
      supportTitle: "सहयोग",
      support: {
        whatsapp: "व्हाट्सएप",
        email: "इमेल",
        phonePrimary: "+91 91268 40029",
        phoneSecondary: "+91 89189 35236",
        contact: "सम्पर्क",
      },
      legalTitle: "कानूनी",
      legal: {
        terms: "सेवा सर्तहरू",
        privacy: "गोपनीयता नीति",
        compliance: "अनुपालन",
      },
      address: "सिक्किम, भारतमा मुख्यालय। दक्षिण एसिया र खाडीको सेवा।",
      entity: "कृषिब्रिज एग्रीफिन टेक्नोलोजिज प्राइभेट लिमिटेड",
      copyright: "सर्वाधिकार सुरक्षित।",
    },
  },

  ar: {
    nav: {
      commodities: "السلع",
      howItWorks: "كيف يعمل",
      whyUs: "لماذا كريشيبريدج",
      countries: "الدول",
    },
    hero: {
      badge: "جنوب آسيا ← الخليج · بورصة مباشرة",
      title1: "سلع الهيمالايا موثقة.",
      titleHighlight1: "تجارة مرمّزة.",
      titleHighlight2: "ست دول.",
      description:
        "تربط كريشيبريدج المزارعين المعتمدين والتعاونيات الجبلية بالمستوردين في الهند ونيبال وبوتان والخليج. زايد مباشرة، وادفع بعملتك الخاصة، واستلم من المستودع برمز QR موقّع.",
      ctaPrimary: "أدرج محصولك",
      ctaSecondary: "تصفح صفقات اليوم",
      livePreview: "السوق المباشر",
      updatedNow: "محدَّث للتو",
      openMarketplace: "افتح السوق",
      settledToday: "تمت تسويته اليوم",
    },
    commodities: {
      blackCardamom: { name: "الهيل الأسود", origin: "سيكيم · شرق نيبال" },
      orthodoxTea: { name: "الشاي التقليدي", origin: "دارجيلنغ · إيلام · دانكوتا" },
      blackTea: { name: "الشاي الأسود", origin: "آسام · تيراي" },
      activeLots: "{count} صفقات نشطة",
      liveTag: "{count} مباشر",
      indicativeBand: "النطاق السعري الإرشادي",
    },
    trust: {
      kyc: "حسابات موثّقة بالكامل عبر KYC",
      alwaysOn: "نافذة تداول مباشرة ٢٤/٧",
      escrow: "تسوية محمية بالضمان",
      transparent: "رسوم شفافة، بدون فوارق خفية",
    },
    metrics: {
      countries: "الدول المتصلة",
      commodities: "السلع المدرجة",
      languages: "اللغات المدعومة",
      currencies: "العملات المسوّاة",
    },
    sectionCommodities: {
      eyebrow: "ما نتداوله",
      title: "منشأ معتمد، تسعير إرشادي، مخزون مباشر.",
      description: "كل قائمة تُختبر مخبريًا ويتم التحقق من امتثالها قبل النشر.",
    },
    personas: {
      eyebrow: "لكلا طرفي التجارة",
      title: "بورصة واحدة، سير عملين.",
      farmer: {
        title: "المزارعون والمجمّعون",
        subtitle: "وصول عالمي للمشترين دون وسيط.",
        b1: "أدرج محصولك في دقائق",
        b2: "اقبل عروضًا بالـ INR أو NPR أو BTN أو USD",
        b3: "تُصرف المدفوعات فور تأكيد المشتري للاستلام",
        cta: "أدرج محصولك",
      },
      buyer: {
        title: "المستوردون والتجار",
        subtitle: "مصدر موثوق لسلع الهيمالايا بثقة تامة.",
        b1: "تصفّح الصفقات المباشرة بدرجات معتمدة مخبريًا",
        b2: "زايد أو أرسل RFQ لأحجام مخصصة",
        b3: "استلم من المستودع برمز QR موقّع",
        cta: "تصفح صفقات اليوم",
      },
    },
    how: {
      eyebrow: "كيف يعمل",
      title: "أربع خطوات من الحصاد إلى تسليم المستودع.",
      s1: {
        title: "التسجيل والتحقق",
        desc: "أكمل KYC في دقائق. يؤكد المزارعون الهوية والتفاصيل المصرفية؛ ويؤكد المشترون الشركة والرخصة التجارية.",
      },
      s2: {
        title: "أدرج أو اكتشف",
        desc: "يرفع البائعون صفقات بمنشأ ودرجة وتقارير مخبرية وصور. ويتصفح المشترون الصفقات المباشرة أو ينشرون RFQ.",
      },
      s3: {
        title: "زايد أو فاوض",
        desc: "مزاد إنجليزي مفتوح مع حماية ضد القنص، أو تفاوض RFQ مباشر للطلبات الكبيرة. يحفظ الضمان الأموال.",
      },
      s4: {
        title: "ادفع واستلم من المستودع",
        desc: "سوّ بعملتك الخاصة. استلم رمز QR موقّعًا. امسحه في المستودع لاستلام البضاعة.",
      },
    },
    features: {
      eyebrow: "لماذا كريشيبريدج",
      title: "ما يميّز هذه البورصة.",
      f1: {
        title: "استرداد QR مرمّز",
        desc: "كل صفقة مسوّاة تتحول إلى رمز رقمي موقّع. قدّم الـ QR في المستودع للاستلام — آمن، قابل للتحويل والتدقيق.",
      },
      f2: {
        title: "جونغخا وهندي ونيبالي وعربي وإنجليزي",
        desc: "البورصة السلعية الوحيدة بدعم جونغخا من الدرجة الأولى — مع دعم عربي RTL لمستوردي الخليج.",
      },
      f3: {
        title: "سوّ بعملتك الخاصة",
        desc: "INR وNPR وBTN وAED وSAR وOMR وUSD. صرف شفاف بلا فوارق خفية. تصل المدفوعات للمزارعين عبر قناتهم المحلية.",
      },
      f4: {
        title: "أمان بمستوى المصارف",
        desc: "كل حساب موثّق عبر KYC. كل معاملة مشفّرة طرفًا إلى طرف. كل رمز آمن وقابل للتحقق دون اتصال.",
      },
      f5: {
        title: "منشأ وجودة موثّقان",
        desc: "درجات مخبرية، مستندات صحة نباتية، وشهادات منشأ لكل صفقة — مراجعة قبل النشر.",
      },
      f6: {
        title: "مزادات مباشرة + RFQ",
        desc: "اكتشاف السعر عبر مزادات إنجليزية مفتوحة مع حماية ضد القنص، أو طلبات عروض مباشرة للأوامر المخصصة الكبيرة.",
      },
      distinctive: "مميّز",
      securityNote: "المواصفات الفنية للتشفير وتوقيع الرموز وسجلات التدقيق متوفرة على /security.",
    },
    heritage: {
      eyebrow: "إرثنا في التكنولوجيا الزراعية",
      title: "مبني على عقد من تقنية تضع المزارع أولًا.",
      description:
        "بدأت كريشيبريدج كمهمة تكنولوجيا زراعية لجعل الزراعة الدقيقة في متناول كل مزارع صغير — ذكاء الطقس، الري الذكي، وحماية الأراضي. البورصة السلعية هي الفصل التالي: تحويل تلك الحقيقة الميدانية إلى وصول سوقي عالمي.",
      weather: {
        title: "مراقبة الطقس",
        desc: "بيانات مناخية شديدة الدقة تساعد المزارعين على تخطيط البذر والحصاد والتخزين بثقة.",
      },
      irrigation: {
        title: "الري الذكي",
        desc: "جداول ري مدركة لرطوبة التربة تقلل هدر المياه وترفع الإنتاج لكل فدان.",
      },
      land: {
        title: "حماية الأراضي",
        desc: "صحة التربة وحدود الأرض والامتثال — مراقبة لإبقاء المزارع منتجة سنة بعد سنة.",
      },
    },
    countriesSection: {
      eyebrow: "أين نعمل",
      title: "ست دول. خمس لغات. سبع عملات.",
      description:
        "مُترجمة لكل سوق نخدمه — بما فيها جونغخا من الدرجة الأولى لبوتان وعربي RTL للخليج.",
      in: "الهند",
      np: "نيبال",
      bt: "بوتان",
      ae: "الإمارات",
      sa: "السعودية",
      om: "عمان",
      originBuyer: "منشأ · مشترٍ",
      origin: "منشأ (جونغخا)",
      importer: "مستورد",
    },
    finalCta: {
      title: "جاهز للإدراج — أم للشراء؟",
      description:
        "انضم إلى مزارعين وتعاونيات ومستوردين معتمدين يتبادلون سلع الهيمالايا عبر ست دول.",
      ctaPrimary: "أدرج محصولك",
      ctaSecondary: "تصفح صفقات اليوم",
    },
    footer: {
      tagline: "بورصة سلع زراعية عابرة للحدود لجنوب آسيا والخليج.",
      platformTitle: "المنصّة",
      platform: {
        marketplace: "السوق",
        how: "كيف يعمل",
        features: "المزايا",
        register: "إنشاء حساب",
      },
      companyTitle: "الشركة",
      company: {
        about: "من نحن",
        fees: "الرسوم",
        security: "الأمان",
        careers: "الوظائف",
      },
      supportTitle: "الدعم",
      support: {
        whatsapp: "واتساب",
        email: "البريد",
        phonePrimary: "+91 91268 40029",
        phoneSecondary: "+91 89189 35236",
        contact: "تواصل",
      },
      legalTitle: "قانوني",
      legal: {
        terms: "شروط الخدمة",
        privacy: "سياسة الخصوصية",
        compliance: "الامتثال",
      },
      address: "المقر في سيكيم، الهند. نخدم جنوب آسيا والخليج.",
      entity: "كريشيبريدج أغريفين تكنولوجيز برايفت ليمتد",
      copyright: "جميع الحقوق محفوظة.",
    },
  },

  dz: {
    nav: {
      commodities: "རྒྱུ་ཆ་ཚོང་རྫས།",
      howItWorks: "ག་དེ་ལཱ་འབད་མི།",
      whyUs: "ག་ཅི་འབད་ Krishibridge",
      countries: "རྒྱལ་ཁབ་ཚུ།",
    },
    hero: {
      badge: "ལྷོ་ཤར་ཨེ་ཤི་ཡ་ → གཱལཕ · ཐད་ཀར་ཚོང་འབྲེལ།",
      title1: "ངོས་འཛིན་གནང་ཡོད་པའི་ཧི་མ་ལ་ཡའི་ཚོང་རྫས།",
      titleHighlight1: "ཊོ་ཀན་བཟོས་པའི་ཚོང་འབྲེལ།",
      titleHighlight2: "རྒྱལ་ཁབ་དྲུག",
      description:
        "Krishibridge གིས་རྒྱ་གར་དང་བལ་ཡུལ་འབྲུག་དང་གཱལཕ་གི་ཚོང་མི་ཚུ་དང་ ངོས་འཛིན་འབད་དེ་ཡོད་པའི་ས་མཐོ་སའི་སོ་ནམ་པ་དང་སྤྱི་ཚོགས་ཚུ་མཐུན་འབྲེལ་བཟོ་ཨིན། ཐད་ཀར་མཆོད་རྟེན་ཐེངས་མཛད། རང་གི་དངུལ་ཐོག་བཏུབ་སྟེ། ཞུ་ཡིག་བཀོད་པའི་ QR ཊོ་ཀན་ཐོག་ལས་ཅ་ལག་ལེན།",
      ctaPrimary: "ཁྱོད་ཀྱི་འབྲུ་ཐོག་ཐོ་འགོད།",
      ctaSecondary: "དེ་རིང་གི་ལོ་ཊི་ཚུ་ལྟ།",
      livePreview: "ཐད་ཀར་ཚོང་ཁང།",
      updatedNow: "ད་གི་དུས་མཐུན་བཟོས།",
      openMarketplace: "ཚོང་ཁང་ཕྱེ།",
      settledToday: "དེ་རིང་ཚུད་སྒྲིག་བྱས།",
    },
    commodities: {
      blackCardamom: { name: "ཨིལ་ལ་ཅི་ནག་པོ།", origin: "སིཀིམ · བལ་ཡུལ་ཤར་ཕྱོགས།" },
      orthodoxTea: { name: "ཨོར་ཐོ་ཌོཀ་ས་ཇ།", origin: "དར་ཇི་ལིང · ཨི་ལམ · དྷན་ཀུ་ཊ།" },
      blackTea: { name: "ཇ་ནག་པོ།", origin: "ཨསམ · ཏེ་རའི།" },
      activeLots: "ལོ་ཊི་ {count} ཤུགས་ལྡན།",
      liveTag: "{count} ཐད་ཀར།",
      indicativeBand: "མཚོན་བྱེད་ཀྱི་རིན་ཚད།",
    },
    trust: {
      kyc: "KYC ངོས་འཛིན་ཡོད་པའི་རྩིས་ཁྲ་བརྒྱ་ཆ་བརྒྱ།",
      alwaysOn: "དུས་ཡུན་ ༢༤/༧ ཐད་ཀར་ཚོང་འབྲེལ།",
      escrow: "ཨེསཀ་རོས་ཉེན་སྲུང་ཚུད་སྒྲིག",
      transparent: "གསལ་བའི་གླ་ཆ། ལྐོག་གཡོས་མེད།",
    },
    metrics: {
      countries: "མཐུན་འབྲེལ་རྒྱལ་ཁབ།",
      commodities: "ཐོ་བཀོད་རྒྱུ་ཆ།",
      languages: "རྒྱབ་སྐྱོར་སྐད་ཡིག",
      currencies: "ཚུད་སྒྲིག་དངུལ།",
    },
    sectionCommodities: {
      eyebrow: "ང་བཅས་ཀྱི་ཚོང་རྫས།",
      title: "ངོས་འཛིན་འབྱུང་ཁུངས། མཚོན་བྱེད་རིན། ཐད་ཀར་མཛོད།",
      description: "ཐོ་བཀོད་རེ་རེ་ལྟར་གློག་ཀློག་ཁང་ལས་དང་ཚུལ་མཐུན་བརྟག་དཔྱད་འབད་ཡོད།",
    },
    personas: {
      eyebrow: "ཚོང་འབྲེལ་གྱི་ཕྱོགས་གཉིས་ཀྱི་དོན།",
      title: "ཚོང་རྩིས་ཁང་གཅིག། ལས་རིམ་གཉིས།",
      farmer: {
        title: "སོ་ནམ་པ་དང་སྒྲིག་འཛིན་པ།",
        subtitle: "བར་མི་མེད་པར་འཛམ་གླིང་གི་ཉོ་མི་དང་མཐུན་འབྲེལ།",
        b1: "དུས་ཚོད་འགའ་ནང་ཁྱོད་ཀྱི་འབྲུ་ཐོག་ཐོ་འགོད།",
        b2: "INR, NPR, BTN ཡང་ན་ USD ནང་མཆོད་རྟེན་ལེན།",
        b3: "ཉོ་མི་གིས་ངོས་ལེན་བྱས་མ་ཐག་སྤྲོད་ལེན།",
        cta: "ཁྱོད་ཀྱི་འབྲུ་ཐོག་ཐོ་འགོད།",
      },
      buyer: {
        title: "ནང་འདྲེན་པ་དང་ཚོང་པ།",
        subtitle: "བློ་གཏད་ཀྱིས་ངོས་འཛིན་ཡོད་པའི་ཧི་མ་ལ་ཡའི་ཚོང་རྫས་འཚོལ།",
        b1: "ཞིབ་དཔྱད་ངོས་འཛིན་ཡོད་པའི་ཐད་ཀར་ལོ་ཊི་ལྟ།",
        b2: "མཆོད་རྟེན་བཏོན་ཡང་ན་ RFQ ཞུ་ཡིག་གཏོང་།",
        b3: "ཞུ་ཡིག་བཀོད་པའི་ QR ཊོ་ཀན་ཐོག་ལས་ཅ་ལག་ལེན།",
        cta: "དེ་རིང་གི་ལོ་ཊི་ཚུ་ལྟ།",
      },
    },
    how: {
      eyebrow: "ག་དེ་ལཱ་འབད་མི།",
      title: "འབྲུ་ཐོག་ལས་མཛོད་ཁང་སྤྲོད་ལེན་ཚུན་གྱི་རིམ་པ་བཞི།",
      s1: {
        title: "ཐོ་འགོད་དང་ངོས་འཛིན།",
        desc: "དུས་ཚོད་འགའ་ནང་ KYC འཐུས་པ། སོ་ནམ་པ་གིས་ངོ་བོ་དང་དངུལ་ཁང་ངོས་འཛིན། ཉོ་མི་གིས་ཀུམ་པ་ནི་དང་ཚོང་ལག་ཁྱེར་ངོས་འཛིན།",
      },
      s2: {
        title: "ཐོ་འགོད་ཡང་ན་འཚོལ་ཞིབ།",
        desc: "ཚོང་མི་གིས་འབྱུང་ཁུངས། རིམ་པ། གློག་ཀློག་སྙན་ཞུ་དང་པར་རིས་ཚུ་དང་བཅས་ལོ་ཊི་འཇུག་ཞིང་། ཉོ་མི་གིས་ཐད་ཀར་ལོ་ཊི་ལྟ་ཡང་ན་ RFQ ཡིག་ཆ་འཇུག།",
      },
      s3: {
        title: "མཆོད་རྟེན་ཡང་ན་སྐད་ཆ་འགྱུར་བ།",
        desc: "སྣ་སྣིབ་ཀྱི་སྲུང་སྐྱོབ་དང་བཅས་པའི་ཕྱིར་བཤད་དབྱིན་ཇིའི་མཆོད་རྟེན། ཡང་ན་བཀའ་ཡིག་ཆེན་པོའི་དོན་ལུ་ཐད་ཀར་ RFQ སྐད་ཆ། ཨེསཀ་རོས་ཀྱིས་དངུལ་འཆང་།",
      },
      s4: {
        title: "དངུལ་སྤྲོད་དང་མཛོད་ཁང་ནས་ལེན།",
        desc: "རང་གི་དངུལ་ཐོག་ཚུད་སྒྲིག། ཞུ་ཡིག་བཀོད་པའི་ QR ཊོ་ཀན་ལེན། ཅ་ལག་ལེན་ནིའི་དོན་ལུ་མཛོད་ཁང་ནང་སྐན་འབད།",
      },
    },
    features: {
      eyebrow: "ག་ཅི་འབད་ Krishibridge",
      title: "ཚོང་རྩིས་ཁང་འདི་ག་དེ་སྦེ་ཁྱད་པར་ཡོད་མི།",
      f1: {
        title: "ཊོ་ཀན་བཟོས་པའི་ QR ལེན་ལུགས།",
        desc: "ཚུད་སྒྲིག་བྱས་པའི་ལོ་ཊི་རེ་རེ་ལྟར་ཞུ་ཡིག་བཀོད་པའི་ཌི་ཇི་ཊལ་ཊོ་ཀན་ཨིན། ཅ་ལག་ལེན་ནིའི་དོན་ལུ་མཛོད་ཁང་ནང་ QR བཏོན།",
      },
      f2: {
        title: "རྫོང་ཁ། ཧིན་དི། བལ་ཡུལ། ཨ་རབ། ཨིང་ལིཤ།",
        desc: "རྫོང་ཁའི་མཐུན་འགྱུར་རིམ་དང་པོ་ཅན་གྱི་ཚོང་རྫས་ཚོང་རྩིས་ཁང་གཅིག་པོ། གཱལཕ་གི་ནང་འདྲེན་པའི་དོན་ལུ་ RTL ཨ་རབ་ཀྱང་།",
      },
      f3: {
        title: "རང་གི་དངུལ་ཐོག་ཚུད་སྒྲིག",
        desc: "INR, NPR, BTN, AED, SAR, OMR, USD། གསལ་བའི་ FX། ལྐོག་གཡོས་མེད། སོ་ནམ་པ་ཚུ་གི་ས་གནས་རྒྱུན་ལས་ཀྱི་ཐོག་ལུ་དངུལ་སྤྲོད།",
      },
      f4: {
        title: "དངུལ་ཁང་སྟངས་ཀྱི་ཉེན་སྲུང་།",
        desc: "རྩིས་ཁྲ་རེ་རེ་ KYC ངོས་འཛིན། བྱེད་ལས་རེ་རེ་མཐའ་ནས་མཐའ་བར་གསང་བ་བཟོས། ཊོ་ཀན་རེ་རེ་གསང་སྲུང་ཡོད་ཅིང་རྒྱུད་ཁུངས་མེད་པར་ངོས་འཛིན་ཐུབ།",
      },
      f5: {
        title: "ངོས་འཛིན་འབྱུང་ཁུངས་དང་སྤུས་ཚད།",
        desc: "གློག་ཀློག་བརྟག་དཔྱད་རིམ་པ། ཕའི་ཊོ་སེ་ནི་ཊ་རི་ཡིག་ཆ། དང་འབྱུང་ཁུངས་ལག་ཁྱེར། ལོ་ཊི་རེ་རེ་ལུ་མཉམ་སྦྲགས།",
      },
      f6: {
        title: "ཐད་ཀར་མཆོད་རྟེན་ + RFQ",
        desc: "སྣ་སྣིབ་ཀྱི་སྲུང་སྐྱོབ་དང་བཅས་པའི་ཕྱིར་བཤད་དབྱིན་ཇིའི་མཆོད་རྟེན་ཐོག་ལས་རིན་གྱི་འཚོལ་ཞིབ། ཡང་ན་བཀའ་ཡིག་ཆེན་པོའི་དོན་ལུ་ཐད་ཀར་ཞུ་ཡིག",
      },
      distinctive: "ཁྱད་ཆོས།",
      securityNote: "གསང་བའི་བཟོ་སྐྲུན། ཊོ་ཀན་ཞུ་ཡིག་དང་ཞིབ་དཔྱད་ཤུལ་གྱི་ལག་ལེན་ཡིག་ཆ་ /security ལུ་ཡོད།",
    },
    heritage: {
      eyebrow: "ང་བཅས་ཀྱི་ AgriTech ཤུལ་བཞག",
      title: "སོ་ནམ་པ་སྔོན་ལ་བཞག་པའི་ཡུལ་སྲོལ་ལོ་ངོ་བཅུ་གི་ཐོག་ལུ་བཟོས།",
      description:
        "Krishibridge ནི་སོ་ནམ་པ་ཆུང་བ་རེ་རེ་གི་ལག་ཏུ་ཚད་ལྡན་ཞིང་ལས་འབྱོར་ཐུབ་ནིའི་དོན་ལུ་ AgriTech འབད་རྩོམ་བཏུབ་ཅིང་ འོད་ཀོས་ཤེས་རིག། ཆུ་བོ་བཏང་ཐངས་བློ་ལྡན། དང་ས་ཞིང་ཉེན་སྲུང་། ཚོང་རྒྱུ་ཚོང་རྩིས་ཁང་ནི་ལེའུ་གཞན་ཅིག་ཨིན།",
      weather: {
        title: "གནམ་གཤིས་ལྟ་རྟོག",
        desc: "ས་གནས་རྒྱ་ཆུང་གི་གནམ་གཤིས་གཞི་གྲངས་ཀྱིས་སོ་ནམ་པ་ཚུ་ལུ་རྨོ་བ། འབྲུ་བསྡུ་བ། དང་ཉར་ཚགས་ཀྱི་འཆར་གཞི་བློ་གཏད་ཀྱིས་བཟོ་ཐུབ།",
      },
      irrigation: {
        title: "ཆུ་བོ་བཏང་ཐངས་བློ་ལྡན།",
        desc: "ས་གཞི་བརླན་ཤེས་པའི་ཆུ་བོ་བཏང་ཐངས་འཆར་གཞི་གིས་ཆུ་མར་ཤོར་ཉུང་སུ་བཟོ་ཞིང་ ནས་ཡུན་རིང་གི་འབྱུང་ཁུངས་མཐོ།",
      },
      land: {
        title: "ས་ཞིང་ཉེན་སྲུང་།",
        desc: "ས་གཞིའི་འཕྲོད་བསྟེན། མཚམས་རྒྱུན། དང་ཚུལ་མཐུན། སོ་ནམ་ཞིང་ལས་ལོ་ནས་ལོ་བར་འབྱུང་ཁུངས་ཅན་དུ་གནས་པའི་ལྟ་རྟོག",
      },
    },
    countriesSection: {
      eyebrow: "ང་བཅས་ག་སར་ལཱ་འབད།",
      title: "རྒྱལ་ཁབ་དྲུག། སྐད་ལྔ། དངུལ་རིགས་བདུན།",
      description: "ང་བཅས་ཞབས་ཏོག་སྤྲོད་མི་ཚོང་ཁང་རེ་རེ་གི་དོན་ལུ་ས་གནས་སྐད་ཡིག་ནང་།",
      in: "རྒྱ་གར།",
      np: "བལ་ཡུལ།",
      bt: "འབྲུག།",
      ae: "UAE",
      sa: "སུ་ཨུ་དི་ཨ་རབ།",
      om: "ཨོ་མན།",
      originBuyer: "འབྱུང་ཁུངས་ · ཉོ་མི།",
      origin: "འབྱུང་ཁུངས་ (རྫོང་ཁ)",
      importer: "ནང་འདྲེན་པ།",
    },
    finalCta: {
      title: "ཐོ་འགོད་འབད་ནི་སྒྲིག་གྲ་དང་ -- ཡང་ན་ཉོ་ནི་སྒྲིག་གྲ་ཡོད?",
      description:
        "རྒྱལ་ཁབ་དྲུག་ནང་ཧི་མ་ལ་ཡའི་ཚོང་རྫས་ཚོང་འབྲེལ་འབད་མི་ངོས་འཛིན་སོ་ནམ་པ། སྤྱི་ཚོགས། དང་ནང་འདྲེན་པ་ཚུ་དང་མཉམ་དུ་གནས།",
      ctaPrimary: "ཁྱོད་ཀྱི་འབྲུ་ཐོག་ཐོ་འགོད།",
      ctaSecondary: "དེ་རིང་གི་ལོ་ཊི་ཚུ་ལྟ།",
    },
    footer: {
      tagline: "ལྷོ་ཤར་ཨེ་ཤི་ཡ་དང་གཱལཕ་གི་དོན་ལུ་ས་མཚམས་བརྒལ་གྱི་སོ་ནམ་ཚོང་རྫས་ཚོང་རྩིས་ཁང་།",
      platformTitle: "འཛིན་སྐྱོང་ལྟེ་བ།",
      platform: {
        marketplace: "ཚོང་ཁང།",
        how: "ག་དེ་ལཱ་འབད་མི།",
        features: "ཁྱད་ཆོས་ཚུ།",
        register: "རྩིས་ཁྲ་བཟོ།",
      },
      companyTitle: "ཀུམ་པ་ནི།",
      company: {
        about: "ང་བཅས་ཀྱི་སྐོར།",
        fees: "གླ་ཆ།",
        security: "ཉེན་སྲུང་།",
        careers: "ལས་ཀ",
      },
      supportTitle: "རྒྱབ་སྐྱོར།",
      support: {
        whatsapp: "WhatsApp",
        email: "གློག་འཕྲིན།",
        phonePrimary: "+91 91268 40029",
        phoneSecondary: "+91 89189 35236",
        contact: "འབྲེལ་བ།",
      },
      legalTitle: "ཁྲིམས་ཀྱི།",
      legal: {
        terms: "ཞབས་ཏོག་གི་ཆ་རྐྱེན།",
        privacy: "སྒེར་ཡིག་སྲོལ།",
        compliance: "ཚུལ་མཐུན།",
      },
      address: "སིཀིམ་རྒྱ་གར་ནང་རྩ་བའི་ཡིག་ཚང་། ལྷོ་ཤར་ཨེ་ཤི་ཡ་དང་གཱལཕ་ལུ་ཞབས་ཏོག",
      entity: "KrishiBridge Agrifin Technologies Private Limited",
      copyright: "ཐོབ་དབང་ཚུ་ཉེན་སྲུང་།",
    },
  },
};

for (const locale of Object.keys(landing)) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  json.landing = landing[locale];
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`[landing] injected into ${locale}.json`);
}
console.log("Done.");
