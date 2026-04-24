"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const ROLE_MEDIA: Record<string, { src: string; label: string; tint: string }> = {
  FARMER: {
    src: "/farmer.png",
    label: "Farmer",
    tint: "border-[#d8c391] bg-[#fff8e7]",
  },
  AGGREGATOR: {
    src: "/trader.png",
    label: "Aggregator",
    tint: "border-[#cdbf9e] bg-[#f8f3e7]",
  },
  BUYER: {
    src: "/buyer.png",
    label: "Buyer",
    tint: "border-[#c8d2ba] bg-[#f3f8ef]",
  },
};

const SIZE_MAP = {
  sm: {
    frame: "h-10 w-10",
    image: 24,
    text: "text-xs",
    meta: "text-[10px]",
  },
  md: {
    frame: "h-12 w-12",
    image: 30,
    text: "text-sm",
    meta: "text-[11px]",
  },
  lg: {
    frame: "h-14 w-14",
    image: 38,
    text: "text-base",
    meta: "text-xs",
  },
} as const;

export function getRoleLabel(role?: string | null) {
  if (!role) return "Account";
  return ROLE_MEDIA[role]?.label || `${role.charAt(0)}${role.slice(1).toLowerCase()}`;
}

export function RoleMark({
  role,
  size = "md",
  className,
  showLabel = false,
  meta,
}: {
  role?: string | null;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  showLabel?: boolean;
  meta?: string;
}) {
  const config = role ? ROLE_MEDIA[role] : undefined;
  const scale = SIZE_MAP[size];

  const mark = (
    <div
      className={cn(
        "grid place-items-center border shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        scale.frame,
        config?.tint || "border-[#d7d0c0] bg-[#f4efe4]",
        className
      )}
    >
      {config ? (
        <Image
          src={config.src}
          alt={config.label}
          width={scale.image}
          height={scale.image}
          className="object-contain"
        />
      ) : (
        <span className="text-sm font-semibold text-stone-700">
          {role?.charAt(0).toUpperCase() || "A"}
        </span>
      )}
    </div>
  );

  if (!showLabel) {
    return mark;
  }

  return (
    <div className="flex items-center gap-3">
      {mark}
      <div className="min-w-0">
        <p className={cn("font-semibold text-stone-900", scale.text)}>{getRoleLabel(role)}</p>
        {meta ? <p className={cn("text-stone-500", scale.meta)}>{meta}</p> : null}
      </div>
    </div>
  );
}