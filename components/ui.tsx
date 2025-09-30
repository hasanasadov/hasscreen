"use client";
import * as React from "react";
import { glass } from "@/lib/helpers";

function cx(...cls: (string | undefined | false)[]) {
  return cls.filter(Boolean).join(" ");
}

export const Card: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className, children }) => (
  <div className={cx(glass.shell, className)}>
    {/* gentle scene glows */}
    <div className="pointer-events-none absolute -top-40 -left-36 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tl from-rose-500/20 via-purple-500/10 to-transparent blur-3xl" />
    {children}
  </div>
);

export const CardBody: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ className, children }) => (
  <div className={cx("p-5 sm:p-6 relative", className)}>{children}</div>
);

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white",
      "bg-white/10 hover:bg-white/20 active:bg-white/25 transition-all backdrop-blur",
      "border border-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,.55)]",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = "Button";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cx(
      "w-full rounded-xl bg-white/8 text-white placeholder:text-white/50",
      "border border-white/10 px-4 py-2.5 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20",
      "shadow-inner shadow-black/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Tag: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <span
    className={cx(
      "inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur",
      className
    )}
  >
    {children}
  </span>
);
