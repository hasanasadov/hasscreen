"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Input, Tag } from "./ui";
import { generateRoomCode } from "./useRoomCode";

type Role = "presenter" | "viewer";
type Mode = "mirror" | "extend";

type OfferAnswerResp = { sdp: RTCSessionDescriptionInit | null };
type CandidateResp = { items: RTCIceCandidateInit[]; next: number };

export default function ScreenShareRTC() {
  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<Mode>("mirror");
  const [room, setRoom] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Idle");
  const [copyOk, setCopyOk] = useState<boolean>(false);

  // Overlays
  const [showStoppedOverlay, setShowStoppedOverlay] = useState<boolean>(false); // yalnız STOP zamanı
  const [hasRemote, setHasRemote] = useState<boolean>(false); // viewer-ə remote düşübmü?

  // Presenter üçün STOP/RESUME
  const [isStopped, setIsStopped] = useState<boolean>(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const extendWindowRef = useRef<Window | null>(null);

  // Single video:
  const videoRef = useRef<HTMLVideoElement>(null);

  // Polling state
  const offerCandIdx = useRef<number>(0);  // viewer → offer ICE
  const answerCandIdx = useRef<number>(0); // presenter → answer ICE
  const pollTimers = useRef<number[]>([]);
  const hadRemoteRef = useRef<boolean>(false); // əvvəl stream görmüşdüsə

  const rtcConfig = useMemo<RTCConfiguration>(
    () => ({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }),
    []
  );

  const apiGET = useCallback(async <T,>(url: string): Promise<T> => {
    const r = await fetch(url, { cache: "no-store" });
    return (await r.json()) as T;
  }, []);
  const apiPOST = useCallback(async <TRes, TBody extends object>(url: string, body: TBody): Promise<TRes> => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as TRes;
  }, []);

  const ensurePC = useCallback(async (): Promise<void> => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (!e.candidate) return;
      const side: "offer" | "answer" = role === "presenter" ? "offer" : "answer";
      void apiPOST("/api/rtc/candidate", { room, side, candidate: e.candidate });
    };

    pc.ontrack = (e: RTCTrackEvent) => {
      if (role === "viewer" && videoRef.current) {
        const [stream] = e.streams;
        hadRemoteRef.current = true;
        setHasRemote(true);
        setShowStoppedOverlay(false);
        videoRef.current.srcObject = stream;
      }
    };
  }, [apiPOST, room, role, rtcConfig]);

  const clearPolling = (): void => {
    pollTimers.current.forEach((t) => window.clearInterval(t));
    pollTimers.current = [];
  };

  const cleanupExtendWindow = (): void => {
    const win = extendWindowRef.current;
    if (win && !win.closed) {
      try { win.close(); } catch { /* noop */ }
    }
    extendWindowRef.current = null;
  };

  const leave = useCallback(async (): Promise<void> => {
    clearPolling();
    cleanupExtendWindow();

    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    const pc = pcRef.current;
    if (pc) {
      try { pc.close(); } catch { /* noop */ }
      pcRef.current = null;
    }
    hadRemoteRef.current = false;
    setHasRemote(false);
    setJoined(false);
    setStatus("Left");
    setShowStoppedOverlay(false);
    setIsStopped(false);
  }, []);

  useEffect(() => () => { void leave(); }, [leave]);

  // ---------- Presenter: start (Mirror/Extend) ----------
  const startAsPresenter = useCallback(async (): Promise<void> => {
    try {
      const r = room || generateRoomCode();
      if (!room) setRoom(r);

      let stream: MediaStream;

      if (mode === "mirror") {
        const constraints: DisplayMediaStreamOptions = {
          video: { frameRate: 30 } as MediaTrackConstraints,
          audio: false,
        };
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } else {
        // Extend: ayrıca pəncərə açılır; istifadəçi screen-picker-də bu pəncərəni seçməlidir
        const win = window.open("", "ExtendedSurface", "width=1280,height=720");
        if (!win) {
          alert("Popup blocked. Allow popups for this site.");
          return;
        }
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
            <button id="fs" style="padding:10px 16px;border-radius:14px;background:rgba(16,185,129,.85);border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 30px rgba(0,0,0,.25);color:white;font-weight:700;cursor:pointer;backdrop-filter:blur(8px)">
              Fullscreen
            </button>
          </div>
          <script>
            (function(){
              const btn = document.getElementById('fs');
              btn?.addEventListener('click', () => {
                document.documentElement.requestFullscreen?.().catch(()=>{});
              });
            })();
          </script>
        `;
        await new Promise<void>((res) => { window.setTimeout(res, 150); });

        const constraints: DisplayMediaStreamOptions = {
          video: { frameRate: 30 } as MediaTrackConstraints,
          audio: false,
        };
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      }

      localStreamRef.current = stream;

      await ensurePC();
      const pc = pcRef.current!;
      // replace senders
      pc.getSenders().forEach((s) => { try { pc.removeTrack(s); } catch { /* noop */ } });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Mirror -> preview; Extend -> preview yoxdur
      if (mode === "mirror" && videoRef.current) videoRef.current.srcObject = stream;
      if (mode === "extend" && videoRef.current) videoRef.current.srcObject = null;

      // offer → server
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await apiPOST<unknown, { room: string; sdp: RTCSessionDescriptionInit }>("/api/rtc/offer", {
        room: r,
        sdp: pc.localDescription as RTCSessionDescriptionInit,
      });

      setRole("presenter");
      setJoined(true);
      setIsStopped(false);
      setStatus(mode === "mirror" ? "Sharing (Mirror)" : "Sharing (Extend)");

      // poll answer
      const ansPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<OfferAnswerResp>(`/api/rtc/answer?room=${encodeURIComponent(r)}`);
          if (data.sdp && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            setStatus("Connected");
          }
        } catch { /* noop */ }
      }, 1000);
      pollTimers.current.push(ansPoll);

      // poll viewer ICE
      const candPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<CandidateResp>(
            `/api/rtc/candidate?room=${encodeURIComponent(r)}&side=answer&since=${answerCandIdx.current}`
          );
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch { /* noop */ }
            }
            answerCandIdx.current = data.next ?? (answerCandIdx.current + items.length);
          }
        } catch { /* noop */ }
      }, 800);
      pollTimers.current.push(candPoll);

      try { history.replaceState(null, "", `/screenshare?room=${r}&role=presenter`); } catch { /* noop */ }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setStatus("Failed to start");
    }
  }, [apiGET, apiPOST, ensurePC, mode, room]);

  const stopPresenting = useCallback(async (): Promise<void> => {
    // STOP: otağı sıfırla → viewer offer=null görəcək → overlay yalnız bu halda çıxacaq
    try { await apiPOST<unknown, { room: string }>("/api/rtc/close", { room }); } catch { /* noop */ }

    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    cleanupExtendWindow();
    if (videoRef.current) videoRef.current.srcObject = null;

    // PC-ni bağla; Resume yeni PC ilə başlayacaq
    const pc = pcRef.current;
    if (pc) {
      try { pc.close(); } catch { /* noop */ }
      pcRef.current = null;
    }

    setIsStopped(true);
    setStatus("Stopped");
  }, [apiPOST, room]);

  const resumePresenting = useCallback(async (): Promise<void> => {
    await startAsPresenter(); // eyni room + seçilmiş mode ilə
  }, [startAsPresenter]);

  // ---------- Viewer ----------
  const startAsViewer = useCallback(async (): Promise<void> => {
    try {
      if (!room) {
        alert("Otaq kodu daxil edin.");
        return;
      }
      await ensurePC();
      setRole("viewer");
      setJoined(true);
      setStatus("Waiting for offer...");
      setShowStoppedOverlay(false);
      setHasRemote(false);
      hadRemoteRef.current = false;

      const pc = pcRef.current!;

      // Offer poll → Always accept latest offer (even after resume)
      const offerPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<OfferAnswerResp>(`/api/rtc/offer?room=${encodeURIComponent(room)}`);
          const sdp = data.sdp;

          // STOP-dan sonra: əvvəllər stream var idi və indi offer yoxdursa → overlay
          if (!sdp && (hadRemoteRef.current || status === "Connected" || status === "Answer posted")) {
            setShowStoppedOverlay(true);
            setStatus("Presenter stopped");
            return;
          }

          if (sdp) {
            setShowStoppedOverlay(false); // yeni offer → overlay gizlə
            // Yeni offer-i hər dəfə qəbul et (resume də daxil)
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await apiPOST<unknown, { room: string; sdp: RTCSessionDescriptionInit }>("/api/rtc/answer", {
              room,
              sdp: pc.localDescription as RTCSessionDescriptionInit,
            });
            setStatus("Answer posted");
          }
        } catch { /* noop */ }
      }, 900);
      pollTimers.current.push(offerPoll);

      // Presenter ICE-lər
      const candPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<CandidateResp>(
            `/api/rtc/candidate?room=${encodeURIComponent(room)}&side=offer&since=${offerCandIdx.current}`
          );
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch { /* noop */ }
            }
            offerCandIdx.current = data.next ?? (offerCandIdx.current + items.length);
          }
        } catch { /* noop */ }
      }, 800);
      pollTimers.current.push(candPoll);

      try { history.replaceState(null, "", `/screenshare?room=${room}&role=viewer`); } catch { /* noop */ }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setStatus("Failed to join");
    }
  }, [apiGET, apiPOST, ensurePC, room, status]);

  // Auto-join (viewer)
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const r = u.searchParams.get("room");
      const rl = u.searchParams.get("role") as Role | null;
      if (r) setRoom(r);
      if (r && rl === "viewer") { void startAsViewer(); }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fullscreen (viewer)
  const goFullscreen = (): void => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) { void document.exitFullscreen(); }
    else { void el.requestFullscreen(); }
  };

  const copyRoom = async (): Promise<void> => {
    if (!room) return;
    await navigator.clipboard.writeText(room);
    setCopyOk(true);
    window.setTimeout(() => setCopyOk(false), 1000);
  };
  const gen = (): void => setRoom(generateRoomCode());

  // Loading overlay şərti (viewer qoşulub, stream hələ gəlməyib, stop da deyil)
  const showLoading = role === "viewer" && joined && !showStoppedOverlay && !hasRemote;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
              Simple Screen Share
            </h2>
            <p className="text-slate-300/90 text-sm mt-1">
              Rol seç → Presenter otaq yaradır (kod), Viewer kodla qoşulur.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag>Role: {role ?? "-"}</Tag>
            <Tag>Status: {status}</Tag>
            <Tag>Mode: {role === "presenter" ? mode : "-"}</Tag>
          </div>
        </div>

        {!joined && (
          <div className="mt-6 space-y-4">
            {/* Roles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                className={`w-full ${role === "presenter" ? "" : "bg-slate-700/70 hover:bg-slate-700/80"} backdrop-blur`}
                onClick={() => setRole("presenter")}
              >
                I am Presenter
              </Button>
              <Button
                className={`w-full ${role === "viewer" ? "bg-sky-600/90 hover:bg-sky-600" : "bg-slate-700/70 hover:bg-slate-700/80"} backdrop-blur`}
                onClick={() => setRole("viewer")}
              >
                I am Viewer
              </Button>
            </div>

            {/* Presenter: Mode + code */}
            {role === "presenter" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    className={`w-full ${mode === "mirror" ? "" : "bg-slate-700/70 hover:bg-slate-700/80"} backdrop-blur`}
                    onClick={() => setMode("mirror")}
                  >
                    Mirror
                  </Button>
                  <Button
                    className={`w-full ${mode === "extend" ? "" : "bg-slate-700/70 hover:bg-slate-700/80"} backdrop-blur`}
                    onClick={() => setMode("extend")}
                  >
                    Extend
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Otaq kodu (8 rəqəm)"
                    maxLength={8}
                    value={room}
                    onChange={(e) =>
                      setRoom(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                  />
                  <Button className="w-full sm:w-auto" onClick={gen}>Generate</Button>
                  <Button className="w-full sm:w-auto" onClick={copyRoom}>{copyOk ? "Copied ✓" : "Copy"}</Button>
                  <div className="hidden sm:block" />
                  {!isStopped ? (
                    <Button className="w-full sm:w-auto" onClick={startAsPresenter}>
                      Start (Presenter)
                    </Button>
                  ) : (
                    <Button className="w-full sm:w-auto bg-emerald-600/90 hover:bg-emerald-600" onClick={resumePresenting}>
                      Resume
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Viewer: code + join */}
            {role === "viewer" && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Otaq kodu (8 rəqəm)"
                  maxLength={8}
                  value={room}
                  onChange={(e) =>
                    setRoom(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                />
                <Button className="w-full sm:w-auto" onClick={copyRoom}>{copyOk ? "Copied ✓" : "Copy"}</Button>
                <Button className="w-full sm:w-auto bg-sky-600/90 hover:bg-sky-600" onClick={startAsViewer}>
                  Join (Viewer)
                </Button>
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
                <Button className="w-full sm:w-auto bg-emerald-600/90 hover:bg-emerald-600" onClick={goFullscreen}>
                  Fullscreen
                </Button>
              )}

              {role === "presenter" && !isStopped && (
                <Button className="w-full sm:w-auto bg-amber-600/90 hover:bg-amber-600" onClick={stopPresenting}>
                  Stop
                </Button>
              )}
              {role === "presenter" && isStopped && (
                <Button className="w-full sm:w-auto bg-emerald-600/90 hover:bg-emerald-600" onClick={resumePresenting}>
                  Resume
                </Button>
              )}

              <Button className="w-full sm:w-auto bg-rose-600/90 hover:bg-rose-600" onClick={leave}>
                Leave
              </Button>
            </div>

            {/* Single video + overlays (glassmorphism) */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/10 backdrop-blur-xl shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={role === "presenter"}
                className="w-full aspect-video sm:max-h-[70vh] h-[36vh] object-contain"
              />

              {/* LOADING while waiting for remote */}
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

              {/* STOPPED (only when presenter pressed Stop) */}
              {showStoppedOverlay && role === "viewer" && (
                <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
                  <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-semibold shadow-2xl">
                    Presenter stopped sharing
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
