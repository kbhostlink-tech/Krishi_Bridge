import {
  Leaf,
  Coffee,
  Flower2,
  TreePine,
  Package,
  Sprout,
  type LucideIcon,
} from "lucide-react";

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
  LARGE_CARDAMOM: "Large Cardamom",
  TEA: "Tea",
  GINGER: "Ginger",
  TURMERIC: "Turmeric",
  PEPPER: "Pepper",
  COFFEE: "Coffee",
  SAFFRON: "Saffron",
  ARECA_NUT: "Areca Nut",
  CINNAMON: "Cinnamon",
  OTHER: "Other",
};

/** Inline commodity icon component */
export function CommodityIcon({
  type,
  className = "w-4 h-4",
}: {
  type: string;
  className?: string;
}) {
  const entry = COMMODITY_ICON_MAP[type] || COMMODITY_ICON_MAP.OTHER;
  const { Icon, color } = entry;
  return <Icon className={`${className} ${color}`} />;
}
