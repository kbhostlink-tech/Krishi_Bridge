"use client";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in",
        className
      )}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        className="w-28 h-28 mx-auto mb-4"
      >
        <circle cx="60" cy="55" r="35" fill="#fde8e1" />
        <circle cx="60" cy="55" r="25" fill="#f5c6b3" />
        <path
          d="M50 45 l20 20 M70 45 l-20 20"
          stroke="#c4724e"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <ellipse cx="60" cy="98" rx="20" ry="4" fill="#f5c6b3" opacity="0.4" />
      </svg>

      <h3 className="text-lg font-semibold text-sage-800 font-heading mt-2">
        {title}
      </h3>
      <p className="text-sage-500 text-sm max-w-sm mt-1.5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-6 py-2.5 bg-sage-700 hover:bg-sage-800 text-white text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

