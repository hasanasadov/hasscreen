// app/api/rtc/candidate/route.ts
import { ROOMS, getRoom } from "../_store";

export const runtime = "nodejs";

/**
 * POST body: { room, side: "offer"|"answer", candidate }
 * GET query: ?room=XXXX&side=offer|answer&since=NUMBER
 *  -> returns { items: [...], next: <new index> }
 */

export async function POST(req: Request) {
  try {
    const { room, side, candidate } = await req.json();
    if (!room || (side !== "offer" && side !== "answer") || !candidate)
      return new Response("room, side, candidate required", { status: 400 });

    const r = getRoom(room);
    if (side === "offer") r.offerCandidates.push(candidate);
    else r.answerCandidates.push(candidate);
    r.updatedAt = Date.now();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response("bad json", { status: 400 });
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const room = u.searchParams.get("room") || "";
  const side = u.searchParams.get("side") as "offer" | "answer" | null;
  const since = Number(u.searchParams.get("since") || 0);

  if (!room || (side !== "offer" && side !== "answer"))
    return new Response(JSON.stringify({ error: "room & side required" }), {
      status: 400,
    });

  const r = ROOMS.get(room);
  const arr =
    side === "offer" ? r?.offerCandidates ?? [] : r?.answerCandidates ?? [];
  const items = arr.slice(since);
  const next = arr.length;

  return new Response(JSON.stringify({ items, next }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
