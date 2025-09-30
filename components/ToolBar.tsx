import { cx, glass } from "@/lib/helpers";
import { Button, Tag } from "./ui";
import { Mode, Role } from "@/types";

export function Toolbar({
  room,
  role,
  mode,
  isStopped,
  isPaused,
  onPause,
  onStop,
  onResume,
  onFullscreen,
  pipSupported,
  pipOn,
  onPiP,
  onLeave,
}: {
  room: string;
  role: Role | null;
  mode: string | Mode;
  isStopped: boolean;
  isPaused: boolean;
  onPause: () => void;
  onStop: () => void;
  onResume: () => void;
  onFullscreen: () => void;
  pipSupported: boolean;
  pipOn: boolean;
  onPiP: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className={cx(
        glass.panel,
        "p-3 flex flex-col lg:flex-row lg:items-center gap-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag>Room: {room || "-"}</Tag>
        <Tag>Role: {role ?? "-"}</Tag>
        <Tag>Mode: {mode}</Tag>
      </div>
      <div className="flex-1" />
      <div className="flex flex-wrap items-center gap-2">
        {role === "viewer" && (
          <Button
            className="bg-emerald-600/90 hover:bg-emerald-600"
            onClick={onFullscreen}
          >
            Fullscreen
          </Button>
        )}
        {role === "presenter" && !isStopped && (
          <>
            <Button
              className={isPaused ? "bg-amber-600/90 hover:bg-amber-600" : ""}
              onClick={onPause}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              className="bg-amber-600/90 hover:bg-amber-600"
              onClick={onStop}
            >
              Stop
            </Button>
          </>
        )}
        {role === "presenter" && isStopped && (
          <Button
            className="bg-emerald-600/90 hover:bg-emerald-600"
            onClick={onResume}
          >
            Resume
          </Button>
        )}
        {pipSupported && (
          <Button className={pipOn ? "bg-white/20" : ""} onClick={onPiP}>
            {pipOn ? "Exit PiP" : "Picture-in-Picture"}
          </Button>
        )}
        <Button className="bg-rose-600/90 hover:bg-rose-600" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </div>
  );
}
