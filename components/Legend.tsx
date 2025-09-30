export function Legend() {
  return (
    <div className="text-xs text-white/75 flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />{" "}
        Connected
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />{" "}
        Paused
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-sky-500" />{" "}
        Waiting
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-rose-500" />{" "}
        Stopped
      </span>
    </div>
  );
}
