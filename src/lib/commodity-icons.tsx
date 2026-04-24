import {
  Leaf,
  Coffee,
  Flower2,
  TreePine,
  Package,
  Sprout,
  type LucideIcon,
} from "lucide-react";

/** PNG asset path in /public for commodities that have a dedicated image */
export const COMMODITY_PNG_MAP: Record<string, string> = {
  LARGE_CARDAMOM: "/Black cardamom.png",
  TEA: "/Orthodox Tea.png",
  OTHER: "/Black Tea.png",
};

/** Lucide icon + color for each commodity type */
export const COMMODITY_ICON_MAP: Record<
  string,
  { Icon: LucideIcon; color: string }
> = {
  LARGE_CARDAMOM: { Icon: Leaf, color: "text-green-600" },
  TEA: { Icon: Leaf, color: "text-emerald-600" },
  GINGER: { Icon: Sprout, color: "text-amber-600" },
  TURMERIC: { Icon: Sprout, color: "text-yellow-600" },
  PEPPER: { Icon: Leaf, color: "text-red-600" },
  COFFEE: { Icon: Coffee, color: "text-amber-800" },
  SAFFRON: { Icon: Flower2, color: "text-purple-600" },
  ARECA_NUT: { Icon: TreePine, color: "text-stone-600" },
  CINNAMON: { Icon: TreePine, color: "text-orange-700" },
  OTHER: { Icon: Package, color: "text-sage-500" },
};

export const COMMODITY_LABELS: Record<string, string> = {
  LARGE_CARDAMOM: "Black Cardamom",
  TEA: "Orthodox Tea",
  OTHER: "Black Tea",
  // Legacy enum values kept for backwards compatibility with existing records
  GINGER: "Ginger",
  TURMERIC: "Turmeric",
  PEPPER: "Pepper",
  COFFEE: "Coffee",
  SAFFRON: "Saffron",
  ARECA_NUT: "Areca Nut",
  CINNAMON: "Cinnamon",
};

/** Inline commodity icon component — uses PNG assets when available, falls back to Lucide icon */
export function CommodityIcon({
  type,
  className = "w-4 h-4",
}: {
  type: string;
  className?: string;
}) {
  const pngSrc = COMMODITY_PNG_MAP[type];
  if (pngSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={pngSrc} alt={COMMODITY_LABELS[type] || type} className={`${className} object-contain inline-block`} />;
  }
  const entry = COMMODITY_ICON_MAP[type] || COMMODITY_ICON_MAP.OTHER;
  const { Icon, color } = entry;
  return <Icon className={`${className} ${color}`} />;
}

