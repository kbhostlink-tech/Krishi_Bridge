"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TONE_STYLES = {
  olive: {
    strip: "bg-[#506547]",
    value: "text-[#1e2a1d]",
    tint: "bg-[#f3f6ed]",
    border: "border-[#dfe4d2]",
  },
  amber: {
    strip: "bg-[#c08a2b]",
    value: "text-[#3b2a0f]",
    tint: "bg-[#fdf6e7]",
    border: "border-[#ecddb8]",
  },
  slate: {
    strip: "bg-[#55616f]",
    value: "text-[#1f2933]",
    tint: "bg-[#f1f3f6]",
    border: "border-[#d8dde3]",
  },
  teal: {
    strip: "bg-[#2f7d71]",
    value: "text-[#123630]",
    tint: "bg-[#edf6f3]",
    border: "border-[#c9e0d8]",
  },
  rose: {
    strip: "bg-[#a85d56]",
    value: "text-[#3d201d]",
    tint: "bg-[#fbeeec]",
    border: "border-[#ebcfcb]",
  },
} as const;

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border border-[#d9d1c2] bg-white shadow-[0_12px_30px_rgba(40,31,18,0.05)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6d4d]">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-4xl">
            {title}
          </h1>
          {description ? <p className="max-w-3xl text-sm text-stone-600 sm:text-base">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  meta,
  tone = "olive",
  icon: Icon,
  className,
  compact = false,
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone?: keyof typeof TONE_STYLES;
  icon?: React.ElementType;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Surface className={cn("relative overflow-hidden", TONE_STYLES[tone].tint, TONE_STYLES[tone].border, compact ? "p-3" : "p-4", className)}>
      <span className={cn("absolute inset-y-0 left-0 w-1", TONE_STYLES[tone].strip)} />
      <div className={cn(compact ? "space-y-1 pl-2.5" : "space-y-2 pl-3") }>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("font-semibold uppercase tracking-[0.18em] text-stone-500", compact ? "text-[10px]" : "text-[11px]") }>{label}</p>
          {Icon ? <Icon className={cn("text-stone-400", compact ? "h-3.5 w-3.5" : "h-4 w-4")} /> : null}
        </div>
        <p className={cn("font-semibold tracking-[-0.05em]", TONE_STYLES[tone].value, compact ? "text-2xl" : "text-3xl")}>{value}</p>
        {meta ? <p className={cn("text-stone-600", compact ? "text-xs" : "text-sm")}>{meta}</p> : null}
      </div>
    </Surface>
  );
}

export const ACTION_TONES = {
  olive:   { bg: "bg-[#f3f3e6] hover:bg-[#ecedda]", eyebrow: "text-[#506547]", iconBg: "bg-[#e3e6cf]" },
  amber:   { bg: "bg-[#faf1dc] hover:bg-[#f7ebca]", eyebrow: "text-[#8a6418]", iconBg: "bg-[#f2dfa8]" },
  slate:   { bg: "bg-[#edf0f2] hover:bg-[#e3e7eb]", eyebrow: "text-[#4e5b68]", iconBg: "bg-[#d8dee4]" },
  sage:    { bg: "bg-[#e9f0e5] hover:bg-[#deead8]", eyebrow: "text-[#425e3a]", iconBg: "bg-[#d5e2cd]" },
  terra:   { bg: "bg-[#f7e6dc] hover:bg-[#f2ddcd]", eyebrow: "text-[#8f4a3f]", iconBg: "bg-[#efcebd]" },
  teal:    { bg: "bg-[#e1efec] hover:bg-[#d4e9e4]", eyebrow: "text-[#2f6b60]", iconBg: "bg-[#c9e0d9]" },
  sand:    { bg: "bg-[#f5efe0] hover:bg-[#efe7cf]", eyebrow: "text-[#7b6d4d]", iconBg: "bg-[#e8dcbd]" },
  plum:    { bg: "bg-[#efe4ec] hover:bg-[#e7d6e2]", eyebrow: "text-[#6f3e64]", iconBg: "bg-[#e0cedc]" },
} as const;
export type ActionTone = keyof typeof ACTION_TONES;

export function ActionCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  openLabel = "Open →",
  className,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  openLabel?: string;
  className?: string;
  tone?: ActionTone;
}) {
  const t = tone ? ACTION_TONES[tone] : null;
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-[#e1d8c4] p-4 shadow-[0_10px_24px_rgba(40,31,18,0.04)] transition-colors",
        t ? t.bg : "bg-white hover:bg-[#fcfaf4]",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", t ? t.eyebrow : "text-[#7b6d4d]")}>{eyebrow}</p>
          {Icon ? (
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t ? t.iconBg : "bg-[#f1eadb]")}>
              <Icon className={cn("h-4 w-4", t ? t.eyebrow : "text-[#7b6d4d]")} />
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-base font-semibold text-stone-950">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}
        </div>
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform group-hover:translate-x-1", t ? t.eyebrow : "text-[#405742]")}>
          {openLabel}
        </p>
      </div>
    </Link>
  );
}

export type ChartDatum = {
  label: string;
  value: number;
  fill?: string;
};

export function StatusBarChart({
  title,
  description,
  data,
  className,
}: {
  title: string;
  description?: string;
  data: ChartDatum[];
  className?: string;
}) {
  return (
    <Surface className={cn("p-4 sm:p-5", className)}>
      <div className="mb-4 space-y-1">
        <p className="text-sm font-semibold text-stone-950">{title}</p>
        {description ? <p className="text-sm text-stone-600">{description}</p> : null}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#ece4d6" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tickLine={false}
              tick={{ fill: "#6b6253", fontSize: 12 }}
            />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} tick={{ fill: "#6b6253", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "rgba(192, 179, 154, 0.16)" }}
              contentStyle={{
                borderRadius: 0,
                border: "1px solid #d9d1c2",
                background: "#fffdf8",
                boxShadow: "0 10px 30px rgba(40,31,18,0.08)",
              }}
            />
            <Bar dataKey="value" radius={[0, 0, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill || "#506547"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}