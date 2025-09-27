// app/api/health/route.ts
export const runtime = "edge";

export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: true, time: new Date().toISOString() }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
