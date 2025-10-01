// app/layout.tsx
import {
  BackdropLayers,
  Beams,
  FaintGrid,
  Noise,
} from "@/components/ForBackground";
import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simple Screen Share",
  description: "Elegant, minimal, glassmorphism screen sharing",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az" className="scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-white antialiased selection:bg-indigo-500/30 selection:text-white">
        <BackdropLayers />
        <Beams />
        <Noise />
        <FaintGrid />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

const Header = () => {
  return (
    <header className="sticky top-4 z-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,.5)]">
          <nav className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center  overflow-hidden">
                <img src="/logo.jpg" alt="Logo" />
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/80">
                HasScreen
              </span>
            </div>
            <div className="flex flex-row items-center text-xs sm:text-sm text-white/70 space-x-1">
              <div>
                <a href="https://www.github.com/hasanasadd/hasscreen">
                  Code on{" "}
                  <span className="text-xs sm:text-sm hover:underline font-semibold tracking-wide text-white/80">
                    GitHub
                  </span>
                </a>
              </div>
              <div>
                <a href="https://www.asadov.site">
                  by{" "}
                  <span className="text-xs sm:text-sm hover:underline font-semibold tracking-wide text-white/80">
                    asadov.site
                  </span>
                </a>
              </div>
            </div>

            <span className="hidden sm:block text-[11px] text-white/60">
              Minimal · Smooth · Private
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
};
const Footer = () => {
  return (
    <footer className="relative z-10 mt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} HasScreen - Built by{" "}
          <a
            href="https://asadov.site"
            className="font-medium text-white/70 underline"
          >
            asadov.site
          </a>
        </div>
      </div>
    </footer>
  );
};
