// app/api/rtc/answer/route.ts
import { ROOMS, getRoom } from "../_store";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const room = u.searchParams.get("room") ?? "";
  if (!room) {
    return new Response(JSON.stringify({ error: "room required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const r = ROOMS.get(room);
  return new Response(JSON.stringify({ sdp: r?.answer ?? null }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      room?: string;
      sdp?: RTCSessionDescriptionInit;
    };
    const { room, sdp } = body;
    if (!room || !sdp) {
      return new Response("room and sdp required", { status: 400 });
    }
    const r = getRoom(room);
    r.answer = sdp;
    r.updatedAt = Date.now();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response("bad json", { status: 400 });
  }
}
