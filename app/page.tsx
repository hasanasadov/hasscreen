// app/page.tsx
import { Glows, NoiseAndGrid, Orbs, Ribbons } from "@/components/ForBackground";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl items-center justify-center px-4">
      <Glows />
      <Ribbons />
      <NoiseAndGrid />
      <section className="relative w-full">
        <Orbs />
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_30px_120px_-30px_rgba(0,0,0,.65)]">
          <h1 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent text-[clamp(30px,6vw,56px)] font-semibold leading-tight tracking-tight">
            Simple Screen&nbsp;Share
          </h1>

          <p className="mt-3 max-w-prose text-sm sm:text-base text-white/70">
            8 rəqəmli kodla dərhal paylaş. Heç bir qeydiyyat, link və s. yoxdur.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/screenshare"
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-[0_15px_40px_-12px_rgba(99,102,241,.6)] transition-colors hover:from-indigo-400 hover:to-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/50"
              aria-label="Screenshare səhifəsinə keç"
            >
              Başla
              <span className="pointer-events-none absolute inset-0 rounded-2xl btn-shimmer opacity-0 transition-opacity duration-300 group-hover:opacity-40 motion-safe:animate-shimmer" />
              <svg
                className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <span className="text-[11px] sm:text-xs text-white/55">
              HTTPS + STUN/TURN ilə stabil bağlantı
            </span>
          </div>

          {/* inner ring */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10"
          />
        </div>
      </section>
    </main>
  );
}
