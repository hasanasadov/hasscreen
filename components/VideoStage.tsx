import { cx, glass, tintBackdrop, tintChip } from "@/lib/helpers";
import { Role, Tint } from "@/types";

export function VideoStage({
  refEl,
  role,
  tint,
  showLoading,
  showStoppedOverlay,
}: {
  refEl: React.RefObject<HTMLVideoElement>;
  role: Role | null;
  tint: Tint;
  showLoading: boolean;
  showStoppedOverlay: boolean;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br",
        tintBackdrop(tint),
        glass.ring
      )}
    >
      {/* floating status */}
      <div className="absolute left-4 top-4">
        <span className={tintChip(tint)}>
          {tint === "connected"
            ? "Connected"
            : tint === "paused"
            ? "Paused"
            : tint === "alone"
            ? "Waiting…"
            : tint === "stopped"
            ? "Stopped"
            : "Idle"}
        </span>
      </div>

      {/* soft top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />

      <video
        ref={refEl}
        autoPlay
        playsInline
        muted={role === "presenter"}
        className="w-full aspect-video sm:max-h-[74vh] h-[46vh] object-contain bg-black"
        preload="auto"
      />

      {/* loading */}
      {showLoading && (
        <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-white/25 border-t-white animate-spin" />
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-medium shadow-2xl">
              Connecting…
            </div>
          </div>
        </div>
      )}

      {/* stopped overlay */}
      {showStoppedOverlay && role === "viewer" && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-base font-semibold shadow-2xl">
            Presenter stopped sharing
          </div>
        </div>
      )}

      {/* outer glow */}
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] ring-1 ring-white/10" />
    </div>
  );
}
