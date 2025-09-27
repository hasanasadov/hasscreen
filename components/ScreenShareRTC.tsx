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
  const [leftOverlay, setLeftOverlay] = useState<boolean>(false); // viewer overlay

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const extendWindowRef = useRef<Window | null>(null);

  // Single video element:
  // - presenter: shows own preview ONLY in Mirror mode
  // - viewer: shows remote stream
  const videoRef = useRef<HTMLVideoElement>(null);

  // Polling state
  const offerCandIdx = useRef<number>(0);  // viewer pulls offer-side ICE
  const answerCandIdx = useRef<number>(0); // presenter pulls answer-side ICE
  const pollTimers = useRef<number[]>([]);
  const hadRemoteRef = useRef<boolean>(false); // viewer: did we ever receive remote?

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
        setLeftOverlay(false);
        videoRef.current.srcObject = stream;

        // When presenter stops, tracks end → show LEFT overlay
        stream.getTracks().forEach((t) => {
          t.onended = () => {
            setLeftOverlay(true);
            setStatus("Presenter left");
          };
        });

        // Also listen for the (standard) "inactive" event on the stream
        stream.addEventListener("inactive", () => {
          setLeftOverlay(true);
          setStatus("Presenter left");
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (role === "viewer" && (s === "disconnected" || s === "failed" || s === "closed")) {
        setLeftOverlay(true);
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
    setJoined(false);
    setStatus("Left");
    setLeftOverlay(false);
  }, []);

  useEffect(() => () => { void leave(); }, [leave]);

  // ---------- Presenter ----------
  const startAsPresenter = useCallback(async (): Promise<void> => {
    try {
      const r = room || generateRoomCode();
      if (!room) setRoom(r);

      // 1) Local stream (Mirror or Extend)
      let stream: MediaStream;

      if (mode === "mirror") {
        const constraints: DisplayMediaStreamOptions = {
          video: { frameRate: 30 } as MediaTrackConstraints,
          audio: false,
        };
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } else {
        // Open a helper window for "extend". We will ask user to pick THIS window in the display picker.
        const win = window.open("", "ExtendedSurface", "width=1280,height=720");
        if (!win) {
          alert("Popup blocked. Allow popups for this site.");
          return;
        }
        extendWindowRef.current = win;
        win.document.title = "Extended Surface";
        win.document.body.style.margin = "0";
        win.document.body.style.background = "#0f172a";
        win.document.body.innerHTML = `
          <div style="width:100%;height:100vh;display:grid;place-items:center;color:white;font-family:Inter,system-ui;gap:16px">
            <div style="text-align:center">
              <div style="font-size:20px;opacity:.9">Extended Surface</div>
              <div style="opacity:.6">This window is being captured — select it in the picker</div>
            </div>
            <button id="fs" style="padding:8px 14px;border-radius:10px;background:#10b981;border:none;color:white;font-weight:600;cursor:pointer">
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

        // Give the window a moment to render before opening the picker
        await new Promise<void>((res) => { window.setTimeout(res, 150); });

        const constraints: DisplayMediaStreamOptions = {
          video: { frameRate: 30 } as MediaTrackConstraints,
          audio: false,
        };
        // NOTE: On the picker, select the "Extended Surface" window we just opened
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      }

      localStreamRef.current = stream;

      await ensurePC();
      const pc = pcRef.current!;
      // Replace senders with new tracks
      pc.getSenders().forEach((s) => { try { pc.removeTrack(s); } catch { /* noop */ } });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Presenter preview only in Mirror mode
      if (mode === "mirror" && videoRef.current) {
        videoRef.current.srcObject = stream;
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // 2) Create & post offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await apiPOST<unknown, { room: string; sdp: RTCSessionDescriptionInit }>("/api/rtc/offer", {
        room: r,
        sdp: pc.localDescription as RTCSessionDescriptionInit,
      });

      setRole("presenter");
      setJoined(true);
      setStatus(mode === "mirror" ? "Sharing (Mirror)" : "Sharing (Extend)");

      // 3) Poll for answer
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

      // 4) Poll viewer ICE
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
    try { await apiPOST<unknown, { room: string }>("/api/rtc/close", { room }); } catch { /* noop */ }
    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    cleanupExtendWindow();
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("Stopped");
  }, [apiPOST, room]);

  // ---------- Viewer ----------
  const startAsViewer = useCallback(async (): Promise<void> => {
    try {
      if (!room) {
        alert("Otaq kodu daxil edin.");
        return;
      }
      await ensurePC();
      const pc = pcRef.current!;
      setRole("viewer");
      setJoined(true);
      setStatus("Waiting for offer...");
      setLeftOverlay(false);
      hadRemoteRef.current = false;

      // 1) Poll offer → set remote → create answer → post
      const offerPoll = window.setInterval(async () => {
        try {
          const data = await apiGET<OfferAnswerResp>(`/api/rtc/offer?room=${encodeURIComponent(room)}`);
          const sdp = data.sdp;
          if (!sdp && (hadRemoteRef.current || status === "Connected" || status === "Answer posted")) {
            setLeftOverlay(true);
            setStatus("Presenter left");
            return;
          }
          if (sdp && !pc.currentRemoteDescription) {
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
      }, 1000);
      pollTimers.current.push(offerPoll);

      // 2) Poll presenter ICE
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

  // Auto-join from URL (viewer)
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

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Simple Screen Share (HTTP Signaling)
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Rol seç → Presenter otaq yaradır (kod), Viewer kodla qoşulur.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Tag>Role: {role ?? "-"}</Tag>
            <Tag>Status: {status}</Tag>
            <Tag>Mode: {role === "presenter" ? mode : "-"}</Tag>
          </div>
        </div>

        {!joined && (
          <div className="mt-6 space-y-4">
            {/* Role select */}
            <div className="flex gap-2">
              <Button
                className={role === "presenter" ? "" : "bg-slate-700 hover:bg-slate-700"}
                onClick={() => setRole("presenter")}
              >
                I am Presenter
              </Button>
              <Button
                className={role === "viewer" ? "bg-sky-600/90 hover:bg-sky-600" : "bg-slate-700 hover:bg-slate-700"}
                onClick={() => setRole("viewer")}
              >
                I am Viewer
              </Button>
            </div>

            {/* Presenter: Mode + code */}
            {role === "presenter" && (
              <>
                <div className="flex gap-2">
                  <Button
                    className={mode === "mirror" ? "" : "bg-slate-700 hover:bg-slate-700"}
                    onClick={() => setMode("mirror")}
                  >
                    Mirror
                  </Button>
                  <Button
                    className={mode === "extend" ? "" : "bg-slate-700 hover:bg-slate-700"}
                    onClick={() => setMode("extend")}
                  >
                    Extend
                  </Button>
                </div>

                <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3">
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
                  <Button onClick={gen}>Generate</Button>
                  <Button onClick={copyRoom}>{copyOk ? "Copied ✓" : "Copy"}</Button>
                  <div />
                  <Button onClick={startAsPresenter}>Start (Presenter)</Button>
                </div>
              </>
            )}

            {/* Viewer: code + join */}
            {role === "viewer" && (
              <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
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
                <Button onClick={copyRoom}>{copyOk ? "Copied ✓" : "Copy"}</Button>
                <Button className="bg-sky-600/90 hover:bg-sky-600" onClick={startAsViewer}>
                  Join (Viewer)
                </Button>
              </div>
            )}
          </div>
        )}

        {joined && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Tag>Room: {room || "-"}</Tag>
              <Tag>Role: {role ?? "-"}</Tag>
              <Tag>Mode: {role === "presenter" ? mode : "-"}</Tag>
              {role === "viewer" && (
                <Button className="bg-emerald-600/90 hover:bg-emerald-600 ml-auto" onClick={goFullscreen}>
                  Fullscreen
                </Button>
              )}
              {role === "presenter" && (
                <Button className="bg-amber-600/90 hover:bg-amber-600 ml-auto" onClick={stopPresenting}>
                  Stop sharing
                </Button>
              )}
              <Button className="bg-rose-600/90 hover:bg-rose-600" onClick={leave}>
                Leave
              </Button>
            </div>

            {/* Single video + LEFT overlay for viewer */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/60">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={role === "presenter"}
                className="w-full aspect-video"
              />
              {leftOverlay && role === "viewer" && (
                <div className="absolute inset-0 grid place-items-center bg-black/70">
                  <div className="text-3xl md:text-5xl font-bold tracking-wide text-white/90">
                    LEFT
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
