"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className,
}: PageTransitionProps) {
  return (
    <div className={cn("animate-slide-up", className)}>
      {children}
    </div>
  );
}
