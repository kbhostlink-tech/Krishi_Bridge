"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Brand intro splash shown once per browser session before the website appears.
 * Plays a ~3s animation: logo bloom + brand name + tagline + bridge spans.
 */
export function BrandIntroSplash() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const seen = window.sessionStorage.getItem("kb_intro_seen");
      if (!seen) {
        setShow(true);
        window.sessionStorage.setItem("kb_intro_seen", "1");
      }
    } catch {
      // sessionStorage may be unavailable — show splash anyway
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => setDone(true), 3300);
    return () => window.clearTimeout(id);
  }, [show]);

  if (!mounted || !show || done) return null;

  return (
    <div
      aria-hidden
      className="kb-splash-fade-out fixed inset-0 z-9999 flex items-center justify-center bg-linear-to-br from-sage-900 via-sage-800 to-sage-700 overflow-hidden"
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-radial from-sage-500/30 via-transparent to-transparent" />

      {/* Pulsing rings */}
      <span className="absolute w-72 h-72 rounded-full border border-white/20 kb-splash-ring" />
      <span
        className="absolute w-72 h-72 rounded-full border border-terracotta/30 kb-splash-ring"
        style={{ animationDelay: "0.6s" }}
      />

      {/* Floating leaf accents */}
      <span className="kb-splash-leaf absolute top-[18%] left-[14%] text-3xl sm:text-4xl">🌿</span>
      <span
        className="kb-splash-leaf absolute bottom-[18%] right-[14%] text-3xl sm:text-4xl"
        style={{ animationDelay: "0.5s" }}
      >
        🌾
      </span>

      <div className="relative flex flex-col items-center text-center px-6">
        {/* Logo bloom */}
        <div className="kb-splash-logo-in relative mb-5 sm:mb-6">
          <span className="absolute inset-0 rounded-3xl bg-white/20 blur-2xl" />
          <div className="relative bg-white rounded-3xl p-4 sm:p-5 shadow-2xl">
            <Image
              src="/logo.png"
              alt="Krishibridge"
              width={92}
              height={92}
              priority
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </div>
        </div>

        {/* Wordmark */}
        <h1 className="kb-splash-text-in font-sans text-white text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-lg">
          Krishibridge
        </h1>

        {/* Animated bridge line */}
        <div className="kb-splash-line mt-4 h-0.75 w-40 sm:w-56 bg-linear-to-r from-transparent via-terracotta to-transparent rounded-full" />

        {/* Tagline */}
        <p
          className="kb-splash-text-in mt-4 text-sage-100 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]"
          style={{ animationDelay: "1.3s" }}
        >
          Bridging Himalayan harvests
        </p>
        <p
          className="kb-splash-text-in mt-1.5 text-sage-200/80 text-[11px] sm:text-xs font-medium"
          style={{ animationDelay: "1.5s" }}
        >
          Verified · Tokenised · Cross-border
        </p>
      </div>
    </div>
  );
}

export default BrandIntroSplash;
