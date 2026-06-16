type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function text(value: string, marks?: TipTapNode["marks"]): TipTapNode {
  return marks ? { type: "text", text: value, marks } : { type: "text", text: value };
}

function link(href: string, label: string): TipTapNode {
  return text(label, [{ type: "link", attrs: { href, target: "_self" } }]);
}

function paragraph(...nodes: TipTapNode[]): TipTapNode {
  return { type: "paragraph", content: nodes };
}

function heading(level: 2 | 3, value: string): TipTapNode {
  return { type: "heading", attrs: { level }, content: [text(value)] };
}

function bulletList(items: string[]): TipTapNode {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(text(item))],
    })),
  };
}

function image(src: string, alt: string): TipTapNode {
  return { type: "image", attrs: { src, alt, title: alt } };
}

function doc(...nodes: TipTapNode[]): Record<string, unknown> {
  return { type: "doc", content: nodes };
}

const IMG = {
  cardamom: "/blog/himalayan-black-cardamom-trade.png",
  orthodox: "/blog/orthodox-tea-himalayan-corridor.png",
  blackTea: "/blog/specialty-black-tea-golden-tips.png",
} as const;

export type SeoBlogPostSeed = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: Record<string, unknown>;
  publishedDaysAgo: number;
};

export const SEO_BLOG_POSTS: SeoBlogPostSeed[] = [
  {
    slug: "himalayan-black-cardamom-verified-trade-guide",
    title: "Himalayan Black Cardamom: A Practical Guide to Verified Trade",
    excerpt:
      "How large cardamom moves from Sikkim, Nepal, and Bhutan to export markets — and what buyers should verify before placing orders on a digital commodity platform.",
    coverImage: IMG.cardamom,
    publishedDaysAgo: 18,
    content: doc(
      paragraph(
        text(
          "Large black cardamom remains one of the most origin-sensitive spices traded across the eastern Himalayas. Buyers sourcing from "
        ),
        text("Sikkim, Nepal, and Bhutan", [{ type: "bold" }]),
        text(
          " need more than a photograph and a price quote — they need proof of grade, moisture, warehouse handling, and seller identity before money moves."
        )
      ),
      image(IMG.cardamom, "Himalayan black cardamom pods prepared for trade and grading"),
      heading(2, "Why black cardamom needs a trusted trade layer"),
      paragraph(
        text(
          "Unlike homogenous bulk commodities, black cardamom lots vary by elevation, harvest week, curing method, and post-harvest storage. Importers in India, Nepal, Bhutan, and Gulf buyer markets increasingly ask for "
        ),
        text("documented quality records", [{ type: "bold" }]),
        text(" and settlement workflows that match how physical goods actually move.")
      ),
      bulletList([
        "Capsule size and seed count influence export pricing tiers.",
        "Moisture and foreign matter thresholds differ by buyer specification.",
        "Warehouse receipts and transfer records reduce dispute risk on delivery.",
        "Cross-border settlement needs currency-aware rails, not informal transfers.",
      ]),
      heading(2, "What Krishibridge verifies before a lot goes live"),
      paragraph(
        text("On "),
        link("/marketplace", "Krishibridge marketplace"),
        text(
          ", sellers list with KYC-backed profiles, warehouse references, and grading metadata. Buyers can compare lots transparently, run RFQs, and keep payment records tied to the same trade thread — reducing the friction that slows Himalayan spice exports."
        )
      ),
      heading(3, "Checklist for first-time cardamom buyers"),
      bulletList([
        "Confirm origin region and harvest season on the listing.",
        "Request sample approval before locking a full-container commitment.",
        "Align on moisture and rejection clauses in writing.",
        "Use platform settlement records instead of informal payment trails.",
      ]),
      heading(2, "Building long-term supplier trust"),
      paragraph(
        text("Premium agricultural markets scale only after trust is repeatable. Krishibridge is designed as "),
        link("/about", "neutral trade infrastructure"),
        text(
          " — connecting verified growers, warehouses, and buyers without competing as a principal trader. For cardamom cooperatives and aggregators, that means market access with clearer discovery and fewer opaque intermediaries."
        )
      ),
      paragraph(
        text("Ready to source? "),
        link("/marketplace", "Browse live cardamom and spice listings"),
        text(" or "),
        link("/contact", "contact the Krishibridge team"),
        text(" for onboarding support.")
      )
    ),
  },
  {
    slug: "orthodox-tea-himalayan-corridor-buyer-guide",
    title: "Orthodox Tea from the Himalayan Corridor: What Institutional Buyers Should Know",
    excerpt:
      "From high-altitude gardens to export auction floors — key quality signals, grading language, and digital trade practices for orthodox tea buyers in India, Nepal, and Bhutan.",
    coverImage: IMG.orthodox,
    publishedDaysAgo: 10,
    content: doc(
      paragraph(
        text(
          "Orthodox whole-leaf tea from the Himalayan corridor commands a premium because processing preserves leaf integrity, aroma, and origin character. Yet many buyers still discover lots through fragmented phone networks with limited documentation — a model that breaks down as volumes and compliance requirements grow."
        )
      ),
      image(IMG.orthodox, "Orthodox loose-leaf tea bowls with Himalayan tea gardens in the background"),
      heading(2, "How orthodox tea differs from CTC on the buy side"),
      paragraph(
        text(
          "Orthodox production involves withering, rolling, oxidation, and firing steps that produce wiry or twisted leaves rather than granular crush-tear-curl particles. For buyers, that means "
        ),
        text("grade descriptions, cup profiles, and lot homogeneity", [{ type: "bold" }]),
        text(" matter as much as price per kilogram.")
      ),
      bulletList([
        "Whole-leaf grades (e.g. OP, OPA, STGFOP) signal leaf style and tip content.",
        "Elevation and flush season strongly influence liquor colour and briskness.",
        "Sample evaluation should precede contract awards for specialty lots.",
        "Origin documentation supports food-safety and import paperwork downstream.",
      ]),
      heading(2, "Digital discovery without losing origin context"),
      paragraph(
        text("Krishibridge supports "),
        link("/marketplace", "transparent tea listings"),
        text(
          " with seller verification, quality notes, and trade records in one place. Cooperative sellers in Assam, Darjeeling hills, Nepal, and Bhutan can reach institutional buyers while keeping grading context visible — not buried in chat screenshots."
        )
      ),
      heading(3, "Three questions every tea buyer should ask"),
      bulletList([
        "Is the seller KYC-verified and linked to a traceable warehouse or estate?",
        "Does the listing specify flush, grade, and target cup profile?",
        "Are RFQ responses and counter-offers logged for audit and repeat orders?",
      ]),
      heading(2, "From first sample to repeat procurement"),
      paragraph(
        text(
          "Repeatable procurement depends on consistent records. When buyers and sellers negotiate through structured RFQs, warehouse verification, and settlement workflows, orthodox tea becomes easier to scale across seasons — especially for Gulf and South Asian buyers building long-term supply programs."
        )
      ),
      paragraph(
        text("Explore "),
        link("/marketplace", "tea and commodity listings"),
        text(", read more on our "),
        link("/about", "About page"),
        text(", or "),
        link("/contact", "reach the team"),
        text(" for buyer onboarding.")
      )
    ),
  },
  {
    slug: "specialty-black-tea-grades-quality-signals-buyers",
    title: "Specialty Black Tea Grades: Quality Signals Buyers Use Before They Bid",
    excerpt:
      "Golden tips, leaf twist, and liquor character — a concise guide to evaluating specialty black tea lots on a digital commodity exchange before you commit capital.",
    coverImage: IMG.blackTea,
    publishedDaysAgo: 3,
    content: doc(
      paragraph(
        text(
          "Specialty black tea buyers often decide within minutes whether a lot deserves a sample request or a pass. The visual cues — "
        ),
        text("golden tips, uniform twist, and absence of stalk", [{ type: "bold" }]),
        text(
          " — are the first filter. The second filter is whether the seller, warehouse, and payment path are trustworthy enough to justify logistics cost."
        )
      ),
      image(IMG.blackTea, "Close-up of premium whole-leaf black tea with golden tips"),
      heading(2, "Reading a specialty lot before you bid"),
      paragraph(
        text(
          "High-grade orthodox-style black tea shows a mix of dark twisted leaves and lighter tip material. Buyers watch for consistency within the sample, hay or smoke notes from firing, and whether the stated grade matches the visual presentation."
        )
      ),
      bulletList([
        "Tip percentage correlates with price but must match the declared grade.",
        "Uniform leaf size reduces blending work for packers and exporters.",
        "Clean odour profile suggests proper firing and storage conditions.",
        "Photography should match the delivered lot — platforms help enforce accountability.",
      ]),
      heading(2, "Why documentation beats verbal promises"),
      paragraph(
        text(
          "In origin-sensitive tea markets, disputes often trace back to missing records: who approved the sample, which warehouse released the lot, and when payment was released. A digital exchange model keeps those events on one timeline — critical for "
        ),
        text("Himalayan Commodity Exchange", [{ type: "bold" }]),
        text(" participants scaling beyond informal trade.")
      ),
      heading(3, "Using Krishibridge for specialty tea procurement"),
      paragraph(
        text("Buyers can use "),
        link("/marketplace", "live marketplace listings"),
        text(", issue "),
        text("RFQs", [{ type: "bold" }]),
        text(
          " for custom quantities, and maintain transaction history for compliance and repeat sourcing. Sellers benefit from discovery beyond local broker networks while keeping platform-neutral infrastructure."
        )
      ),
      heading(2, "Next steps for buyers and estates"),
      bulletList([
        "Register a buyer profile with country and currency preferences.",
        "Shortlist verified sellers by origin and grade metadata.",
        "Run a small test order before seasonal volume commitments.",
        "Keep settlement and warehouse records inside the platform workflow.",
      ]),
      paragraph(
        text("Start on the "),
        link("/marketplace", "marketplace"),
        text(" or "),
        link("/contact", "talk to Krishibridge"),
        text(" about estate and cooperative onboarding across India, Nepal, and Bhutan.")
      )
    ),
  },
];
