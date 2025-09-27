// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-2xl rounded-2xl p-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Simple Screen Share
        </h1>
        <p className="text-slate-300 mt-3">
          8 rəqəmli kodu paylaş → biri **Start sharing**, digəri **Join to
          view** etsin.
        </p>
        <Link
          href="/screenshare"
          className="inline-flex items-center mt-6 px-5 py-3 rounded-xl bg-indigo-500/90 text-white hover:bg-indigo-500 transition shadow-lg"
        >
          Aç →
        </Link>
      </div>
    </main>
  );
}
