import { normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";

export type BlogPageCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  summary: string;
  readArticle: string;
  noArticles: string;
  noArticlesHint: string;
  loadError: string;
  tryAgain: string;
  backToBlog: string;
  like: string;
  likes: string;
  share: string;
  shares: string;
  copyLink: string;
  comment: string;
  comments: string;
  commentsTitle: string;
  commentPlaceholder: string;
  postComment: string;
  signInToComment: string;
  signIn: string;
  noComments: string;
  shareThanks: string;
  linkCopied: string;
  linkCopiedClipboard: string;
  shareNotSupported: string;
  shareFailed: string;
  signInToLike: string;
  likeFailed: string;
  writeCommentFirst: string;
  commentPosted: string;
  commentFailed: string;
  commentsLoadFailed: string;
  shareText: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  you: string;
};

const BLOG_COPY: Record<LocaleCode, BlogPageCopy> = {
  en: {
    metaTitle: "Blog | Krishibridge",
    metaDescription:
      "Insights on agricultural trade, commodity markets, and platform updates from Krishibridge.",
    eyebrow: "Krishibridge Blog",
    title: "Insights from the field and the market",
    summary:
      "Trade updates, commodity stories, and platform news from across the Himalayan exchange corridor.",
    readArticle: "Read article",
    noArticles: "No articles published yet",
    noArticlesHint: "Check back soon for new content.",
    loadError: "Failed to load blog posts",
    tryAgain: "Try again",
    backToBlog: "Back to blog",
    like: "Like",
    likes: "Likes",
    share: "Share",
    shares: "Shares",
    copyLink: "Copy link",
    comment: "Comment",
    comments: "Comments",
    commentsTitle: "Comments",
    commentPlaceholder: "Share your thoughts...",
    postComment: "Post comment",
    signInToComment: "to leave a comment.",
    signIn: "Sign in",
    noComments: "No comments yet. Be the first to share your thoughts.",
    shareThanks: "Thanks for sharing!",
    linkCopied: "Link copied",
    linkCopiedClipboard: "Link copied to clipboard",
    shareNotSupported: "Sharing is not supported on this device",
    shareFailed: "Could not share this article",
    signInToLike: "Sign in to like this article",
    likeFailed: "Failed to update like",
    writeCommentFirst: "Write a comment first",
    commentPosted: "Comment posted",
    commentFailed: "Failed to post comment",
    commentsLoadFailed: "Failed to load comments",
    shareText: 'Read "{title}" on Krishibridge',
    justNow: "Just now",
    minutesAgo: "{count}m ago",
    hoursAgo: "{count}h ago",
    daysAgo: "{count}d ago",
    you: "You",
  },
  hi: {
    metaTitle: "ब्लॉग | Krishibridge",
    metaDescription:
      "कृषि व्यापार, कमोडिटी बाज़ार और Krishibridge प्लेटफ़ॉर्म अपडेट पर अंतर्दृष्टि।",
    eyebrow: "Krishibridge ब्लॉग",
    title: "खेत और बाज़ार से अंतर्दृष्टि",
    summary:
      "हिमालयी एक्सचेंज कॉरिडोर से व्यापार अपडेट, कमोडिटी कहानियाँ और प्लेटफ़ॉर्म समाचार।",
    readArticle: "लेख पढ़ें",
    noArticles: "अभी कोई लेख प्रकाशित नहीं",
    noArticlesHint: "नई सामग्री के लिए जल्द वापस देखें।",
    loadError: "ब्लॉग पोस्ट लोड नहीं हो सके",
    tryAgain: "पुनः प्रयास करें",
    backToBlog: "ब्लॉग पर वापस",
    like: "पसंद",
    likes: "पसंद",
    share: "साझा करें",
    shares: "साझा",
    copyLink: "लिंक कॉपी करें",
    comment: "टिप्पणी",
    comments: "टिप्पणियाँ",
    commentsTitle: "टिप्पणियाँ",
    commentPlaceholder: "अपने विचार साझा करें...",
    postComment: "टिप्पणी पोस्ट करें",
    signInToComment: "टिप्पणी करने के लिए।",
    signIn: "साइन इन करें",
    noComments: "अभी कोई टिप्पणी नहीं। सबसे पहले अपने विचार साझा करें।",
    shareThanks: "साझा करने के लिए धन्यवाद!",
    linkCopied: "लिंक कॉपी हो गया",
    linkCopiedClipboard: "लिंक क्लिपबोर्ड पर कॉपी हो गया",
    shareNotSupported: "इस डिवाइस पर साझा करना समर्थित नहीं",
    shareFailed: "लेख साझा नहीं हो सका",
    signInToLike: "लेख पसंद करने के लिए साइन इन करें",
    likeFailed: "पसंद अपडेट नहीं हो सकी",
    writeCommentFirst: "पहले टिप्पणी लिखें",
    commentPosted: "टिप्पणी पोस्ट हो गई",
    commentFailed: "टिप्पणी पोस्ट नहीं हो सकी",
    commentsLoadFailed: "टिप्पणियाँ लोड नहीं हो सकीं",
    shareText: 'Krishibridge पर "{title}" पढ़ें',
    justNow: "अभी",
    minutesAgo: "{count} मि. पहले",
    hoursAgo: "{count} घं. पहले",
    daysAgo: "{count} दि. पहले",
    you: "आप",
  },
  ne: {
    metaTitle: "ब्लग | Krishibridge",
    metaDescription:
      "कृषि व्यापार, कमोडिटी बजार र Krishibridge प्लेटफर्म अपडेटका बारेमा अन्तर्दृष्टि।",
    eyebrow: "Krishibridge ब्लग",
    title: "खेत र बजारबाट अन्तर्दृष्टि",
    summary:
      "हिमालयी एक्सचेन्ज क्षेत्रबाट व्यापार अपडेट, कमोडिटी कथा र प्लेटफर्म समाचार।",
    readArticle: "लेख पढ्नुहोस्",
    noArticles: "अहिले कुनै लेख प्रकाशित छैन",
    noArticlesHint: "नयाँ सामग्रीका लागि छिट्टै फेरि हेर्नुहोस्।",
    loadError: "ब्लग पोस्ट लोड हुन सकेन",
    tryAgain: "फेरि प्रयास गर्नुहोस्",
    backToBlog: "ब्लगमा फर्कनुहोस्",
    like: "मन पर्यो",
    likes: "मन पर्यो",
    share: "साझा गर्नुहोस्",
    shares: "साझा",
    copyLink: "लिङ्क कपी गर्नुहोस्",
    comment: "टिप्पणी",
    comments: "टिप्पणीहरू",
    commentsTitle: "टिप्पणीहरू",
    commentPlaceholder: "आफ्ना विचार साझा गर्नुहोस्...",
    postComment: "टिप्पणी पोस्ट गर्नुहोस्",
    signInToComment: "टिप्पणी छोड्न।",
    signIn: "साइन इन गर्नुहोस्",
    noComments: "अहिले कुनै टिप्पणी छैन। पहिलो विचार साझा गर्नुहोस्।",
    shareThanks: "साझा गर्नुभएकोमा धन्यवाद!",
    linkCopied: "लिङ्क कपी भयो",
    linkCopiedClipboard: "लिङ्क क्लिपबोर्डमा कपी भयो",
    shareNotSupported: "यो उपकरणमा साझा समर्थित छैन",
    shareFailed: "लेख साझा गर्न सकिएन",
    signInToLike: "लेख मन पराउन साइन इन गर्नुहोस्",
    likeFailed: "मन पराउने अपडेट हुन सकेन",
    writeCommentFirst: "पहिले टिप्पणी लेख्नुहोस्",
    commentPosted: "टिप्पणी पोस्ट भयो",
    commentFailed: "टिप्पणी पोस्ट हुन सकेन",
    commentsLoadFailed: "टिप्पणीहरू लोड हुन सकेन",
    shareText: 'Krishibridge मा "{title}" पढ्नुहोस्',
    justNow: "अहिले",
    minutesAgo: "{count} मि. अघि",
    hoursAgo: "{count} घं. अघि",
    daysAgo: "{count} दि. अघि",
    you: "तपाईं",
  },
  dz: {
    metaTitle: "Blog | Krishibridge",
    metaDescription:
      "སོ་ནམ་ཚོང་འབྲེལ་ ཚོང་རྫས་ཁྲོམ་ དང Krishibridge པད་སྟེགས་གསར་སྒྱུར་སྐོར་གྱི་ཤེས་རྒྱུད།",
    eyebrow: "Krishibridge Blog",
    title: "ཞིང་ཁམས་དང་ཁྲོམ་ནས་ཤེས་རྒྱུད།",
    summary:
      "ཧི་མ་ལ་ཡའི་ཚོང་འབྲེལ་ལམ་བུ་ནས་ཚོང་འབྲེལ་གསར་སྒྱུར་ ཚོང་རྫས་གཏམ་རྒྱུད་ དང་པད་སྟེགས་གསར་འགྱུར།",
    readArticle: "རྩོམ་ཡིག་ཀློག",
    noArticles: "ད་ལྟོ་པར་སྤེལ་མི་འདུག",
    noArticlesHint: "ནང་དོན་གསར་པའི་ཆེད་ཏོག་ཙམ་ཡང་བསྐྱར་ལྟ།",
    loadError: "བློག་སྤེལ་ལེན་མ་ཐུབ",
    tryAgain: "ཡང་བསྐྱར་འབད",
    backToBlog: "བློག་ལུ་ལོག",
    like: "དགའ་བ",
    likes: "དགའ་བ",
    share: "བགོ་བཤའ",
    shares: "བགོ་བཤའ",
    copyLink: "སྦྲེལ་ཐག་ཀོ་པི",
    comment: "བསམ་ཚུལ",
    comments: "བསམ་ཚུལ་ཚུ",
    commentsTitle: "བསམ་ཚུལ་ཚུ",
    commentPlaceholder: "ཁྱོད་ཀྱི་བསམ་ཚུལ་བཤད...",
    postComment: "བསམ་ཚུལ་སྤྲོད",
    signInToComment: "བསམ་ཚུལ་འབད་ནི་ལུ།",
    signIn: "ནང་འཛུལ",
    noComments: "ད་ལྟོ་བསམ་ཚུལ་མེད། ཐོག་མའི་བསམ་ཚུལ་འབད།",
    shareThanks: "བགོ་བཤའ་ཐུགས་རྗེ་ཆེ།",
    linkCopied: "སྦྲེལ་ཐག་ཀོ་པི་འབད་ཡོད",
    linkCopiedClipboard: "སྦྲེལ་ཐག་ཀླིཔ་བོརྡ་ལུ་ཀོ་པི་འབད་ཡོད",
    shareNotSupported: "འདི་གི་ཡོ་ཆས་ནང་བགོ་བཤའ་མིན་འདུག",
    shareFailed: "རྩོམ་ཡིག་བགོ་བཤའ་མ་ཐུབ",
    signInToLike: "དགའ་བ་འབད་ནི་ལུ་ནང་འཛུལ",
    likeFailed: "དགའ་བ་དུས་མཐུན་མ་ཐུབ",
    writeCommentFirst: "ཐོག་མ་བསམ་ཚུལ་འབྲི",
    commentPosted: "བསམ་ཚུལ་སྤྲོད་ཡོད",
    commentFailed: "བསམ་ཚུལ་སྤྲོད་མ་ཐུབ",
    commentsLoadFailed: "བསམ་ཚུལ་ལེན་མ་ཐུབ",
    shareText: 'Krishibridge ནང "{title}"་ཀློག',
    justNow: "ད་ལྟོ",
    minutesAgo: "{count}སྐར་མ་སྔོན",
    hoursAgo: "{count}ཆུ་ཚོད་སྔོན",
    daysAgo: "{count}ཉིན་སྔོན",
    you: "ཁྱོད་རང",
  },
  ar: {
    metaTitle: "المدونة | Krishibridge",
    metaDescription:
      "رؤى حول التجارة الزراعية وأسواق السلع وتحديثات منصة Krishibridge.",
    eyebrow: "مدونة Krishibridge",
    title: "رؤى من الميدان والسوق",
    summary:
      "تحديثات التجارة وقصص السلع وأخبار المنصة من ممر التبادل في الهيمالايا.",
    readArticle: "اقرأ المقال",
    noArticles: "لا توجد مقالات منشورة بعد",
    noArticlesHint: "عد قريبا للمحتوى الجديد.",
    loadError: "تعذر تحميل مقالات المدونة",
    tryAgain: "حاول مرة أخرى",
    backToBlog: "العودة إلى المدونة",
    like: "إعجاب",
    likes: "إعجابات",
    share: "مشاركة",
    shares: "مشاركات",
    copyLink: "نسخ الرابط",
    comment: "تعليق",
    comments: "تعليقات",
    commentsTitle: "التعليقات",
    commentPlaceholder: "شارك أفكارك...",
    postComment: "نشر تعليق",
    signInToComment: "لترك تعليق.",
    signIn: "تسجيل الدخول",
    noComments: "لا توجد تعليقات بعد. كن أول من يشارك أفكاره.",
    shareThanks: "شكرا للمشاركة!",
    linkCopied: "تم نسخ الرابط",
    linkCopiedClipboard: "تم نسخ الرابط إلى الحافظة",
    shareNotSupported: "المشاركة غير مدعومة على هذا الجهاز",
    shareFailed: "تعذرت مشاركة المقال",
    signInToLike: "سجل الدخول للإعجاب بهذا المقال",
    likeFailed: "تعذر تحديث الإعجاب",
    writeCommentFirst: "اكتب تعليقا أولا",
    commentPosted: "تم نشر التعليق",
    commentFailed: "تعذر نشر التعليق",
    commentsLoadFailed: "تعذر تحميل التعليقات",
    shareText: 'اقرأ "{title}" على Krishibridge',
    justNow: "الآن",
    minutesAgo: "منذ {count} د",
    hoursAgo: "منذ {count} س",
    daysAgo: "منذ {count} ي",
    you: "أنت",
  },
};

export function getBlogPageCopy(locale: string): BlogPageCopy {
  return BLOG_COPY[normalizeLocale(locale)];
}

export function formatBlogRelativeTime(
  value: string,
  copy: BlogPageCopy,
  locale: string
): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return copy.justNow;
  if (diffMins < 60) return copy.minutesAgo.replace("{count}", String(diffMins));
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return copy.hoursAgo.replace("{count}", String(diffHours));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return copy.daysAgo.replace("{count}", String(diffDays));
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatBlogDate(
  value: string | Date | null,
  locale: string,
  style: "short" | "long" = "short"
): string {
  if (!value) return "";
  const localeCode = normalizeLocale(locale);
  return new Intl.DateTimeFormat(localeCode, {
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
