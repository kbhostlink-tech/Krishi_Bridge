"use client";

import { useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { normalizeLocale, type LocaleCode } from "@/lib/public-page-content-v2";

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-sage-200 bg-white px-3.5 py-3 text-sm text-sage-900 outline-none transition placeholder:text-sage-400 focus:border-sage-700 focus:ring-2 focus:ring-sage-200";

const FORM_COPY: Record<LocaleCode, {
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  topic: string;
  topicPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  consent: string;
  note: string;
  send: string;
  sending: string;
  required: string;
  consentRequired: string;
  success: string;
  error: string;
  topics: Array<{ value: string; label: string }>;
}> = {
  en: {
    name: "Full name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "name@company.com",
    topic: "Topic",
    topicPlaceholder: "Select topic",
    message: "Message",
    messagePlaceholder: "Tell us what you are trying to do.",
    consent: "Krishibridge can use these details to respond to this enquiry.",
    note: "Fraud, security, and payment concerns are prioritized by the operations team.",
    send: "Send message",
    sending: "Sending...",
    required: "Please fill in your name, email, topic, and message.",
    consentRequired: "Please confirm that we can use these details to respond.",
    success: "Thanks. Your message has been routed to the Krishibridge team.",
    error: "Something went wrong. Please email krishibridge@gmail.com.",
    topics: [
      { value: "farmer-onboarding", label: "Farmer or cooperative onboarding" },
      { value: "buyer-sourcing", label: "Buyer sourcing or RFQ" },
      { value: "warehouse-partnership", label: "Warehouse partnership" },
      { value: "account-support", label: "Account or KYC support" },
      { value: "fraud-security", label: "Fraud or security report" },
      { value: "other", label: "Other" },
    ],
  },
  hi: {
    name: "पूरा नाम",
    namePlaceholder: "आपका नाम",
    email: "ईमेल",
    emailPlaceholder: "name@company.com",
    topic: "विषय",
    topicPlaceholder: "विषय चुनें",
    message: "संदेश",
    messagePlaceholder: "बताएं कि आप क्या करना चाहते हैं।",
    consent: "Krishibridge इन विवरणों का उपयोग इस पूछताछ का उत्तर देने के लिए कर सकता है।",
    note: "धोखाधड़ी, सुरक्षा और भुगतान चिंताओं को संचालन टीम प्राथमिकता देती है।",
    send: "संदेश भेजें",
    sending: "भेजा जा रहा है...",
    required: "कृपया नाम, ईमेल, विषय और संदेश भरें।",
    consentRequired: "कृपया पुष्टि करें कि हम उत्तर देने के लिए इन विवरणों का उपयोग कर सकते हैं।",
    success: "धन्यवाद। आपका संदेश Krishibridge टीम को भेज दिया गया है।",
    error: "कुछ गलत हुआ। कृपया krishibridge@gmail.com पर ईमेल करें।",
    topics: [
      { value: "farmer-onboarding", label: "किसान या सहकारी ऑनबोर्डिंग" },
      { value: "buyer-sourcing", label: "खरीदार सोर्सिंग या RFQ" },
      { value: "warehouse-partnership", label: "गोदाम साझेदारी" },
      { value: "account-support", label: "खाता या KYC सहायता" },
      { value: "fraud-security", label: "धोखाधड़ी या सुरक्षा रिपोर्ट" },
      { value: "other", label: "अन्य" },
    ],
  },
  ne: {
    name: "पूरा नाम",
    namePlaceholder: "तपाईंको नाम",
    email: "इमेल",
    emailPlaceholder: "name@company.com",
    topic: "विषय",
    topicPlaceholder: "विषय छान्नुहोस्",
    message: "सन्देश",
    messagePlaceholder: "तपाईं के गर्न खोज्दै हुनुहुन्छ बताउनुहोस्।",
    consent: "Krishibridge ले यी विवरणहरू यस सोधपुछको जवाफ दिन प्रयोग गर्न सक्छ।",
    note: "ठगी, सुरक्षा र भुक्तानी सम्बन्धी चिन्तालाई सञ्चालन टोलीले प्राथमिकता दिन्छ।",
    send: "सन्देश पठाउनुहोस्",
    sending: "पठाइँदै...",
    required: "कृपया नाम, इमेल, विषय र सन्देश भर्नुहोस्।",
    consentRequired: "कृपया जवाफ दिन यी विवरणहरू प्रयोग गर्न मिल्ने पुष्टि गर्नुहोस्।",
    success: "धन्यवाद। तपाईंको सन्देश Krishibridge टोलीमा पठाइएको छ।",
    error: "केही गलत भयो। कृपया krishibridge@gmail.com मा इमेल गर्नुहोस्।",
    topics: [
      { value: "farmer-onboarding", label: "किसान वा सहकारी अनबोर्डिङ" },
      { value: "buyer-sourcing", label: "खरिदकर्ता सोर्सिङ वा RFQ" },
      { value: "warehouse-partnership", label: "गोदाम साझेदारी" },
      { value: "account-support", label: "खाता वा KYC सहायता" },
      { value: "fraud-security", label: "ठगी वा सुरक्षा रिपोर्ट" },
      { value: "other", label: "अन्य" },
    ],
  },
  dz: {
    name: "མིང་ཆ་ཚང་།",
    namePlaceholder: "ཁྱོད་རའི་མིང་།",
    email: "ཡིག་འཕྲིན།",
    emailPlaceholder: "name@company.com",
    topic: "དོན་ཚན།",
    topicPlaceholder: "དོན་ཚན་གདམ།",
    message: "འཕྲིན།",
    messagePlaceholder: "ཁྱོད་ཀྱིས་ག་ཅི་འབད་ནི་ཨིན་ན་བཤད།",
    consent: "Krishibridge གིས་འདི་ཚུ་ལན་སྤྲོད་ནི་ལུ་ལག་ལེན་འཐབ་ཆོག།",
    note: "གཡོ་ཁྲམ་ བདེ་འཇགས་ དང་དངུལ་སྤྲོད་དོན་ཚན་ཚུ་ལུ་གཙོ་རིམ་ཡོད།",
    send: "འཕྲིན་བསྐུར།",
    sending: "བསྐུར་དོ...",
    required: "མིང་ ཡིག་འཕྲིན་ དོན་ཚན་ དང་འཕྲིན་བཙུགས་གནང་།",
    consentRequired: "ལན་སྤྲོད་ནི་ལུ་འདི་ཚུ་ལག་ལེན་འཐབ་ཆོག་པའི་ངེས་གཏན་གནང་།",
    success: "བཀའ་དྲིན་ཆེ། ཁྱོད་ཀྱི་འཕྲིན་ Krishibridge ཚོགས་པ་ལུ་བསྐུར་ཡོད།",
    error: "གནད་དོན་བྱུང་ཡོད། krishibridge@gmail.com ལུ་ཡིག་འཕྲིན་གནང་།",
    topics: [
      { value: "farmer-onboarding", label: "ཞིང་པ་ཡང་ན་མཉམ་ལས་ནང་འཛུལ།" },
      { value: "buyer-sourcing", label: "ཉོ་མི་འཚོལ་བ་ཡང་ན RFQ" },
      { value: "warehouse-partnership", label: "མཛོད་ཁང་མཉམ་འབྲེལ།" },
      { value: "account-support", label: "རྩིས་ཁྲ་ཡང་ན KYC རྒྱབ་སྐྱོར།" },
      { value: "fraud-security", label: "གཡོ་ཁྲམ་ཡང་ན་བདེ་འཇགས་སྙན་ཞུ།" },
      { value: "other", label: "གཞན།" },
    ],
  },
  ar: {
    name: "الاسم الكامل",
    namePlaceholder: "اسمك",
    email: "البريد الإلكتروني",
    emailPlaceholder: "name@company.com",
    topic: "الموضوع",
    topicPlaceholder: "اختر الموضوع",
    message: "الرسالة",
    messagePlaceholder: "أخبرنا بما تحاول القيام به.",
    consent: "يمكن ل Krishibridge استخدام هذه التفاصيل للرد على هذا الاستفسار.",
    note: "تعطي فرق العمليات أولوية لمخاوف الاحتيال والأمان والدفع.",
    send: "إرسال الرسالة",
    sending: "جار الإرسال...",
    required: "يرجى إدخال الاسم والبريد الإلكتروني والموضوع والرسالة.",
    consentRequired: "يرجى تأكيد أنه يمكننا استخدام هذه التفاصيل للرد.",
    success: "شكرا. تم توجيه رسالتك إلى فريق Krishibridge.",
    error: "حدث خطأ. يرجى إرسال بريد إلى krishibridge@gmail.com.",
    topics: [
      { value: "farmer-onboarding", label: "انضمام مزارع أو تعاونية" },
      { value: "buyer-sourcing", label: "توريد مشترين أو RFQ" },
      { value: "warehouse-partnership", label: "شراكة مستودع" },
      { value: "account-support", label: "دعم حساب أو KYC" },
      { value: "fraud-security", label: "بلاغ احتيال أو أمان" },
      { value: "other", label: "أخرى" },
    ],
  },
};

export function ContactForm() {
  const locale = useLocale();
  const copy = FORM_COPY[normalizeLocale(locale)];
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      topic: String(data.get("topic") || "").trim(),
      message: String(data.get("message") || "").trim(),
      consent: data.get("consent") === "on",
    };

    if (!payload.name || !payload.email || !payload.topic || !payload.message) {
      toast.error(copy.required);
      return;
    }

    if (!payload.consent) {
      toast.error(copy.consentRequired);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      toast.success(copy.success);
      form.reset();
    } catch {
      toast.error(copy.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-sage-800">
          {copy.name}
          <input name="name" type="text" required autoComplete="name" placeholder={copy.namePlaceholder} className={INPUT_CLASS} />
        </label>
        <label className="block text-sm font-semibold text-sage-800">
          {copy.email}
          <input name="email" type="email" required autoComplete="email" placeholder={copy.emailPlaceholder} className={INPUT_CLASS} />
        </label>
      </div>

      <label className="block text-sm font-semibold text-sage-800">
        {copy.topic}
        <select name="topic" defaultValue="" required className={INPUT_CLASS}>
          <option value="">{copy.topicPlaceholder}</option>
          {copy.topics.map((topic) => (
            <option key={topic.value} value={topic.value}>{topic.label}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-sage-800">
        {copy.message}
        <textarea name="message" rows={6} required placeholder={copy.messagePlaceholder} className={`${INPUT_CLASS} min-h-36 resize-y leading-7`} />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-sage-100 bg-sage-50 px-4 py-3 text-sm leading-6 text-sage-700">
        <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 rounded border-sage-300 text-sage-800 focus:ring-sage-700" />
        <span>{copy.consent}</span>
      </label>

      <div className="flex flex-col gap-3 border-t border-sage-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs leading-5 text-sage-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          {copy.note}
        </div>
        <button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {submitting ? copy.sending : copy.send}
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
