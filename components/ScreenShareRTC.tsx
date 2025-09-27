"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Tag } from "./ui";

type Role = "presenter" | "viewer";
type Mode = "mirror" | "extend";

type OfferResp = { sdp: RTCSessionDescriptionInit | null; stopped?: boolean; revision?: number };
type AnswerResp = { sdp: RTCSessionDescriptionInit | null; revision?: number };
type CandidateResp = { items: RTCIceCandidateInit[]; next: number };

type Tint = "idle" | "alone" | "connected" | "paused" | "stopped";

/** Lokal PiP tipləri – global interface-ləri artırmırıq */
type PiPVideo = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
  webkitSetPresentationMode?: (mode: "picture-in-picture" | "inline" | "fullscreen") => void;
  webkitPresentationMode?: "picture-in-picture" | "inline" | "fullscreen";
};
type PiPDocument = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};

const generateRoomCode = (): string =>
  Math.floor(10_000_000 + Math.random() * 89_999_999).toString();

/* ---- UI tint helpers ---- */
function tintBox(t: Tint): string {
  switch (t) {
    case "connected": return "ring-emerald-400/60 bg-emerald-500/15";
    case "paused":    return "ring-amber-400/60 bg-amber-500/15";
    case "alone":     return "ring-sky-400/60 bg-sky-500/15";
    case "stopped":   return "ring-rose-400/60 bg-rose-500/15";
    default:          return "ring-white/15 bg-white/5";
  }
}
function tintChip(t: Tint): string {
  switch (t) {
    case "connected": return "bg-emerald-500/20 text-emerald-100 border-emerald-400/40";
    case "paused":    return "bg-amber-500/20 text-amber-100 border-amber-400/40";
    case "alone":     return "bg-sky-500/20 text-sky-100 border-sky-400/40";
    case "stopped":   return "bg-rose-500/20 text-rose-100 border-rose-400/40";
    default:          return "bg-white/10 text-white border-white/20";
  }
}

/* ---- helpers (no any) ---- */
function candidateInitFrom(c: RTCIceCandidate): RTCIceCandidateInit {
  // bəzi brauzerlərdə toJSON var
  const maybe = c as RTCIceCandidate & { toJSON?: () => RTCIceCandidateInit };
  if (typeof maybe.toJSON === "function") {
    try { return maybe.toJSON(); } catch { /* noop */ }
  }
  const ufrag = (c as unknown as { usernameFragment?: string | null }).usernameFragment ?? undefined;
  return {
    candidate: c.candidate,
    sdpMid: c.sdpMid ?? undefined,
    sdpMLineIndex: c.sdpMLineIndex ?? undefined,
    usernameFragment: ufrag,
  };
}
function isDomException(e: unknown): e is DOMException {
  return typeof e === "object" && e !== null && "name" in e && typeof (e as { name: unknown }).name === "string";
}

export default function ScreenShareRTC() {
  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<Mode>("mirror");
  const [room, setRoom] = useState<string>("");
  const roomRef = useRef<string>("");

  const [joined, setJoined] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Idle");
  const [copyOk, setCopyOk] = useState<boolean>(false);

  const [showStoppedOverlay, setShowStoppedOverlay] = useState<boolean>(false);
  const [hasRemote, setHasRemote] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pipOn, setPipOn] = useState<boolean>(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const extendWindowRef = useRef<Window | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const offerCandIdx = useRef<number>(0);
  const answerCandIdx = useRef<number>(0);
  const pollTimers = useRef<number[]>([]);
  const hadRemoteRef = useRef<boolean>(false);
  const lastOfferRevRef = useRef<number | null>(null);

  const rtcConfig = useMemo<RTCConfiguration>(() => ({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  }), []);

  const apiGET = useCallback(async <T,>(url: string): Promise<T> => {
    const r = await fetch(url, { cache: "no-store" });
    return (await r.json()) as T;
  }, []);
  const apiPOST = useCallback(async <TRes, TBody extends object>(url: string, body: TBody): Promise<TRes> => {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as TRes;
  }, []);

  const clearPolling = (): void => { pollTimers.current.forEach((t) => window.clearInterval(t)); pollTimers.current = []; };
  const cleanupExtendWindow = (): void => {
    const win = extendWindowRef.current; if (win && !win.closed) { try { win.close(); } catch {} }
    extendWindowRef.current = null;
  };

  const ensurePC = useCallback(async (): Promise<void> => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const side: "offer" | "answer" = role === "presenter" ? "offer" : "answer";
      void apiPOST("/api/rtc/candidate", { room: roomRef.current, side, candidate: candidateInitFrom(e.candidate) });
    };
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "connected" || s === "completed") setStatus("Connected");
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("Connected");
    };
    pc.ontrack = (e: RTCTrackEvent) => {
      if (role === "viewer" && videoRef.current) {
        const [stream] = e.streams;
        hadRemoteRef.current = true; setHasRemote(true); setShowStoppedOverlay(false);
        const v = videoRef.current; v.srcObject = stream; v.muted = true;
        const tryPlay = () => void v.play().catch(() => {});
        if (v.readyState >= 2) tryPlay(); else v.onloadedmetadata = tryPlay;
      }
    };
  }, [apiPOST, role, rtcConfig]);

  const leave = useCallback(async (): Promise<void> => {
    clearPolling(); cleanupExtendWindow();
    const local = localStreamRef.current; if (local) { local.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    const pc = pcRef.current; if (pc) { try { pc.close(); } catch {} pcRef.current = null; }
    hadRemoteRef.current = false; setHasRemote(false); setJoined(false); setStatus("Left");
    setShowStoppedOverlay(false); setIsStopped(false); setIsPaused(false); setPipOn(false);
    offerCandIdx.current = 0; answerCandIdx.current = 0; lastOfferRevRef.current = null;
  }, []);
  useEffect(() => () => { void leave(); }, [leave]);
  useEffect(() => { roomRef.current = room; }, [room]);

  /* ---- Presenter preview (instant) ---- */
  const attachLocalPreview = useCallback(() => {
    const v = videoRef.current; const s = localStreamRef.current;
    if (!v || !s) return;
    v.muted = true; v.playsInline = true; v.srcObject = s;
    const tryPlay = () => void v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay(); else v.onloadedmetadata = tryPlay;
  }, []);
  useEffect(() => { if (role === "presenter" && joined && localStreamRef.current) attachLocalPreview(); }, [role, joined, attachLocalPreview]);

  /* ---- PiP events (addEventListener) ---- */
  useEffect(() => {
    const v = videoRef.current as PiPVideo | null; if (!v) return;
    const onEnter = () => setPipOn(true);
    const onLeave = () => setPipOn(false);
    const onWebkit = () => setPipOn(v.webkitPresentationMode === "picture-in-picture");
    v.addEventListener("enterpictureinpicture", onEnter as EventListener);
    v.addEventListener("leavepictureinpicture", onLeave as EventListener);
    if (typeof v.webkitSetPresentationMode === "function") {
      v.addEventListener("webkitpresentationmodechanged", onWebkit as EventListener);
    }
    // initial state
    const docPiP = document as PiPDocument;
    if (typeof v.webkitPresentationMode === "string") setPipOn(v.webkitPresentationMode === "picture-in-picture");
    else setPipOn(docPiP.pictureInPictureElement === v);

    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter as EventListener);
      v.removeEventListener("leavepictureinpicture", onLeave as EventListener);
      if (typeof v.webkitSetPresentationMode === "function") {
        v.removeEventListener("webkitpresentationmodechanged", onWebkit as EventListener);
      }
    };
  }, [joined]);

  const isPiPSupported = (): boolean => {
    const v = videoRef.current as PiPVideo | null; const d = document as PiPDocument;
    return !!v && ((typeof v.requestPictureInPicture === "function" && !!d.pictureInPictureEnabled) || typeof v.webkitSetPresentationMode === "function");
  };
  const togglePiP = async (): Promise<void> => {
    const v = videoRef.current as PiPVideo | null; if (!v) return;
    const d = document as PiPDocument;
    try {
      if (typeof v.webkitSetPresentationMode === "function") {
        v.webkitSetPresentationMode!(v.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture");
        return;
      }
      if (d.pictureInPictureElement) await d.exitPictureInPicture?.();
      else if (typeof v.requestPictureInPicture === "function" && d.pictureInPictureEnabled) {
        if (v.readyState < 2) { try { await v.play(); } catch {} }
        await v.requestPictureInPicture();
      }
    } catch { /* noop */ }
  };

  /* ---------------- Presenter: START ---------------- */
  const startAsPresenter = useCallback(async (): Promise<void> => {
    try {
      const r = room || generateRoomCode(); if (!room) setRoom(r);
      roomRef.current = r; answerCandIdx.current = 0; setIsPaused(false);

      const constraints: DisplayMediaStreamOptions = { video: { frameRate: 30 } as MediaTrackConstraints, audio: false };

      if (mode === "extend") {
        const win = window.open("", "ExtendedSurface", "width=1280,height=720");
        if (win) {
          extendWindowRef.current = win;
          win.document.title = "Extended Surface";
          win.document.body.style.margin = "0";
          win.document.body.style.background = "rgba(15,23,42,.75)";
          win.document.body.innerHTML = `
            <div style="width:100%;height:100vh;display:grid;place-items:center;color:white;font-family:Inter,system-ui;gap:16px;backdrop-filter: blur(12px)">
              <div style="text-align:center">
                <div style="font-size:20px;opacity:.9">Extended Surface</div>
                <div style="opacity:.65">Pick this window in the screen picker</div>
              </div>
            </div>`;
          await new Promise<void>((res) => { window.setTimeout(res, 120); });
        }
      }

      let stream: MediaStream;
      try { stream = await navigator.mediaDevices.getDisplayMedia(constraints); }
      catch (e: unknown) {
        if (isDomException(e) && (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")) { setStatus("Share cancelled"); cleanupExtendWindow(); return; }
        setStatus("Failed to start"); cleanupExtendWindow(); return;
      }

      stream.getVideoTracks().forEach((t) => {
        t.onended = () => { void apiPOST("/api/rtc/close", { room: r }); setIsStopped(true); setStatus("Stopped"); };
      });

      localStreamRef.current = stream;

      // UI → sonra preview (instant)
      setRole("presenter"); setJoined(true); setIsStopped(false); setStatus("Starting…");
      requestAnimationFrame(attachLocalPreview);

      await ensurePC();
      const pc = pcRef.current!;
      pc.getSenders().forEach((s) => { try { pc.removeTrack(s); } catch {} });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      await apiPOST<unknown, { room: string; sdp: RTCSessionDescriptionInit }>("/api/rtc/offer", { room: r, sdp: pc.localDescription as RTCSessionDescriptionInit });

      setStatus(mode === "mirror" ? "Sharing (Mirror)" : "Sharing (Extend)");

      const ansPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<AnswerResp>(`/api/rtc/answer?room=${encodeURIComponent(r)}`);
          if (data.sdp && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            setStatus("Connected");
          }
        } catch {}
      }, 900);
      pollTimers.current.push(ansPoll);

      const candPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<CandidateResp>(`/api/rtc/candidate?room=${encodeURIComponent(r)}&side=answer&since=${answerCandIdx.current}`);
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) { try { await pcRef.current.addIceCandidate(c); } catch {} }
            answerCandIdx.current = data.next ?? (answerCandIdx.current + items.length);
          }
        } catch {}
      }, 800);
      pollTimers.current.push(candPoll);

      try { history.replaceState(null, "", `/screenshare?room=${r}&role=presenter`); } catch {}
    } catch (err) {
      console.error(err); setStatus("Failed to start");
    }
  }, [apiGET, apiPOST, ensurePC, attachLocalPreview, mode, room]);

  const stopPresenting = useCallback(async (): Promise<void> => {
    try { await apiPOST<unknown, { room: string }>("/api/rtc/close", { room: roomRef.current }); } catch {}
    const local = localStreamRef.current; if (local) { local.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
    cleanupExtendWindow(); if (videoRef.current) videoRef.current.srcObject = null;
    const pc = pcRef.current; if (pc) { try { pc.close(); } catch {} pcRef.current = null; }
    setIsStopped(true); setIsPaused(false); setStatus("Stopped");
  }, [apiPOST]);

  const togglePause = useCallback(() => {
    const vt = localStreamRef.current?.getVideoTracks?.()[0]; if (!vt) return;
    const next = !isPaused; vt.enabled = !next; setIsPaused(next);
    setStatus(next ? "Paused" : (hasRemote ? "Connected" : "Sharing"));
  }, [isPaused, hasRemote]);

  const resumePresenting = useCallback(async () => { await startAsPresenter(); }, [startAsPresenter]);

  /* ---------------- Viewer ---------------- */
  const startAsViewer = useCallback(async (): Promise<void> => {
    try {
      if (!room) { alert("Otaq kodu daxil edin."); return; }
      roomRef.current = room; offerCandIdx.current = 0;

      await ensurePC();
      setRole("viewer"); setJoined(true); setStatus("Waiting for offer...");
      setShowStoppedOverlay(false); setHasRemote(false); hadRemoteRef.current = false;

      const pc = pcRef.current!;

      const offerPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<OfferResp>(`/api/rtc/offer?room=${encodeURIComponent(roomRef.current)}`);
          const sdp = data.sdp; const explicitlyStopped = Boolean(data.stopped);
          const rev = data.revision ?? null;

          if (!sdp && explicitlyStopped && (hadRemoteRef.current || status === "Connected" || status === "Answer posted")) {
            setShowStoppedOverlay(true); setStatus("Presenter stopped"); return;
          }
          if (sdp) {
            if (rev !== null && lastOfferRevRef.current === rev) return;
            setShowStoppedOverlay(false);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
            await apiPOST<unknown, { room: string; sdp: RTCSessionDescriptionInit }>("/api/rtc/answer", {
              room: roomRef.current, sdp: pc.localDescription as RTCSessionDescriptionInit,
            });
            setStatus("Answer posted"); offerCandIdx.current = 0; lastOfferRevRef.current = rev;
          }
        } catch {}
      }, 900);
      pollTimers.current.push(offerPoll);

      const candPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<CandidateResp>(`/api/rtc/candidate?room=${encodeURIComponent(roomRef.current)}&side=offer&since=${offerCandIdx.current}`);
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) { try { await pcRef.current.addIceCandidate(c); } catch {} }
            offerCandIdx.current = data.next ?? (offerCandIdx.current + items.length);
          }
        } catch {}
      }, 800);
      pollTimers.current.push(candPoll);

      try { history.replaceState(null, "", `/screenshare?room=${roomRef.current}&role=viewer`); } catch {}
    } catch (err) {
      console.error(err); setStatus("Failed to join");
    }
  }, [apiGET, apiPOST, ensurePC, room, status]);

  /* Auto-join */
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const r = u.searchParams.get("room");
      const rl = u.searchParams.get("role") as Role | null;
      if (r) setRoom(r);
      if (r && rl === "viewer") void startAsViewer();
      if (r && rl === "presenter") setRole("presenter");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* —— Status → rəng —— */
  let tint: Tint = "idle";
  if (role === "presenter") {
    if (isStopped) tint = "stopped";
    else if (isPaused) tint = "paused";
    else if (status === "Connected") tint = "connected";
    else if (joined) tint = "alone";
  } else if (role === "viewer") {
    if (showStoppedOverlay) tint = "stopped";
    else if (hasRemote) tint = "connected";
    else if (joined) tint = "alone";
  }

  const showLoading = role === "viewer" && joined && !showStoppedOverlay && !hasRemote;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white drop-shadow-sm">Simple Screen Share</h2>
            <p className="text-slate-300/90 text-sm mt-1">
              {mode === "extend"
                ? "Extend: Yeni pəncərə açılır — screen picker-də o pəncərəni seç."
                : "Mirror: Burada önbaxış, qarşı tərəfə eyni görüntü gedir."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag>Role: {role ?? "-"}</Tag>
            <Tag className={tintChip(tint)}>Status: {status}</Tag>
            <Tag>Mode: {role === "presenter" ? mode : "-"}</Tag>
          </div>
        </div>

        {!joined && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button className={role === "presenter" ? "" : "bg-white/10 text-white hover:bg-white/20"} onClick={() => setRole("presenter")}>I am Presenter</Button>
              <Button className={role === "viewer" ? "" : "bg-white/10 text-white hover:bg-white/20"} onClick={() => setRole("viewer")}>I am Viewer</Button>
            </div>

            {role === "presenter" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button className={mode === "mirror" ? "" : "bg-white/10 text-white hover:bg-white/20"} onClick={() => setMode("mirror")}>Mirror</Button>
                  <Button className={mode === "extend" ? "" : "bg-white/10 text-white hover:bg-white/20"} onClick={() => setMode("extend")}>Extend</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
                  <Input inputMode="numeric" pattern="[0-9]*" placeholder="Otaq kodu (8 rəqəm)" maxLength={8}
                         value={room} onChange={(e) => setRoom(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                  <Button onClick={() => setRoom(generateRoomCode())}>Generate</Button>
                  <Button onClick={async () => { if (!room) return; await navigator.clipboard.writeText(room); setCopyOk(true); window.setTimeout(() => setCopyOk(false), 1000); }}>
                    {copyOk ? "Copied ✓" : "Copy"}
                  </Button>
                  {!isStopped ? (
                    <Button onClick={startAsPresenter}>Start (Presenter)</Button>
                  ) : (
                    <Button className="bg-emerald-600/90 hover:bg-emerald-600" onClick={resumePresenting}>Resume</Button>
                  )}
                </div>
              </>
            )}

            {role === "viewer" && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                <Input inputMode="numeric" pattern="[0-9]*" placeholder="Otaq kodu (8 rəqəm)" maxLength={8}
                       value={room} onChange={(e) => setRoom(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                <Button onClick={async () => { if (!room) return; await navigator.clipboard.writeText(room); setCopyOk(true); window.setTimeout(() => setCopyOk(false), 1000); }}>
                  {copyOk ? "Copied ✓" : "Copy"}
                </Button>
                <Button className="bg-sky-600/90 hover:bg-sky-600" onClick={startAsViewer}>Join (Viewer)</Button>
              </div>
            )}
          </div>
        )}

        {joined && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Tag>Room: {room || "-"}</Tag>
                <Tag>Role: {role ?? "-"}</Tag>
                <Tag>Mode: {role === "presenter" ? mode : "-"}</Tag>
              </div>

              <div className="flex-1" />

              {role === "viewer" && (
                <Button className="bg-emerald-600/90 hover:bg-emerald-600" onClick={() => {
                  const el = videoRef.current; if (!el) return;
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void el.requestFullscreen();
                }}>
                  Fullscreen
                </Button>
              )}

              {role === "presenter" && !isStopped && (
                <div className="flex gap-2">
                  <Button className={isPaused ? "bg-amber-600/90 hover:bg-amber-600" : "bg-white/10 hover:bg-white/20"} onClick={togglePause}>
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button className="bg-amber-600/90 hover:bg-amber-600" onClick={stopPresenting}>Stop</Button>
                </div>
              )}
              {role === "presenter" && isStopped && (
                <Button className="bg-emerald-600/90 hover:bg-emerald-600" onClick={resumePresenting}>Resume</Button>
              )}

              {isPiPSupported() && (
                <Button className={pipOn ? "bg-white/20" : ""} onClick={togglePiP}>
                  {pipOn ? "Exit PiP" : "Picture-in-Picture"}
                </Button>
              )}

              <Button className="bg-rose-600/90 hover:bg-rose-600" onClick={leave}>Leave</Button>
            </div>

            {/* Video + Status overlays */}
            <div className={`relative rounded-3xl overflow-hidden border-2 ${tintBox(tint)} backdrop-blur-xl shadow-2xl`}>
              {/* Üst STATUS banner (rəngli) */}
              <div className={`absolute left-4 top-4 px-3 py-1 rounded-xl border text-xs font-semibold ${tintChip(tint)}`}>
                {tint === "connected" ? "Connected"
                  : tint === "paused"   ? "Paused"
                  : tint === "alone"    ? "Waiting…"
                  : tint === "stopped"  ? "Stopped"
                  : "Idle"}
              </div>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={role === "presenter"}
                className="w-full aspect-video sm:max-h-[74vh] h-[46vh] object-contain"
              />

              {/* Yüklənir (viewer) */}
              {showLoading && (
                <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                    <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-medium shadow-2xl">
                      Loading…
                    </div>
                  </div>
                </div>
              )}

              {/* Presenter STOP edib-sə (viewer) */}
              {showStoppedOverlay && role === "viewer" && (
                <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
                  <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-semibold shadow-2xl">
                    Presenter stopped sharing
                  </div>
                </div>
              )}

              {/* Glow ring */}
              <div className="pointer-events-none absolute -inset-px rounded-[inherit] ring-2 ring-white/10" />
            </div>

            {/* Aşağı “legend” (rənglər) */}
            <div className="text-xs text-white/75 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Connected</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Paused</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-sky-500" /> Alone</span>
              <span className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-rose-500" /> Stopped</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
