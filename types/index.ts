export type Role = "presenter" | "viewer";
export type Mode = "mirror" | "extend";

export type OfferResp  = { sdp: RTCSessionDescriptionInit | null; stopped?: boolean; revision?: number };
export type AnswerResp = { sdp: RTCSessionDescriptionInit | null; revision?: number };
export type CandidateResp = { items: RTCIceCandidateInit[]; next: number };

export type Tint = "idle" | "alone" | "connected" | "paused" | "stopped";

/** PiP local-only types */
export type PiPVideo = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
  webkitSetPresentationMode?: (mode: "picture-in-picture" | "inline" | "fullscreen") => void;
  webkitPresentationMode?: "picture-in-picture" | "inline" | "fullscreen";
};
export type PiPDocument = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};