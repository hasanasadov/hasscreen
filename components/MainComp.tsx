// /components/MainComp.tsx
"use client";

import * as React from "react";
import RenderIf from "@/lib/RenderIf";
import { Header } from "./Header";
import { Legend } from "./Legend";
import { RoomRow } from "./RoomRow";
import { Segmented, SegmentedMode } from "./Segment";
import { Toolbar } from "./ToolBar";
import { VideoStage } from "./VideoStage";
import { Card, CardBody } from "./ui";
import { useScreenShareRTC } from "@/hooks/useScreenShareRTC";
import { generateRoomCode } from "@/lib/helpers";
import type { Mode, Role } from "@/types";

export default function MainComp() {
  const {
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
  } = useScreenShareRTC();

  return (
    <Card>
      <CardBody>
        <Header
          role={role}
          status={status}
          mode={role === "presenter" ? mode : "-"}
          tint={tint}
        />

        <RenderIf condition={!joined}>
          <div className="mt-6 space-y-6">
            <Segmented role={role} setRole={setRole} />

            <RenderIf condition={role === "presenter"}>
              <SegmentedMode mode={mode as Mode} setMode={setMode} />
              <RoomRow
                room={room}
                setRoom={setRoom}
                buttons={[
                  {
                    label: "Generate",
                    onClick: () => setRoom(generateRoomCode()),
                  },
                  {
                    label: copyOk ? "Copied ✓" : "Copy",
                    onClick: async () => {
                      if (!room) return;
                      await navigator.clipboard.writeText(room);
                      setCopyOk(true);
                      window.setTimeout(() => setCopyOk(false), 900);
                    },
                    tone: copyOk ? "ok" : "default",
                  },
                  {
                    label: "Start (Presenter)",
                    onClick: startAsPresenter,
                    tone: "primary",
                  },
                ]}
              />
            </RenderIf>

            <RenderIf condition={role === "viewer"}>
              <RoomRow
                room={room}
                setRoom={setRoom}
                buttons={[
                  {
                    label: copyOk ? "Copied ✓" : "Copy",
                    onClick: async () => {
                      if (!room) return;
                      await navigator.clipboard.writeText(room);
                      setCopyOk(true);
                      window.setTimeout(() => setCopyOk(false), 900);
                    },
                    tone: copyOk ? "ok" : "default",
                  },
                  {
                    label: "Join (Viewer)",
                    onClick: startAsViewer,
                    tone: "accent",
                  },
                ]}
              />
            </RenderIf>
          </div>
        </RenderIf>

        <RenderIf condition={joined}>
          <div className="mt-6 space-y-6">
            <Toolbar
              room={room}
              role={role as Role | null}
              mode={role === "presenter" ? (mode as Mode) : "-"}
              isStopped={isStopped}
              isPaused={isPaused}
              onPause={togglePause}
              onStop={stopPresenting}
              onResume={resumePresenting}
              onFullscreen={() => {
                const el = videoRef.current;
                if (!el) return;
                if (document.fullscreenElement) void document.exitFullscreen();
                else void el.requestFullscreen();
              }}
              pipSupported={isPiPAvailable}
              pipOn={pipOn}
              onPiP={togglePiP}
              onLeave={leave}
            />

            <VideoStage
              refEl={videoRef as React.RefObject<HTMLVideoElement>}
              role={role}
              tint={tint}
              showLoading={showLoading}
              showStoppedOverlay={showStoppedOverlay}
            />

            <Legend />
          </div>
        </RenderIf>
      </CardBody>
    </Card>
  );
}
