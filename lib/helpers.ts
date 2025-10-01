import { Tint } from "@/types";

export const glass = {
  shell:
    "relative rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_120px_-40px_rgba(0,0,0,.7)]",
  panel:
    "rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,.6)]",
  chip: "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-semibold backdrop-blur",
  ring: "ring-1 ring-white/10",
};

export function tintChip(t: Tint) {
  switch (t) {
    case "connected":
      return `${glass.chip} border-emerald-400/40 bg-emerald-300/10 text-emerald-100`;
    case "paused":
      return `${glass.chip} border-amber-400/40 bg-amber-300/10 text-amber-100`;
    case "alone":
      return `${glass.chip} border-sky-400/40 bg-sky-300/10 text-sky-100`;
    case "stopped":
      return `${glass.chip} border-rose-400/40 bg-rose-300/10 text-rose-100`;
    default:
      return `${glass.chip} border-white/20 bg-white/10 text-white/90`;
  }
}
export function tintBackdrop(t: Tint) {
  switch (t) {
    case "connected":
      return "from-emerald-400/12 via-transparent to-transparent";
    case "paused":
      return "from-amber-400/12 via-transparent to-transparent";
    case "alone":
      return "from-sky-400/12 via-transparent to-transparent";
    case "stopped":
      return "from-rose-400/12 via-transparent to-transparent";
    default:
      return "from-white/10 via-transparent to-transparent";
  }
}

export const cx = (...cls: (string | undefined | false)[]) =>
  cls.filter(Boolean).join(" ");
export const generateRoomCode = () =>
  Math.floor(10_000_000 + Math.random() * 89_999_999).toString();

export function candidateInitFrom(c: RTCIceCandidate): RTCIceCandidateInit {
  const maybe = c as RTCIceCandidate & { toJSON?: () => RTCIceCandidateInit };
  try {
    if (maybe.toJSON) return maybe.toJSON();
  } catch {}
  const ufrag =
    (c as unknown as { usernameFragment?: string | null }).usernameFragment ??
    undefined;
  return {
    candidate: c.candidate,
    sdpMid: c.sdpMid ?? undefined,
    sdpMLineIndex: c.sdpMLineIndex ?? undefined,
    usernameFragment: ufrag,
  };
}
export function isDomException(e: unknown): e is DOMException {
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    typeof (e as { name: unknown }).name === "string"
  );
}
