"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * Compact pagination control for admin list pages.
 * Shows Prev / page indicator / Next and optional total summary.
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !total) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const rangeStart = total && limit ? (page - 1) * limit + 1 : null;
  const rangeEnd = total && limit ? Math.min(page * limit, total) : null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 text-sm text-stone-600",
        className
      )}
    >
      <div className="text-xs text-stone-500 tabular-nums">
        {rangeStart && rangeEnd && total !== undefined ? (
          <>
            Showing <span className="font-semibold text-stone-800">{rangeStart}</span>–
            <span className="font-semibold text-stone-800">{rangeEnd}</span> of{" "}
            <span className="font-semibold text-stone-800">{total}</span>
          </>
        ) : (
          <>
            Page <span className="font-semibold text-stone-800">{page}</span> of{" "}
            <span className="font-semibold text-stone-800">{totalPages || 1}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(page - 1)}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-colors",
            canPrev
              ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              : "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <span className="inline-flex h-8 min-w-12 items-center justify-center rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold tabular-nums text-stone-800">
          {page} / {totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(page + 1)}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-colors",
            canNext
              ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              : "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
          )}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;

