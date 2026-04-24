import Image from "next/image";

interface BrandLogoProps {
  /** Rendered height in px. Width auto-scales using the logo's aspect ratio (~1.55:1). */
  size?: number;
  /** When true, render just the mark (square crop) instead of the full wordmark. */
  markOnly?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Krishibridge brand logo. Uses the canonical logo asset at `/logo.jpeg`.
 *
 * Aspect ratio of the source image is roughly 1.55 (wordmark with bridge).
 * For the compact mark-only variant we render the top portion as a square.
 */
export function BrandLogo({ size = 40, markOnly = false, className, priority }: BrandLogoProps) {
  if (markOnly) {
    // Square mark for favicons / small chrome — shows the leaf + bridge crown.
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-lg bg-white ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.jpeg"
          alt="Krishibridge"
          fill
          sizes={`${size}px`}
          className="object-cover object-top scale-[1.45]"
          priority={priority}
        />
      </span>
    );
  }

  // Full wordmark
  const width = Math.round(size * 1.55);
  return (
    <Image
      src="/logo.jpeg"
      alt="Krishibridge"
      width={width}
      height={size}
      className={`h-auto w-auto object-contain ${className ?? ""}`}
      style={{ height: size, width: "auto" }}
      priority={priority}
    />
  );
}

export default BrandLogo;
