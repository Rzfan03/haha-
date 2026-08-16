import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.userId!;
    const { target_id } = await request.json();
    if (!target_id || target_id === userId) {
      return new Response(JSON.stringify({ error: "target tidak valid" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const db = serviceClient();
    const { data: target } = await db.from("users").select("id").eq("id", target_id).maybeSingle();
    if (!target) {
      return new Response(JSON.stringify({ error: "Pengguna tidak ditemukan" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const { data: existing } = await db
      .from("follows")
      .select("follower_id")
      .eq("follower_id", userId)
      .eq("following_id", target_id)
      .maybeSingle();

    if (existing) {
      await db.from("follows").delete().eq("follower_id", userId).eq("following_id", target_id);
      return new Response(JSON.stringify({ following: false }), { headers: { "Content-Type": "application/json" } });
    }

    await db.from("follows").insert({ follower_id: userId, following_id: target_id });
    return new Response(JSON.stringify({ following: true }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
