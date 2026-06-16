import { normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";

export type TeamMemberId =
  | "ceo-shyam-soni"
  | "cfo-amit-agarwal"
  | "cfo-pranish-shrestha"
  | "director-nasreen-rahman"
  | "mentor-gopal-upadhyay";

export type TeamMember = {
  id: TeamMemberId;
  name: string;
  designation: string;
  imageFile: string;
  bio: string;
  expertise: string[];
  featured?: boolean;
  group: "leadership" | "advisory";
};

type TeamMemberContent = {
  designation: string;
  bio: string;
  expertise: string[];
};

const TEAM_BASE: Record<
  TeamMemberId,
  { name: string; imageFile: string; featured?: boolean; group: "leadership" | "advisory" }
> = {
  "ceo-shyam-soni": {
    name: "Shyam Soni",
    imageFile: "CEO- Shyam Soni.jpeg",
    featured: true,
    group: "leadership",
  },
  "cfo-amit-agarwal": {
    name: "Amit Agarwal",
    imageFile: "CFO- Amit Agarwal.jpeg",
    group: "leadership",
  },
  "cfo-pranish-shrestha": {
    name: "Pranish Shrestha",
    imageFile: "CFO- Pranish Shrestha.jpeg",
    group: "leadership",
  },
  "director-nasreen-rahman": {
    name: "Nasreen Rahman",
    imageFile: "Director Nasreen Rahman.jpg",
    group: "leadership",
  },
  "mentor-gopal-upadhyay": {
    name: "Gopal Upadhyay",
    imageFile: "Mentor- Gopal Upadhyay.jpg",
    group: "advisory",
  },
};

export const TEAM_DISPLAY_ORDER: TeamMemberId[] = [
  "ceo-shyam-soni",
  "cfo-amit-agarwal",
  "cfo-pranish-shrestha",
  "director-nasreen-rahman",
  "mentor-gopal-upadhyay",
];

const TEAM_CONTENT: Record<LocaleCode, Record<TeamMemberId, TeamMemberContent>> = {
  en: {
    "ceo-shyam-soni": {
      designation: "Chief Executive Officer",
      bio: "Leads Krishibridge's vision to build transparent digital infrastructure for Himalayan agricultural trade — connecting verified growers, warehouses, and global buyers on one trusted platform.",
      expertise: ["Digital trade", "Platform strategy", "Himalayan markets"],
    },
    "cfo-amit-agarwal": {
      designation: "Chief Financial Officer",
      bio: "Oversees financial strategy, compliance, and sustainable growth — ensuring Krishibridge remains trusted by farmers, aggregators, and institutional buyers across every transaction.",
      expertise: ["Financial strategy", "Compliance", "Institutional trust"],
    },
    "cfo-pranish-shrestha": {
      designation: "Chief Financial Officer",
      bio: "Strengthens financial operations across Nepal and the broader Himalayan corridor, with deep expertise in cross-border commodity finance and regional settlement workflows.",
      expertise: ["Cross-border finance", "Nepal operations", "Settlement"],
    },
    "director-nasreen-rahman": {
      designation: "Director",
      bio: "Brings strategic direction and governance expertise, shaping how Krishibridge scales responsibly across South Asia and into international buyer markets.",
      expertise: ["Governance", "South Asia strategy", "Buyer markets"],
    },
    "mentor-gopal-upadhyay": {
      designation: "Mentor",
      bio: "Provides seasoned guidance on commodity markets, quality standards, and building long-term trust between producers and buyers in origin-sensitive supply chains.",
      expertise: ["Commodity markets", "Quality standards", "Producer trust"],
    },
  },
  hi: {
    "ceo-shyam-soni": {
      designation: "मुख्य कार्यकारी अधिकारी",
      bio: "हिमालयी कृषि व्यापार के लिए पारदर्शी डिजिटल अवसंरचना बनाने की Krishibridge की दृष्टि का नेतृत्व करते हैं — सत्यापित किसानों, गोदामों और वैश्विक खरीदारों को एक विश्वसनीय प्लेटफ़ॉर्म से जोड़ना।",
      expertise: ["डिजिटल व्यापार", "प्लेटफ़ॉर्म रणनीति", "हिमालयी बाज़ार"],
    },
    "cfo-amit-agarwal": {
      designation: "मुख्य वित्तीय अधिकारी",
      bio: "वित्तीय रणनीति, अनुपालन और स्थायी विकास की देखरेख करते हैं — यह सुनिश्चित करते हुए कि Krishibridge किसानों, एग्रीगेटरों और संस्थागत खरीदारों का भरोसा बनाए रखे।",
      expertise: ["वित्तीय रणनीति", "अनुपालन", "संस्थागत विश्वास"],
    },
    "cfo-pranish-shrestha": {
      designation: "मुख्य वित्तीय अधिकारी",
      bio: "नेपाल और व्यापक हिमालयी कॉरिडोर में वित्तीय संचालन को मजबूत करते हैं, सीमा पार कमोडिटी वित्त और क्षेत्रीय सेटलमेंट में गहरी विशेषज्ञता के साथ।",
      expertise: ["सीमा पार वित्त", "नेपाल संचालन", "सेटलमेंट"],
    },
    "director-nasreen-rahman": {
      designation: "निदेशक",
      bio: "रणनीतिक दिशा और शासन विशेषज्ञता लाती हैं, जिससे Krishibridge दक्षिण एशिया और अंतर्राष्ट्रीय खरीदार बाज़ारों में जिम्मेदारी से विस्तार कर सके।",
      expertise: ["शासन", "दक्षिण एशिया रणनीति", "खरीदार बाज़ार"],
    },
    "mentor-gopal-upadhyay": {
      designation: "सलाहकार",
      bio: "कमोडिटी बाज़ारों, गुणवत्ता मानकों और उत्पादकों व खरीदारों के बीच दीर्घकालिक विश्वास बनाने पर अनुभवी मार्गदर्शन प्रदान करते हैं।",
      expertise: ["कमोडिटी बाज़ार", "गुणवत्ता मानक", "उत्पादक विश्वास"],
    },
  },
  ne: {
    "ceo-shyam-soni": {
      designation: "प्रमुख कार्यकारी अधिकृत",
      bio: "हिमालयी कृषि व्यापारका लागि पारदर्शी डिजिटल पूर्वाधार निर्माण गर्ने Krishibridge को दृष्टिको नेतृत्व गर्छन् — प्रमाणित किसान, गोदाम र विश्वव्यापी खरिदकर्तालाई एउटै भरपर्दो प्लेटफर्ममा जोड्दै।",
      expertise: ["डिजिटल व्यापार", "प्लेटफर्म रणनीति", "हिमालयी बजार"],
    },
    "cfo-amit-agarwal": {
      designation: "प्रमुख वित्तीय अधिकृत",
      bio: "वित्तीय रणनीति, अनुपालन र दिगो विकासको निरीक्षण गर्छन् — Krishibridge ले किसान, एग्रीगेटर र संस्थागत खरिदकर्ताको भरोसा कायम राखोस् भन्ने सुनिश्चित गर्दै।",
      expertise: ["वित्तीय रणनीति", "अनुपालन", "संस्थागत भरोसा"],
    },
    "cfo-pranish-shrestha": {
      designation: "प्रमुख वित्तीय अधिकृत",
      bio: "नेपाल र व्यापक हिमालयी क्षेत्रमा वित्तीय सञ्चालनलाई सुदृढ बनाउँछन्, सीमा पार कमोडिटी वित्त र क्षेत्रीय सेटलमेन्टमा गहन विशेषज्ञतासहित।",
      expertise: ["सीमा पार वित्त", "नेपाल सञ्चालन", "सेटलमेन्ट"],
    },
    "director-nasreen-rahman": {
      designation: "निर्देशक",
      bio: "रणनीतिक दिशा र शासन विशेषज्ञता ल्याउँछिन्, जसले Krishibridge लाई दक्षिण एशिया र अन्तर्राष्ट्रीय खरिदकर्ता बजारमा जिम्मेवारीपूर्वक विस्तार गर्न मद्दत गर्छ।",
      expertise: ["शासन", "दक्षिण एशिया रणनीति", "खरिदकर्ता बजार"],
    },
    "mentor-gopal-upadhyay": {
      designation: "सल्लाहकार",
      bio: "कमोडिटी बजार, गुणस्तर मापदण्ड र उत्पादक तथा खरिदकर्ताबीच दीर्घकालीन भरोसा निर्माणमा अनुभवी मार्गदर्शन प्रदान गर्छन्।",
      expertise: ["कमोडिटी बजार", "गुणस्तर मापदण्ड", "उत्पादक भरोसा"],
    },
  },
  dz: {
    "ceo-shyam-soni": {
      designation: "གཙོ་བོའི་ལས་འཛིན་དཔྱད་ཡོན་པ",
      bio: "ཧི་མ་ལ་ཡའི་སོ་ནམ་ཚོང་འབྲེལ་ལུ་གསལ་ཏོག་ཏོའི་ཌི་ཇི་ཊཱལ་གཞི་རྩ་གཏོང་ནིའི Krishibridge གི་ལྟ་སྟངས་ལས་འཛིན་འབདཝ་ཨིན། ཞིང་པ་དང་མཛོད་ཁང་ ཉོ་མི་ཚུ་ཡིད་ཆེས་ཅན་གྱི་པད་སྟེགས་ཐོག་མཐུདཔ་ཨིན།",
      expertise: ["ཌི་ཇི་ཊཱལ་ཚོང་འབྲེལ", "པད་སྟེགས་ཐབས་ལམ", "ཧི་མ་ལ་ཡའི་ཁྲོམ"],
    },
    "cfo-amit-agarwal": {
      designation: "གཙོ་བོའི་དངུལ་རྩིས་དཔྱད་ཡོན་པ",
      bio: "དངུལ་རྩིས་ཐབས་ལམ་ ཁྲིམས་མཐུན་ དང་རྒྱུན་མཐུད་འཕེལ་རྒྱས་ལུ་ལས་འཛིན་འབདཝ་ཨིན། ཞིང་པ་ བསྡུ་སྒྲིག་པ་ དང་ལས་ཁུངས་ཉོ་མི་ཚུའི་ཡིད་ཆེས་སྲུང་སྐྱོང་འབདཝ་ཨིན།",
      expertise: ["དངུལ་རྩིས་ཐབས་ལམ", "ཁྲིམས་མཐུན", "ལས་ཁུངས་ཡིད་ཆེས"],
    },
    "cfo-pranish-shrestha": {
      designation: "གཙོ་བོའི་དངུལ་རྩིས་དཔྱད་ཡོན་པ",
      bio: "Nepal དང་ཧི་མ་ལ་ཡའི་ལམ་བུ་ཁྲོད་དུ་དངུལ་རྩིས་ལས་སྦྱོར་སྟོབར་བསྐྱེད་འབདཝ་ཨིན། ས་མཚམས་བརྒལ་ཚོང་རྫས་དངུལ་རྩིས་ དང་ས་ཁོངས་དངུལ་སྤྲོད་ལས་རིམ་ལུ་ཤེས་རྒྱུད་ཆེན་པོ་ཡོད།",
      expertise: ["ས་མཚམས་བརྒལ་དངུལ་རྩིས", "Nepal་ལས་སྦྱོར", "དངུལ་སྤྲོད"],
    },
    "director-nasreen-rahman": {
      designation: "དཔྱད་ཡོན་པ",
      bio: "ཐབས་ལམ་གྱི་ཁ་ཕྱོགས་ དང་ཁྲིམས་ལུགས་ཀྱི་ཤེས་རྒྱུད་འདྲེན་འབདཝ་ཨིན། Krishibridge ལུ་ལྷོ་ཨེ་ཤི་ཡ་ དང་རྒྱལ་སྤྱིའི་ཉོ་མི་ཁྲོམ་ཚུ་ནང་འགྲོ་བཀོད་སྐྱོང་འབདཝ་ཨིན།",
      expertise: ["ཁྲིམས་ལུགས", "ལྷོ་ཨེ་ཤི་ཡ་ཐབས་ལམ", "ཉོ་མི་ཁྲོམ"],
    },
    "mentor-gopal-upadhyay": {
      designation: "ལམ་སྟོན་པ",
      bio: "ཚོང་རྫས་ཁྲོམ་ སྤུས་ཚད་ཀྱི་དཔྱད་གཞི་ དང་ཐོན་སྐྱེས་པ་དང་ཉོ་མི་བར་གྱི་ཡུན་རིང་ཡིད་ཆེས་གཏོང་ནི་ལུ་ལོ་རྒྱུས་ཅན་གྱི་ལམ་སྟོན་འབདཝ་ཨིན།",
      expertise: ["ཚོང་རྫས་ཁྲོམ", "སྤུས་ཚད་དཔྱད་གཞི", "ཐོན་སྐྱེས་ཡིད་ཆེས"],
    },
  },
  ar: {
    "ceo-shyam-soni": {
      designation: "الرئيس التنفيذي",
      bio: "يقود رؤية Krishibridge لبناء بنية رقمية شفافة للتجارة الزراعية في الهيمالايا — وربط المزارعين والمستودعات والمشترين العالميين الموثقين على منصة واحدة موثوقة.",
      expertise: ["التجارة الرقمية", "استراتيجية المنصة", "أسواق الهيمالايا"],
    },
    "cfo-amit-agarwal": {
      designation: "المدير المالي",
      bio: "يشرف على الاستراتيجية المالية والامتثال والنمو المستدام — لضمان بقاء Krishibridge موثوقة لدى المزارعين والمجمعين والمشترين المؤسسيين في كل معاملة.",
      expertise: ["الاستراتيجية المالية", "الامتثال", "ثقة المؤسسات"],
    },
    "cfo-pranish-shrestha": {
      designation: "المدير المالي",
      bio: "يعزز العمليات المالية في نيبال وعبر ممر الهيمالايا الأوسع، بخبرة عميقة في تمويل السلع عبر الحدود وسير تسويات إقليمية.",
      expertise: ["التمويل عبر الحدود", "عمليات نيبال", "التسوية"],
    },
    "director-nasreen-rahman": {
      designation: "مديرة",
      bio: "تقدم التوجيه الاستراتيجي وخبرة الحوكمة، وتشكل كيفية توسع Krishibridge بمسؤولية في جنوب آسيا وأسواق المشترين الدولية.",
      expertise: ["الحوكمة", "استراتيجية جنوب آسيا", "أسواق المشترين"],
    },
    "mentor-gopal-upadhyay": {
      designation: "مرشد",
      bio: "يقدم إرشادا متمرسا حول أسواق السلع ومعايير الجودة وبناء الثقة طويلة الأمد بين المنتجين والمشترين في سلاسل التوريد الحساسة للمنشأ.",
      expertise: ["أسواق السلع", "معايير الجودة", "ثقة المنتجين"],
    },
  },
};

export const TEAM_UI: Record<LocaleCode, { advisor: string; expertiseAreas: string }> = {
  en: { advisor: "Advisor", expertiseAreas: "Areas of focus" },
  hi: { advisor: "सलाहकार", expertiseAreas: "विशेषज्ञता के क्षेत्र" },
  ne: { advisor: "सल्लाहकार", expertiseAreas: "विशेषज्ञताका क्षेत्रहरू" },
  dz: { advisor: "ལམ་སྟོན་པ", expertiseAreas: "ཤེས་རྒྱུད་ཀྱི་ཁྱད་ཆོས" },
  ar: { advisor: "مرشد", expertiseAreas: "مجالات التركيز" },
};

export function getTeamMembers(locale: string): TeamMember[] {
  const localeCode = normalizeLocale(locale);
  const content = TEAM_CONTENT[localeCode];

  return TEAM_DISPLAY_ORDER.map((id) => ({
    id,
    name: TEAM_BASE[id].name,
    imageFile: TEAM_BASE[id].imageFile,
    featured: TEAM_BASE[id].featured,
    group: TEAM_BASE[id].group,
    designation: content[id].designation,
    bio: content[id].bio,
    expertise: content[id].expertise,
  }));
}

export function getTeamUiLabels(locale: string) {
  return TEAM_UI[normalizeLocale(locale)];
}

export function teamImageSrc(imageFile: string): string {
  return `/aboutus/${encodeURIComponent(imageFile)}`;
}

/** @deprecated Use getTeamMembers(locale) for localized content */
export const TEAM_MEMBERS = getTeamMembers("en");
