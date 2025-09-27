// app/api/rtc/close/route.ts
import { ROOMS } from "../_store";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { room?: string };
    const { room } = body;
    if (!room) return new Response("room required", { status: 400 });

    const r = ROOMS.get(room);
    if (r) {
      r.offer = undefined;
      r.answer = undefined;
      r.offerCandidates = [];
      r.answerCandidates = [];
      r.stopped = true; // explicitly stopped
      r.updatedAt = Date.now();
      r.revision += 1;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response("bad json", { status: 400 });
  }
}
