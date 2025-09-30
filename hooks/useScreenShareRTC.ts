// /hooks/useScreenShareRTC.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signaling } from "@/services/signaling";
import {
  candidateInitFrom,
  generateRoomCode,
  isDomException,
} from "@/lib/helpers";
import type { Mode, PiPDocument, PiPVideo, Role, Tint } from "@/types";

export function useScreenShareRTC() {
  // public state
  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<Mode>("mirror");
  const [room, setRoom] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [copyOk, setCopyOk] = useState(false);

  const [showStoppedOverlay, setShowStoppedOverlay] = useState(false);
  const [hasRemote, setHasRemote] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pipOn, setPipOn] = useState(false);

  // refs
  const roomRef = useRef<string>("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const extendWindowRef = useRef<Window | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const offerCandIdx = useRef(0);
  const answerCandIdx = useRef(0);
  const pollTimers = useRef<number[]>([]);
  const hadRemoteRef = useRef(false);
  const lastOfferRevRef = useRef<number | null>(null);

  // rtc config
  const rtcConfig = useMemo<RTCConfiguration>(
    () => ({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    }),
    []
  );

  const clearPolling = () => {
    pollTimers.current.forEach((t) => window.clearInterval(t));
    pollTimers.current = [];
  };
  const cleanupExtendWindow = () => {
    const win = extendWindowRef.current;
    if (win && !win.closed) {
      try {
        win.close();
      } catch {}
    }
    extendWindowRef.current = null;
  };

  const ensurePC = useCallback(async () => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const side: "offer" | "answer" =
        role === "presenter" ? "offer" : "answer";
      void signaling.postCandidate(
        roomRef.current,
        side,
        candidateInitFrom(e.candidate)
      );
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
        hadRemoteRef.current = true;
        setHasRemote(true);
        setShowStoppedOverlay(false);
        const v = videoRef.current;
        v.srcObject = stream;
        v.muted = true;
        const play = () => void v.play().catch(() => {});
        if (v.readyState >= 2) play();
        else v.onloadedmetadata = play;
      }
    };
  }, [role, rtcConfig]);

  const leave = useCallback(async () => {
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
      try {
        pc.close();
      } catch {}
      pcRef.current = null;
    }
    hadRemoteRef.current = false;
    setHasRemote(false);
    setJoined(false);
    setStatus("Left");
    setShowStoppedOverlay(false);
    setIsStopped(false);
    setIsPaused(false);
    setPipOn(false);
    offerCandIdx.current = 0;
    answerCandIdx.current = 0;
    lastOfferRevRef.current = null;
  }, []);
  useEffect(
    () => () => {
      void leave();
    },
    [leave]
  );
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const attachLocalPreview = useCallback(() => {
    const v = videoRef.current;
    const s = localStreamRef.current;
    if (!v || !s) return;
    v.muted = true;
    v.playsInline = true;
    v.srcObject = s;
    const play = () => void v.play().catch(() => {});
    if (v.readyState >= 2) play();
    else v.onloadedmetadata = play;
  }, []);
  useEffect(() => {
    if (role === "presenter" && joined && localStreamRef.current)
      attachLocalPreview();
  }, [role, joined, attachLocalPreview]);

  // PiP
  useEffect(() => {
    const v = videoRef.current as PiPVideo | null;
    if (!v) return;
    const onEnter = () => setPipOn(true);
    const onLeave = () => setPipOn(false);
    const onWebkit = () =>
      setPipOn(v.webkitPresentationMode === "picture-in-picture");
    v.addEventListener("enterpictureinpicture", onEnter as EventListener);
    v.addEventListener("leavepictureinpicture", onLeave as EventListener);
    if (typeof v.webkitSetPresentationMode === "function")
      v.addEventListener(
        "webkitpresentationmodechanged",
        onWebkit as EventListener
      );

    const docPiP = document as PiPDocument;
    if (typeof v.webkitPresentationMode === "string")
      setPipOn(v.webkitPresentationMode === "picture-in-picture");
    else setPipOn(docPiP.pictureInPictureElement === v);

    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter as EventListener);
      v.removeEventListener("leavepictureinpicture", onLeave as EventListener);
      if (typeof v.webkitSetPresentationMode === "function")
        v.removeEventListener(
          "webkitpresentationmodechanged",
          onWebkit as EventListener
        );
    };
  }, [joined]);

  const isPiPSupported = (): boolean => {
    const v = videoRef.current as PiPVideo | null;
    const d = document as PiPDocument;
    return (
      !!v &&
      ((typeof v.requestPictureInPicture === "function" &&
        !!d.pictureInPictureEnabled) ||
        typeof v.webkitSetPresentationMode === "function")
    );
  };
  const togglePiP = async () => {
    const v = videoRef.current as PiPVideo | null;
    if (!v) return;
    const d = document as PiPDocument;
    try {
      if (typeof v.webkitSetPresentationMode === "function") {
        v.webkitSetPresentationMode!(
          v.webkitPresentationMode === "picture-in-picture"
            ? "inline"
            : "picture-in-picture"
        );
        return;
      }
      if (d.pictureInPictureElement) await d.exitPictureInPicture?.();
      else if (
        typeof v.requestPictureInPicture === "function" &&
        d.pictureInPictureEnabled
      ) {
        if (v.readyState < 2) {
          try {
            await v.play();
          } catch {}
        }
        await v.requestPictureInPicture();
      }
    } catch {}
  };

  /* ───────── Presenter ───────── */
  const startAsPresenter = useCallback(async () => {
    try {
      const r = room || generateRoomCode();
      if (!room) setRoom(r);
      roomRef.current = r;
      answerCandIdx.current = 0;
      setIsPaused(false);

      const constraints: DisplayMediaStreamOptions = {
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: false,
      };

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
          await new Promise<void>((res) => {
            window.setTimeout(res, 120);
          });
        }
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } catch (e: unknown) {
        if (
          isDomException(e) &&
          (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
        ) {
          setStatus("Share cancelled");
          cleanupExtendWindow();
          return;
        }
        setStatus("Failed to start");
        cleanupExtendWindow();
        return;
      }

      stream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          void signaling.close(r);
          setIsStopped(true);
          setStatus("Stopped");
        };
      });

      localStreamRef.current = stream;

      setRole("presenter");
      setJoined(true);
      setIsStopped(false);
      setStatus("Starting…");
      requestAnimationFrame(attachLocalPreview);

      await ensurePC();
      const pc = pcRef.current!;
      pc.getSenders().forEach((s) => {
        try {
          pc.removeTrack(s);
        } catch {}
      });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await signaling.postOffer(
        r,
        pc.localDescription as RTCSessionDescriptionInit
      );

      setStatus(mode === "mirror" ? "Sharing (Mirror)" : "Sharing (Extend)");

      const ansPoll = window.setInterval(async () => {
        try {
          const data = await signaling.getAnswer(r);
          if (data.sdp && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            setStatus("Connected");
          }
        } catch {}
      }, 900);
      pollTimers.current.push(ansPoll);

      const candPoll = window.setInterval(async () => {
        try {
          const data = await signaling.getCandidates(
            r,
            "answer",
            answerCandIdx.current
          );
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) {
              try {
                await pcRef.current.addIceCandidate(c);
              } catch {}
            }
            answerCandIdx.current =
              data.next ?? answerCandIdx.current + items.length;
          }
        } catch {}
      }, 800);
      pollTimers.current.push(candPoll);

      try {
        history.replaceState(null, "", `/screenshare?room=${r}&role=presenter`);
      } catch {}
    } catch (err) {
      console.error(err);
      setStatus("Failed to start");
    }
  }, [mode, room, ensurePC, attachLocalPreview]);

  const stopPresenting = useCallback(async () => {
    try {
      await signaling.close(roomRef.current);
    } catch {}
    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    cleanupExtendWindow();
    if (videoRef.current) videoRef.current.srcObject = null;
    const pc = pcRef.current;
    if (pc) {
      try {
        pc.close();
      } catch {}
      pcRef.current = null;
    }
    setIsStopped(true);
    setIsPaused(false);
    setStatus("Stopped");
  }, []);

  const togglePause = useCallback(() => {
    const vt = localStreamRef.current?.getVideoTracks?.()[0];
    if (!vt) return;
    const next = !isPaused;
    vt.enabled = !next;
    setIsPaused(next);
    setStatus(next ? "Paused" : hasRemote ? "Connected" : "Sharing");
  }, [isPaused, hasRemote]);

  const resumePresenting = useCallback(async () => {
    await startAsPresenter();
  }, [startAsPresenter]);

  /* ───────── Viewer ───────── */
  const startAsViewer = useCallback(async () => {
    try {
      if (!room) {
        alert("Otaq kodu daxil edin.");
        return;
      }
      roomRef.current = room;
      offerCandIdx.current = 0;

      await ensurePC();
      setRole("viewer");
      setJoined(true);
      setStatus("Waiting for offer...");
      setShowStoppedOverlay(false);
      setHasRemote(false);
      hadRemoteRef.current = false;

      const pc = pcRef.current!;

      const offerPoll = window.setInterval(async () => {
        try {
          const data = await signaling.getOffer(roomRef.current);
          const sdp = data.sdp;
          const explicitlyStopped = Boolean(data.stopped);
          const rev = data.revision ?? null;

          if (
            !sdp &&
            explicitlyStopped &&
            (hadRemoteRef.current ||
              status === "Connected" ||
              status === "Answer posted")
          ) {
            setShowStoppedOverlay(true);
            setStatus("Presenter stopped");
            return;
          }
          if (sdp) {
            if (rev !== null && lastOfferRevRef.current === rev) return;
            setShowStoppedOverlay(false);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await signaling.postAnswer(
              roomRef.current,
              pc.localDescription as RTCSessionDescriptionInit
            );
            setStatus("Answer posted");
            offerCandIdx.current = 0;
            lastOfferRevRef.current = rev;
          }
        } catch {}
      }, 900);
      pollTimers.current.push(offerPoll);

      const candPoll = window.setInterval(async () => {
        try {
          const data = await signaling.getCandidates(
            roomRef.current,
            "offer",
            offerCandIdx.current
          );
          const items = data.items ?? [];
          if (items.length && pcRef.current) {
            for (const c of items) {
              try {
                await pcRef.current.addIceCandidate(c);
              } catch {}
            }
            offerCandIdx.current =
              data.next ?? offerCandIdx.current + items.length;
          }
        } catch {}
      }, 800);
      pollTimers.current.push(candPoll);

      try {
        history.replaceState(
          null,
          "",
          `/screenshare?room=${roomRef.current}&role=viewer`
        );
      } catch {}
    } catch (err) {
      console.error(err);
      setStatus("Failed to join");
    }
  }, [ensurePC, room, status]);

  // auto-join
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

  // derive tint
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
  const showLoading =
    role === "viewer" && joined && !showStoppedOverlay && !hasRemote;

  const isPiPAvailable = typeof document !== "undefined" && isPiPSupported();

  return {
    // state
    role,
    setRole,
    mode,
    setMode,
    room,
    setRoom,
    joined,
    status,
    copyOk,
    setCopyOk,
    showStoppedOverlay,
    hasRemote,
    isStopped,
    isPaused,
    pipOn,
    tint,
    showLoading,

    // refs
    videoRef,

    // actions
    startAsPresenter,
    startAsViewer,
    stopPresenting,
    resumePresenting,
    togglePause,
    isPiPAvailable,
    togglePiP,
    leave,
  };
}
