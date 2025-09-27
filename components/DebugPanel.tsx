"use client";

import React from "react";
import type { LogEntry } from "./useLogger";

type Role = "presenter" | "viewer";
type Mode = "mirror" | "extend";

export default function DebugPanel({
  logs,
  room,
  role,
  mode,
  joined,
  status,
  pc,
  hasRemote,
  isStopped,
  onClose,
  onClear,
}: {
  logs: LogEntry[];
  room: string;
  role: Role | null;
  mode: Mode;
  joined: boolean;
  status: string;
  pc: RTCPeerConnection | null;
  hasRemote: boolean;
  isStopped: boolean;
  onClose: () => void;
  onClear: () => void;
}) {
  const conn = pc?.connectionState ?? "-";
  const ice = pc?.iceConnectionState ?? "-";
  const sig = pc?.signalingState ?? "-";
  const senders = pc ? pc.getSenders().length : 0;
  const receivers = pc ? pc.getReceivers().length : 0;
  const transceivers = pc ? pc.getTransceivers().length : 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900/80 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-white/10">
        <div className="text-white/90 font-semibold">Debug</div>
        <div className="flex gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm border border-white/10"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <div className="text-white/70">Room</div>
        <div className="font-medium text-white/90">{room || "-"}</div>

        <div className="text-white/70">Role</div>
        <div className="font-medium text-white/90">{role ?? "-"}</div>

        <div className="text-white/70">Mode</div>
        <div className="font-medium text-white/90">
          {role === "presenter" ? mode : "-"}
        </div>

        <div className="text-white/70">Joined</div>
        <div className="font-medium text-white/90">{joined ? "yes" : "no"}</div>

        <div className="text-white/70">Status</div>
        <div className="font-medium text-white/90">{status}</div>

        <div className="text-white/70">Stopped</div>
        <div className="font-medium text-white/90">
          {isStopped ? "yes" : "no"}
        </div>

        <div className="text-white/70">Has Remote</div>
        <div className="font-medium text-white/90">
          {hasRemote ? "yes" : "no"}
        </div>

        <div className="text-white/70">PC Connection</div>
        <div className="font-medium text-white/90">{conn}</div>

        <div className="text-white/70">ICE</div>
        <div className="font-medium text-white/90">{ice}</div>

        <div className="text-white/70">Signaling</div>
        <div className="font-medium text-white/90">{sig}</div>

        <div className="text-white/70">Senders</div>
        <div className="font-medium text-white/90">{senders}</div>

        <div className="text-white/70">Receivers</div>
        <div className="font-medium text-white/90">{receivers}</div>

        <div className="text-white/70">Transceivers</div>
        <div className="font-medium text-white/90">{transceivers}</div>
      </div>

      <div className="mt-2 p-3 pt-0 flex-1 overflow-auto">
        <div className="rounded-xl border border-white/10 bg-black/30">
          {logs.length === 0 ? (
            <div className="p-3 text-white/60 text-sm">No logs yet.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {logs.map((l, i) => (
                <li key={i} className="p-2">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 inline-block h-2 w-2 rounded-full ${
                        l.level === "info"
                          ? "bg-sky-400"
                          : l.level === "warn"
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <div>
                      <div className="text-white/60 text-[11px]">
                        {new Date(l.t).toLocaleTimeString()}
                      </div>
                      <div className="text-white/90 whitespace-pre-wrap break-words">
                        {l.msg}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
