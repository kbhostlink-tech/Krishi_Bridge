import { AuthProvider } from "@/lib/auth-context";
import { Globe, Leaf, Shield } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex bg-sand">
        {/* Left decorative side */}
        <div className="hidden lg:flex lg:w-1/2 bg-sage-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sage-900/90 via-sage-700 to-sage-500/80" />
          {/* Mountain silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10">
            <svg viewBox="0 0 600 140" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 140 L0 80 L90 20 L180 65 L250 10 L320 55 L400 5 L470 40 L540 15 L600 35 L600 140 Z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white rounded-2xl p-2">
                <BrandLogo size={40} priority />
              </div>
            </div>
            <p className="font-script text-2xl text-sage-200 mb-3">Welcome to</p>
            <h1 className="font-heading text-4xl xl:text-5xl font-bold mb-5 leading-tight">
              Verified Himalayan<br />commodities. Tokenised trade.
            </h1>
            <p className="text-sage-200 text-base leading-relaxed max-w-md">
              A cross-border digital exchange connecting farmers, cooperatives, and importers
              through transparent, secure, and efficient commodity trading.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl">
                <Globe className="w-5 h-5 text-sage-200" strokeWidth={1.5} />
                <span className="text-2xl font-heading font-bold leading-none">6</span>
                <span className="text-sage-200 text-xs">Countries</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl">
                <Leaf className="w-5 h-5 text-sage-200" strokeWidth={1.5} />
                <span className="text-2xl font-heading font-bold leading-none">10+</span>
                <span className="text-sage-200 text-xs">Commodities</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl">
                <Shield className="w-5 h-5 text-sage-200" strokeWidth={1.5} />
                <span className="text-2xl font-heading font-bold leading-none">100%</span>
                <span className="text-sage-200 text-xs">Verified</span>
              </div>
            </div>
          </div>
          {/* Organic shapes */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-sage-500/20 blur-3xl" />
          <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full bg-sage-300/10 blur-2xl" />
        </div>

        {/* Right content side */}
        <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md py-6 sm:py-0">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
