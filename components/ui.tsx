"use client";
import * as React from "react";
import { motion } from "framer-motion";

function cx(...cls: (string | undefined | false)[]) {
  return cls.filter(Boolean).join(" ");
}

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className={cx(
      "relative rounded-3xl border-2 border-white/10 bg-white/[0.06] backdrop-blur-2xl",
      "shadow-[0_20px_80px_-20px_rgba(0,0,0,.65)]",
      className
    )}
  >
    {/* glossy corner highlight */}
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] [mask-image:radial-gradient(1200px_500px_at_-10%_-10%,black,transparent)]">
      <div className="absolute -top-10 -left-10 w-[26rem] h-[26rem] rounded-full bg-white/10 blur-3xl" />
    </div>
    {children}
  </motion.div>
);

export const CardBody: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cx("p-5 sm:p-6", className)}>{children}</div>
);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-semibold",
        "bg-gradient-to-br from-indigo-500 to-violet-500 text-white",
        "hover:from-indigo-400 hover:to-violet-400",
        "shadow-[0_15px_40px_-12px_rgba(99,102,241,.6)]",
        "transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cx(
        "w-full rounded-2xl bg-white/10 text-white placeholder:text-white/50",
        "border border-white/10 px-4 py-2.5 backdrop-blur-md",
        "focus:outline-none focus:ring-2 focus:ring-indigo-300/50",
        "shadow-inner shadow-black/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span
    className={cx(
      "inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur",
      className
    )}
  >
    {children}
  </span>
);
