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
    group: "advisory",
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
    featured: true,
    group: "leadership",
  },
};

export const TEAM_DISPLAY_ORDER: TeamMemberId[] = [
  "mentor-gopal-upadhyay",
  "cfo-amit-agarwal",
  "cfo-pranish-shrestha",
  "director-nasreen-rahman",
  "ceo-shyam-soni",
];

const TEAM_CONTENT: Record<LocaleCode, Record<TeamMemberId, TeamMemberContent>> = {
  en: {
    "ceo-shyam-soni": {
      designation: "CEO",
      bio: "With over 15 years of experience in B2B beverage and commodity trade, Shyam Soni is the founder of Krishibridge. He is building transparent, tech-driven supply chains for high-value spices. His mission: fair pricing, empowered farmers, and seamless global access.",
      expertise: ["B2B trade", "Spices", "Global access"],
    },
    "cfo-amit-agarwal": {
      designation: "CFO",
      bio: "Oversees financial strategy, compliance, and sustainable growth — ensuring Krishibridge remains trusted by farmers, aggregators, and institutional buyers across every transaction.",
      expertise: ["Financial strategy", "Compliance", "Institutional trust"],
    },
    "cfo-pranish-shrestha": {
      designation: "CTO",
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
      bio: "Gopal Upadhyay is one of the co-founders of the acclaimed startup Teabox.com, which has been backed by the late Mr. Ratan Tata. With over 15 years of experience in agri-trade and supply chain, Gopal is a seasoned industry expert. At KrishiBridge, he mentors the team with strategic insights into building a resilient and efficient rural trade ecosystem, aimed at enhancing farmer incomes and improving rural livelihoods.",
      expertise: ["Agri-trade", "Supply chain", "Rural livelihoods"],
    },
  },
  hi: {
    "ceo-shyam-soni": {
      designation: "CEO",
      bio: "B2B पेय पदार्थ और कमोडिटी व्यापार में 15 से अधिक वर्षों के अनुभव के साथ, Shyam Soni Krishibridge के संस्थापक हैं। वे उच्च-मूल्य मसालों के लिए पारदर्शी, तकनीक-संचालित आपूर्ति श्रृंखलाएँ बना रहे हैं। उनका मिशन: निष्पक्ष मूल्य निर्धारण, सशक्त किसान और निर्बाध वैश्विक पहुँच।",
      expertise: ["B2B व्यापार", "मसाले", "वैश्विक पहुँच"],
    },
    "cfo-amit-agarwal": {
      designation: "CFO",
      bio: "वित्तीय रणनीति, अनुपालन और स्थायी विकास की देखरेख करते हैं — यह सुनिश्चित करते हुए कि Krishibridge किसानों, एग्रीगेटरों और संस्थागत खरीदारों का भरोसा बनाए रखे।",
      expertise: ["वित्तीय रणनीति", "अनुपालन", "संस्थागत विश्वास"],
    },
    "cfo-pranish-shrestha": {
      designation: "CTO",
      bio: "नेपाल और व्यापक हिमालयी कॉरिडोर में वित्तीय संचालन को मजबूत करते हैं, सीमा पार कमोडिटी वित्त और क्षेत्रीय सेटलमेंट में गहरी विशेषज्ञता के साथ।",
      expertise: ["सीमा पार वित्त", "नेपाल संचालन", "सेटलमेंट"],
    },
    "director-nasreen-rahman": {
      designation: "Director",
      bio: "रणनीतिक दिशा और शासन विशेषज्ञता लाती हैं, जिससे Krishibridge दक्षिण एशिया और अंतर्राष्ट्रीय खरीदार बाज़ारों में जिम्मेदारी से विस्तार कर सके।",
      expertise: ["शासन", "दक्षिण एशिया रणनीति", "खरीदार बाज़ार"],
    },
    "mentor-gopal-upadhyay": {
      designation: "Mentor",
      bio: "Gopal Upadhyay प्रसिद्ध स्टार्टअप Teabox.com के सह-संस्थापकों में से एक हैं, जिसे दिवंगत श्री रतन टाटा ने समर्थन दिया था। कृषि-व्यापार और आपूर्ति श्रृंखला में 15 से अधिक वर्षों के अनुभव के साथ, Gopal एक अनुभवी उद्योग विशेषज्ञ हैं। KrishiBridge में, वे किसानों की आय बढ़ाने और ग्रामीण जीवन स्तर सुधारने के लक्ष्य के साथ एक लचीला और कुशल ग्रामीण व्यापार पारिस्थितिकी तंत्र बनाने में रणनीतिक अंतर्दृष्टि के साथ टीम का मार्गदर्शन करते हैं।",
      expertise: ["कृषि-व्यापार", "आपूर्ति श्रृंखला", "ग्रामीण जीविका"],
    },
  },
  ne: {
    "ceo-shyam-soni": {
      designation: "CEO",
      bio: "B2B पेय पदार्थ र कमोडिटी व्यापारमा 15 भन्दा बढी वर्षको अनुभवसहित, Shyam Soni Krishibridge का संस्थापक हुन्। उहाँ उच्च-मूल्य मसलाहरूका लागि पारदर्शी, प्रविधि-संचालित आपूर्ति श्रृंखला निर्माण गर्दै हुनुहुन्छ। उहाँको मिशन: निष्पक्ष मूल्य निर्धारण, सशक्त किसान र निर्बाध विश्वव्यापी पहुँच।",
      expertise: ["B2B व्यापार", "मसला", "विश्वव्यापी पहुँच"],
    },
    "cfo-amit-agarwal": {
      designation: "CFO",
      bio: "वित्तीय रणनीति, अनुपालन र दिगो विकासको निरीक्षण गर्छन् — Krishibridge ले किसान, एग्रीगेटर र संस्थागत खरिदकर्ताको भरोसा कायम राखोस् भन्ने सुनिश्चित गर्दै।",
      expertise: ["वित्तीय रणनीति", "अनुपालन", "संस्थागत भरोसा"],
    },
    "cfo-pranish-shrestha": {
      designation: "CTO",
      bio: "नेपाल र व्यापक हिमालयी क्षेत्रमा वित्तीय सञ्चालनलाई सुदृढ बनाउँछन्, सीमा पार कमोडिटी वित्त र क्षेत्रीय सेटलमेन्टमा गहन विशेषज्ञतासहित।",
      expertise: ["सीमा पार वित्त", "नेपाल सञ्चालन", "सेटलमेन्ट"],
    },
    "director-nasreen-rahman": {
      designation: "Director",
      bio: "रणनीतिक दिशा र शासन विशेषज्ञता ल्याउँछिन्, जसले Krishibridge लाई दक्षिण एशिया र अन्तर्राष्ट्रीय खरिदकर्ता बजारमा जिम्मेवारीपूर्वक विस्तार गर्न मद्दत गर्छ।",
      expertise: ["शासन", "दक्षिण एशिया रणनीति", "खरिदकर्ता बजार"],
    },
    "mentor-gopal-upadhyay": {
      designation: "Mentor",
      bio: "Gopal Upadhyay प्रसिद्ध स्टार्टअप Teabox.com का सह-संस्थापकमध्ये एक हुन्, जसलाई स्वर्गीय श्री रतन टाटाले समर्थन गरेका थिए। कृषि-व्यापार र आपूर्ति श्रृंखलामा 15 भन्दा बढी वर्षको अनुभवसहित, Gopal एक अनुभवी उद्योग विशेषज्ञ हुन्। KrishiBridge मा, उहाँ किसानको आम्दानी बढाउने र ग्रामीण जीविका सुधार्ने लक्ष्यसहित लचिलो र कुशल ग्रामीण व्यापार पारिस्थितिकी तन्त्र निर्माणमा रणनीतिक अन्तर्दृष्टिसहित टोलीलाई मार्गदर्शन गर्नुहुन्छ।",
      expertise: ["कृषि-व्यापार", "आपूर्ति श्रृंखला", "ग्रामीण जीविका"],
    },
  },
  dz: {
    "ceo-shyam-soni": {
      designation: "CEO",
      bio: "B2B beverage དང་ཚོང་རྫས་ཚོང་འབྲེལ་ལུ་ལོ་15 ལས་མང་བའི་ལོ་རྒྱུས་ཡོད་པའི་ནང་ Shyam Soni ཡིན་ནི་ Krishibridge གི་གཏོང་འདྲེན་པ་ཨིན། ཁོང་གིས་རིན་ཐང་ཆེ་བའི་ཚི་མའི་ཚོང་འབྲེལ་ལུ་གསལ་ཏོག་ཏོའི་ tech-driven supply chain གཏོང་འབདཝ་ཨིན། ཁོང་གི་དམིགས་ཡུལ་ fair pricing, empowered farmers, seamless global access ཨིན།",
      expertise: ["B2B་ཚོང་འབྲེལ", "ཚི་མ", "རྒྱལ་སྤྱིའི་འཛུལ་སྤྱོད"],
    },
    "cfo-amit-agarwal": {
      designation: "CFO",
      bio: "དངུལ་རྩིས་ཐབས་ལམ་ ཁྲིམས་མཐུན་ དང་རྒྱུན་མཐུད་འཕེལ་རྒྱས་ལུ་ལས་འཛིན་འབདཝ་ཨིན། ཞིང་པ་ བསྡུ་སྒྲིག་པ་ དང་ལས་ཁུངས་ཉོ་མི་ཚུའི་ཡིད་ཆེས་སྲུང་སྐྱོང་འབདཝ་ཨིན།",
      expertise: ["དངུལ་རྩིས་ཐབས་ལམ", "ཁྲིམས་མཐུན", "ལས་ཁུངས་ཡིད་ཆེས"],
    },
    "cfo-pranish-shrestha": {
      designation: "CTO",
      bio: "Nepal དང་ཧི་མ་ལ་ཡའི་ལམ་བུ་ཁྲོད་དུ་དངུལ་རྩིས་ལས་སྦྱོར་སྟོབར་བསྐྱེད་འབདཝ་ཨིན། ས་མཚམས་བརྒལ་ཚོང་རྫས་དངུལ་རྩིས་ དང་ས་ཁོངས་དངུལ་སྤྲོད་ལས་རིམ་ལུ་ཤེས་རྒྱུད་ཆེན་པོ་ཡོད།",
      expertise: ["ས་མཚམས་བརྒལ་དངུལ་རྩིས", "Nepal་ལས་སྦྱོར", "དངུལ་སྤྲོད"],
    },
    "director-nasreen-rahman": {
      designation: "Director",
      bio: "ཐབས་ལམ་གྱི་ཁ་ཕྱོགས་ དང་ཁྲིམས་ལུགས་ཀྱི་ཤེས་རྒྱུད་འདྲེན་འབདཝ་ཨིན། Krishibridge ལུ་ལྷོ་ཨེ་ཤི་ཡ་ དང་རྒྱལ་སྤྱིའི་ཉོ་མི་ཁྲོམ་ཚུ་ནང་འགྲོ་བཀོད་སྐྱོང་འབདཝ་ཨིན།",
      expertise: ["ཁྲིམས་ལུགས", "ལྷོ་ཨེ་ཤི་ཡ་ཐབས་ལམ", "ཉོ་མི་ཁྲོམ"],
    },
    "mentor-gopal-upadhyay": {
      designation: "Mentor",
      bio: "Gopal Upadhyay ཡིན་ནི་ Teabox.com གི་གཏོང་འདྲེན་སྦྱོར་བ་ཚུ་གི་ནང་ཚན་ཅིག་ཨིན། སྔོན་གྱི་ Mr. Ratan Tata གིས་རྒྱབ་སྐྱོར་འབད་ཡོདཔ་ཨིན། སོ་ནམ་ཚོང་འབྲེལ་དང་ supply chain ལུ་ལོ་15 ལས་མང་བའི་ལོ་རྒྱུས་ཡོད། KrishiBridge ནང་ཁོང་གིས་ཞིང་པའི་འབྱོར་འབབ་མཐོ་བཏང་ དང་གྲོང་གསེབ་ཀྱི་འཚོ་བ་སྐྱོང་བར་དམིགས་ཡུལ་བཅས་ resilient rural trade ecosystem གཏོང་ནི་ལུ་ཐབས་ལམ་གྱི་ལམ་སྟོན་འབདཝ་ཨིན།",
      expertise: ["སོ་ནམ་ཚོང་འབྲེལ", "Supply chain", "གྲོང་གསེབ་འཚོ་བ"],
    },
  },
  ar: {
    "ceo-shyam-soni": {
      designation: "CEO",
      bio: "مع أكثر من 15 عامًا من الخبرة في تجارة المشروبات والسلع بين الشركات، Shyam Soni هو مؤسس Krishibridge. يبني سلاسل توريد شفافة قائمة على التكنولوجيا للتوابل عالية القيمة. مهمته: تسعير عادل، ومزارعون متمكنون، ووصول عالمي سلس.",
      expertise: ["تجارة B2B", "التوابل", "الوصول العالمي"],
    },
    "cfo-amit-agarwal": {
      designation: "CFO",
      bio: "يشرف على الاستراتيجية المالية والامتثال والنمو المستدام — لضمان بقاء Krishibridge موثوقة لدى المزارعين والمجمعين والمشترين المؤسسيين في كل معاملة.",
      expertise: ["الاستراتيجية المالية", "الامتثال", "ثقة المؤسسات"],
    },
    "cfo-pranish-shrestha": {
      designation: "CTO",
      bio: "يعزز العمليات المالية في نيبال وعبر ممر الهيمالايا الأوسع، بخبرة عميقة في تمويل السلع عبر الحدود وسير تسويات إقليمية.",
      expertise: ["التمويل عبر الحدود", "عمليات نيبال", "التسوية"],
    },
    "director-nasreen-rahman": {
      designation: "Director",
      bio: "تقدم التوجيه الاستراتيجي وخبرة الحوكمة، وتشكل كيفية توسع Krishibridge بمسؤولية في جنوب آسيا وأسواق المشترين الدولية.",
      expertise: ["الحوكمة", "استراتيجية جنوب آسيا", "أسواق المشترين"],
    },
    "mentor-gopal-upadhyay": {
      designation: "Mentor",
      bio: "Gopal Upadhyay أحد المؤسسين المشاركين لشركة Teabox.com الناشئة المرموقة، التي حظيت بدعم الراحل السيد راتان تاتا. مع أكثر من 15 عامًا من الخبرة في تجارة المنتجات الزراعية وسلسلة التوريد، يعد Gopal خبيرًا مخضرمًا في الصناعة. في KrishiBridge، يوجه الفريق برؤى استراتيجية لبناء نظام تجاري ريفي مرن وفعال، يهدف إلى تعزيز دخل المزارعين وتحسين سبل العيش الريفية.",
      expertise: ["تجارة زراعية", "سلسلة التوريد", "سبل العيش الريفية"],
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
