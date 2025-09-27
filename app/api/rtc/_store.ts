// app/api/rtc/_store.ts
export const runtime = "nodejs";

export type RoomState = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  offerCandidates: RTCIceCandidateInit[];
  answerCandidates: RTCIceCandidateInit[];
  updatedAt: number;
};

const g = globalThis as unknown as { __RTC_ROOMS__?: Map<string, RoomState> };

if (!g.__RTC_ROOMS__) g.__RTC_ROOMS__ = new Map<string, RoomState>();
export const ROOMS: Map<string, RoomState> = g.__RTC_ROOMS__!;

export function getRoom(room: string): RoomState {
  let r = ROOMS.get(room);
  if (!r) {
    r = { offerCandidates: [], answerCandidates: [], updatedAt: Date.now() };
    ROOMS.set(room, r);
  }
  return r;
}
