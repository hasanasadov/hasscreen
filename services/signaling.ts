// /services/signaling.ts
export type OfferResp   = { sdp: RTCSessionDescriptionInit | null; stopped?: boolean; revision?: number };
export type AnswerResp  = { sdp: RTCSessionDescriptionInit | null; revision?: number };
export type CandidateResp = { items: RTCIceCandidateInit[]; next: number };

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json() as Promise<T>;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

export const signaling = {
  // SDP
  getOffer:   (room: string) => getJSON<OfferResp>(`/api/rtc/offer?room=${encodeURIComponent(room)}`),
  postOffer:  (room: string, sdp: RTCSessionDescriptionInit) => postJSON(`/api/rtc/offer`, { room, sdp }),
  getAnswer:  (room: string) => getJSON<AnswerResp>(`/api/rtc/answer?room=${encodeURIComponent(room)}`),
  postAnswer: (room: string, sdp: RTCSessionDescriptionInit) => postJSON(`/api/rtc/answer`, { room, sdp }),

  // ICE
  postCandidate: (room: string, side: "offer" | "answer", candidate: RTCIceCandidateInit) =>
    postJSON(`/api/rtc/candidate`, { room, side, candidate }),
  getCandidates: (room: string, side: "offer" | "answer", since: number) =>
    getJSON<CandidateResp>(`/api/rtc/candidate?room=${encodeURIComponent(room)}&side=${side}&since=${since}`),

  // end
  close: (room: string) => postJSON(`/api/rtc/close`, { room }),
};
