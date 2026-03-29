import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex bg-sand">
        {/* Left decorative side */}
        <div className="hidden lg:flex lg:w-1/2 bg-sage-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sage-900/90 via-sage-700 to-sage-500/80" />
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <p className="font-script text-2xl text-sage-100 mb-2">Welcome to</p>
            <h1 className="font-heading text-5xl font-bold mb-4">AgriExchange</h1>
            <p className="text-sage-200 text-lg leading-relaxed max-w-md">
              The trusted platform connecting farmers, warehouse operators, and
              buyers across South Asia and the Middle East.
            </p>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-heading font-bold">6</span>
                <span className="text-sage-200 text-sm">Countries</span>
              </div>
              <div className="w-px h-12 bg-sage-300/30" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-heading font-bold">10+</span>
                <span className="text-sage-200 text-sm">Commodities</span>
              </div>
              <div className="w-px h-12 bg-sage-300/30" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-heading font-bold">Secure</span>
                <span className="text-sage-200 text-sm">Trading</span>
              </div>
            </div>
          </div>
          {/* Organic shapes */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-sage-500/20 blur-3xl" />
          <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full bg-sage-300/10 blur-2xl" />
        </div>

        {/* Right content side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
