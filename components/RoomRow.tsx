import { Button, Input } from "./ui";

export function RoomRow({
  room,
  setRoom,
  buttons,
}: {
  room: string;
  setRoom: (v: string) => void;
  buttons: {
    label: string;
    onClick: () => void;
    tone?: "primary" | "accent" | "ok" | "default";
  }[];
}) {
  const toneClass = (t?: "primary" | "accent" | "ok" | "default") =>
    t === "primary"
      ? "bg-indigo-600/90 hover:bg-indigo-600"
      : t === "accent"
      ? "bg-sky-600/90 hover:bg-sky-600"
      : t === "ok"
      ? "bg-emerald-600/90 hover:bg-emerald-600"
      : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(3,auto)] gap-2">
      <Input
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Otaq kodu (8 rəqəm)"
        maxLength={8}
        value={room}
        onChange={(e) => setRoom(e.target.value.replace(/\D/g, "").slice(0, 8))}
      />
      {buttons.map((b, i) => (
        <Button key={i} onClick={b.onClick} className={toneClass(b.tone)}>
          {b.label}
        </Button>
      ))}
    </div>
  );
}
