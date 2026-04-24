#!/usr/bin/env node
/**
 * Adds a few editorial accent keys under `landing` for all five locales.
 * Idempotent: safely skips keys that already exist.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "src", "i18n", "messages");

const EXTRAS = {
  en: {
    ticker: { live: "LIVE" },
    hero: {
      script: "from origin to plate",
      eyebrowLeft: "est. 2021",
      eyebrowRight: "Sikkim · India",
      titleLead: "The",
      titleItalic1: "Himalayan",
      titleMid: "harvest, now",
      titleItalic2: "trade-ready",
      titleTail: "for six markets.",
      metaLabel: "Today's liquidity"
    },
    heritage: { chapter: "Chapter" },
    closing: { script: "from our fields, to yours" }
  },
  hi: {
    ticker: { live: "लाइव" },
    hero: {
      script: "खेत से थाली तक",
      eyebrowLeft: "स्थापना 2021",
      eyebrowRight: "सिक्किम · भारत",
      titleLead: "हिमालय की",
      titleItalic1: "फसल,",
      titleMid: "अब छह बाज़ारों के लिए",
      titleItalic2: "व्यापार‑तैयार",
      titleTail: "।",
      metaLabel: "आज की तरलता"
    },
    heritage: { chapter: "अध्याय" },
    closing: { script: "हमारे खेतों से, आपकी मेज़ तक" }
  },
  ne: {
    ticker: { live: "प्रत्यक्ष" },
    hero: {
      script: "उत्पत्तिदेखि थालीसम्म",
      eyebrowLeft: "स्थापना २०२१",
      eyebrowRight: "सिक्किम · भारत",
      titleLead: "हिमाली",
      titleItalic1: "फसल,",
      titleMid: "अब छ बजारका लागि",
      titleItalic2: "व्यापारयोग्य",
      titleTail: "।",
      metaLabel: "आजको तरलता"
    },
    heritage: { chapter: "अध्याय" },
    closing: { script: "हाम्रा खेतदेखि, तपाईंकोमा" }
  },
  ar: {
    ticker: { live: "مباشر" },
    hero: {
      script: "من المزرعة إلى المائدة",
      eyebrowLeft: "تأسست 2021",
      eyebrowRight: "سيكيم · الهند",
      titleLead: "حصاد",
      titleItalic1: "الهيمالايا",
      titleMid: "جاهز الآن للتداول في",
      titleItalic2: "ست أسواق",
      titleTail: ".",
      metaLabel: "سيولة اليوم"
    },
    heritage: { chapter: "الفصل" },
    closing: { script: "من حقولنا إلى موائدكم" }
  },
  dz: {
    ticker: { live: "ཐད་ཀར" },
    hero: {
      script: "ས་ཞིང་ནས་གཞོང་བར",
      eyebrowLeft: "གསར་འཛུགས་ ༢༠༢༡",
      eyebrowRight: "སིཀིམ · རྒྱ་གར",
      titleLead: "ཧི་མཱ་ལ་ཡའི་",
      titleItalic1: "ལོ་ཐོག་",
      titleMid: "ད་ཆ་ཁྲོམ་ར་དྲུག་གི་ཆེད་དུ་",
      titleItalic2: "ཚོང་འགྲིག་ཡོད",
      titleTail: "།",
      metaLabel: "དེ་རིང་གི་ཚོང་འགུལ"
    },
    heritage: { chapter: "ལེའུ" },
    closing: { script: "ང་ཚོའི་ས་ཞིང་ནས་ཁྱེད་ཀྱི་གཞོང་བར" }
  }
};

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] ??= {};
      deepMerge(target[k], v);
    } else if (target[k] === undefined) {
      target[k] = v;
    }
  }
  return target;
}

for (const [locale, extras] of Object.entries(EXTRAS)) {
  const path = join(ROOT, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  data.landing ??= {};
  deepMerge(data.landing, extras);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ ${locale}.json updated`);
}
