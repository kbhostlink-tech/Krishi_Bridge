"use client";

import { useState, useEffect, useRef } from "react";

interface AuctionCountdownProps {
  endsAt: string | null;
  onEnd?: () => void;
  className?: string;
}

/**
 * Live countdown timer for auctions. Updates every second.
 * Shows days/hours/minutes/seconds breakdown.
 */
export function AuctionCountdown({ endsAt, onEnd, className = "" }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number; total: number;
  } | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!endsAt) return;

    const endTime = new Date(endsAt).getTime();

    function updateTimer() {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (!endedRef.current) {
          endedRef.current = true;
          onEnd?.();
        }
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onEnd]);

  if (!endsAt || !timeLeft) {
    return null;
  }

  const isUrgent = timeLeft.total > 0 && timeLeft.total <= 5 * 60 * 1000; // last 5 minutes
  const isEnded = timeLeft.total <= 0;

  if (isEnded) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm font-medium text-red-600">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`flex items-center justify-center gap-1 ${isUrgent ? "animate-pulse" : ""}`}>
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="d" urgent={isUrgent} />
        )}
        <TimeUnit value={timeLeft.hours} label="h" urgent={isUrgent} />
        <span className={`text-lg font-bold ${isUrgent ? "text-red-500" : "text-sage-400"}`}>:</span>
        <TimeUnit value={timeLeft.minutes} label="m" urgent={isUrgent} />
        <span className={`text-lg font-bold ${isUrgent ? "text-red-500" : "text-sage-400"}`}>:</span>
        <TimeUnit value={timeLeft.seconds} label="s" urgent={isUrgent} />
      </div>
    </div>
  );
}

function TimeUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className={`flex items-baseline gap-0.5 px-2 py-1 rounded-xl ${
      urgent ? "bg-red-50" : "bg-sage-50"
    }`}>
      <span className={`font-heading text-xl font-bold tabular-nums ${
        urgent ? "text-red-600" : "text-sage-900"
      }`}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={`text-[10px] font-medium ${
        urgent ? "text-red-400" : "text-sage-400"
      }`}>
        {label}
      </span>
    </div>
  );
}
