"use client";
import ScreenShareRTC from "@/components/ScreenShareRTC";

export default function Page() {
  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-3xl">
        <ScreenShareRTC />
      </div>
    </main>
  );
}
