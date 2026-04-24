import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist on Krishibridge.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-linen px-4 text-center text-sage-900">
      <div className="max-w-md">
        <p className="text-sm font-medium uppercase tracking-widest text-terracotta">404</p>
        <h1 className="font-heading mt-3 text-4xl font-semibold sm:text-5xl">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-sage-700">
          The link you followed may be broken, or the page may have moved. Head back to the
          homepage or browse the marketplace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-sage-900 px-5 py-3 text-sm font-medium text-white hover:bg-sage-800"
          >
            Back to home
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center rounded-full border border-sage-300 bg-white px-5 py-3 text-sm font-medium text-sage-900 hover:bg-sage-50"
          >
            Explore marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}

