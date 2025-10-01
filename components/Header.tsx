import { Mode, Role, Tint } from "@/types";
import { Tag } from "./ui";
import { tintChip } from "@/lib/helpers";

export function Header({
  role,
  status,
  mode,
  tint,
}: {
  role: Role | null;
  status: string;
  mode: string | Mode;
  tint: Tint;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/60">
          Simple Screen Share (SSS)
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Private • Simple • Minimal
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag>Role: {role ?? "-"}</Tag>
        <span className={tintChip(tint)}>Status: {status}</span>
        <Tag>Mode: {mode}</Tag>
      </div>
    </div>
  );
}
