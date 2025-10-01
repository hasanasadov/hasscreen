"use client";
import { Glows } from "@/components/ForBackground";
import MainComp from "@/components/MainComp";

export default function Page() {
  return (
    <main className="overflow-hidden p-4  text-white min-h-screen">
      <Glows />
      <div className="mx-auto max-w-4xl">
        <MainComp />
      </div>
    </main>
  );
}
