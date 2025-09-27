"use client";
import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
      {children}
    </div>
  );
}
export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>;
}
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-xl bg-indigo-500/90 text-white hover:bg-indigo-500 transition shadow " +
        (props.className || "")
      }
    />
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full px-4 py-2 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 outline-none focus:border-indigo-400 transition " +
        (props.className || "")
      }
    />
  );
}
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/10 text-slate-200 border border-white/10">
      {children}
    </span>
  );
}
