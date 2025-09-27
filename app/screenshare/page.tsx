"use client";
import ScreenShareRTC from "@/components/ScreenShareRTC";

export default function Page() {
  return (
    <main className="min-h-screen p-6 bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(99,102,241,.18),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(236,72,153,.14),transparent)] bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 grid place-items-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
            Simple Screen Share
          </h1>
          <p className="mt-2 text-white/70 text-sm">Glass • Glow • Animated</p>
        </div>
        <ScreenShareRTC />
      </div>
    </main>
  );
}
