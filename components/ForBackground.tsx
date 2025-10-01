
export const Orbs = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-8 top-10 size-10 rounded-full bg-white/8 blur-md motion-safe:animate-float-y" />
      <div className="absolute right-10 top-24 size-8 rounded-full bg-white/10 blur-sm motion-safe:animate-float-x" />
      <div className="absolute left-1/2 bottom-10 size-12 -translate-x-1/2 rounded-full bg-white/7 blur-md motion-safe:animate-breathe" />
    </div>
  );
};

export const NoiseAndGrid = () => {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30 bg-noise"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 [mask-image:radial-gradient(65%_65%_at_50%_50%,black,transparent)]"
      >
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>
    </>
  );
};

export const Ribbons = () => {
  return (
    <div aria-hidden className="aurora pointer-events-none fixed inset-0 -z-40">
      <div className="absolute left-[-12%] top-[8%] h-[140vh] w-[38vw] rotate-12 bg-gradient-to-b from-indigo-500/35 via-transparent to-transparent blur-2xl motion-safe:animate-aurora" />
      <div className="absolute right-[-14%] top-[-6%] h-[140vh] w-[40vw] -rotate-12 bg-gradient-to-b from-fuchsia-500/30 via-transparent to-transparent blur-2xl motion-safe:animate-aurora" />
    </div>
  );
};

export const Glows = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50">
      <div className="absolute -top-40 -left-40 size-[48rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 size-[44rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
    </div>
  );
};



export const BackdropLayers = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50">
      <div className="absolute -top-32 -left-32 size-[44rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 size-[40rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[120px]" />
    </div>
  );
};
export const Beams = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-40 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
    >
      <div className="absolute -left-40 top-10 hidden h-[140vh] w-[40vw] rotate-12 bg-gradient-to-b from-indigo-500/30 via-transparent to-transparent blur-2xl motion-safe:block motion-safe:animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute -right-40 -top-10 hidden h-[140vh] w-[40vw] -rotate-12 bg-gradient-to-b from-fuchsia-500/25 via-transparent to-transparent blur-2xl motion-safe:block motion-safe:animate-[pulse_12s_ease-in-out_infinite]" />
    </div>
  );
};
export const Noise = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-30 opacity-[0.05] mix-blend-soft-light"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.55'/></svg>\")",
      }}
    />
  );
};
export const FaintGrid = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 [mask-image:radial-gradient(65%_65%_at_50%_50%,black,transparent)]"
    >
      <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>
  );
};
