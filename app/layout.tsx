// app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simple Screen Share",
  description: "Elegant glassmorphism screen sharing demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {/* subtle animated blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-[42rem] h-[42rem] rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-[38rem] h-[38rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        </div>
        {children}
      </body>
    </html>
  );
}
