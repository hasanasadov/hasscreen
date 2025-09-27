import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-[36rem] h-[36rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse [animation-duration:6s]" />
      </div>

      <div className="w-full max-w-2xl rounded-3xl p-8 backdrop-blur-2xl bg-white/[0.06] border-2 border-white/10 shadow-[0_20px_80px_-20px_rgba(0,0,0,.65)]">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
          Simple Screen Share
        </h1>
        <p className="text-white/70 mt-3">
          8 rəqəmli kodu paylaş → biri <b>Start sharing</b>, digəri <b>Join to view</b> etsin.
        </p>
        <Link
          href="/screenshare"
          className="inline-flex items-center mt-6 px-5 py-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 transition shadow-[0_15px_40px_-12px_rgba(99,102,241,.6)]"
        >
          Aç →
        </Link>
      </div>
    </main>
  );
}
