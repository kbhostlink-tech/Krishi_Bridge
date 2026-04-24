"use client";

import React from "react";
import { cn } from "@/lib/utils";

type EmptyVariant =
  | "lots"
  | "bids"
  | "notifications"
  | "rfq"
  | "tokens"
  | "warehouse"
  | "search"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const illustrations: Record<EmptyVariant, React.ReactElement> = {
  lots: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <rect x="20" y="50" width="80" height="50" rx="6" fill="#d4e8dc" />
      <rect x="30" y="40" width="60" height="14" rx="4" fill="#8fb49e" />
      <circle cx="60" cy="35" r="10" fill="#4a7c5c" />
      <path d="M55 35 l3 3 7-7" stroke="#f2faf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="35" y="60" width="22" height="4" rx="2" fill="#8fb49e" />
      <rect x="35" y="68" width="50" height="3" rx="1.5" fill="#d4e8dc" />
      <rect x="35" y="75" width="40" height="3" rx="1.5" fill="#d4e8dc" />
    </svg>
  ),
  bids: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <rect x="20" y="30" width="80" height="65" rx="8" fill="#d4e8dc" />
      <path d="M40 55 h40 M40 67 h30 M40 79 h20" stroke="#8fb49e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="85" cy="35" r="15" fill="#4a7c5c" />
      <path d="M80 35 l3 3 7-7" stroke="#f2faf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <path d="M60 25 C45 25 35 38 35 50 v20 l-8 8 h66 l-8-8 V50 C85 38 75 25 60 25z" fill="#d4e8dc" />
      <circle cx="60" cy="90" r="8" fill="#8fb49e" />
      <circle cx="60" cy="50" r="4" fill="#4a7c5c" />
      <rect x="50" y="58" width="20" height="3" rx="1.5" fill="#8fb49e" />
    </svg>
  ),
  rfq: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <rect x="25" y="20" width="70" height="85" rx="6" fill="#d4e8dc" />
      <rect x="35" y="30" width="30" height="4" rx="2" fill="#4a7c5c" />
      <rect x="35" y="40" width="50" height="3" rx="1.5" fill="#8fb49e" />
      <rect x="35" y="48" width="45" height="3" rx="1.5" fill="#8fb49e" />
      <rect x="35" y="60" width="50" height="25" rx="4" fill="#f2faf6" stroke="#8fb49e" strokeWidth="1.5" />
      <path d="M45 70 h30 M45 77 h20" stroke="#d4e8dc" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="90" r="12" fill="#4a7c5c" />
      <text x="80" y="95" textAnchor="middle" fill="#f2faf6" fontSize="14" fontWeight="bold">?</text>
    </svg>
  ),
  tokens: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <circle cx="60" cy="55" r="30" fill="#d4e8dc" />
      <circle cx="60" cy="55" r="22" fill="#8fb49e" />
      <circle cx="60" cy="55" r="14" fill="#4a7c5c" />
      <text x="60" y="60" textAnchor="middle" fill="#f2faf6" fontSize="14" fontWeight="bold">₹</text>
      <ellipse cx="60" cy="95" rx="25" ry="5" fill="#d4e8dc" opacity="0.5" />
    </svg>
  ),
  warehouse: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <path d="M20 55 L60 25 L100 55 v45 H20 z" fill="#d4e8dc" />
      <rect x="45" y="65" width="30" height="35" rx="3" fill="#8fb49e" />
      <rect x="52" y="72" width="6" height="6" rx="1" fill="#f2faf6" />
      <rect x="62" y="72" width="6" height="6" rx="1" fill="#f2faf6" />
      <rect x="55" y="85" width="10" height="15" rx="2" fill="#4a7c5c" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <circle cx="52" cy="52" r="25" stroke="#8fb49e" strokeWidth="5" fill="#d4e8dc" />
      <line x1="70" y1="70" x2="95" y2="95" stroke="#4a7c5c" strokeWidth="5" strokeLinecap="round" />
      <path d="M42 48 h20 M42 56 h14" stroke="#8fb49e" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  generic: (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28 mx-auto mb-4">
      <rect x="25" y="30" width="70" height="60" rx="8" fill="#d4e8dc" />
      <circle cx="60" cy="55" r="12" fill="#8fb49e" />
      <path d="M60 50 v6 M60 62 v1" stroke="#4a7c5c" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({
  variant = "generic",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in",
        className
      )}
    >
      {illustrations[variant]}
      <h3 className="text-lg font-semibold text-sage-800 font-heading mt-2">
        {title}
      </h3>
      {description && (
        <p className="text-sage-500 text-sm max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

