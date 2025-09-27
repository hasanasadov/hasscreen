"use client";

import { useState } from "react";

export type LogLevel = "info" | "warn" | "error";
export type LogEntry = { t: number; level: LogLevel; msg: string };

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const push = (level: LogLevel, msg: string) =>
    setLogs((p) => [...p, { t: Date.now(), level, msg }].slice(-300));

  return {
    logs,
    info: (m: string) => push("info", m),
    warn: (m: string) => push("warn", m),
    error: (m: string) => push("error", m),
    clear: () => setLogs([]),
  };
}
