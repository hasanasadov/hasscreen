// app/api/rtc/_store.ts
export const runtime = "nodejs";

export type RoomState = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  offerCandidates: RTCIceCandidateInit[];
  answerCandidates: RTCIceCandidateInit[];
  stopped: boolean; // only true when presenter explicitly stops
  updatedAt: number;
  revision: number; // optional helper if you want to debug
};

const g = globalThis as unknown as { __RTC_ROOMS__?: Map<string, RoomState> };

if (!g.__RTC_ROOMS__) g.__RTC_ROOMS__ = new Map<string, RoomState>();
export const ROOMS: Map<string, RoomState> = g.__RTC_ROOMS__!;

export function getRoom(room: string): RoomState {
  let r = ROOMS.get(room);
  if (!r) {
    r = {
      offerCandidates: [],
      answerCandidates: [],
      stopped: false,
      updatedAt: Date.now(),
      revision: 0,
    };
    ROOMS.set(room, r);
  }
  return r;
}
