// /utils/webrtc.ts
export type Tint = "idle" | "alone" | "connected" | "paused" | "stopped";

export const generateRoomCode = (): string =>
  Math.floor(10_000_000 + Math.random() * 89_999_999).toString();

export function candidateInitFrom(c: RTCIceCandidate): RTCIceCandidateInit {
  const maybe = c as RTCIceCandidate & { toJSON?: () => RTCIceCandidateInit };
  try { if (maybe.toJSON) return maybe.toJSON(); } catch {}
  const ufrag = (c as unknown as { usernameFragment?: string | null }).usernameFragment ?? undefined;
  return { candidate: c.candidate, sdpMid: c.sdpMid ?? undefined, sdpMLineIndex: c.sdpMLineIndex ?? undefined, usernameFragment: ufrag };
}

export function isDomException(e: unknown): e is DOMException {
  return typeof e === "object" && e !== null && "name" in e && typeof (e as { name: unknown }).name === "string";
}
