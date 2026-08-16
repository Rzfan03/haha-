import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const GET: APIRoute = async ({ url, locals }) => {
  const post_id = url.searchParams.get("post_id");
  const userId = locals.userId;
  if (!post_id || !userId) {
    return new Response(JSON.stringify({ saved: false }), { headers: { "Content-Type": "application/json" } });
  }
  const { data } = await serviceClient().from("bookmarks").select("id").eq("post_id", post_id).eq("user_id", userId).maybeSingle();
  return new Response(JSON.stringify({ saved: !!data }), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.userId!;
    const { post_id } = await request.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id wajib" }), { status: 400 });
    }

    const db = serviceClient();
    const { data: existing } = await db
      .from("bookmarks")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await db.from("bookmarks").delete().eq("id", existing.id);
      return new Response(JSON.stringify({ saved: false }), { headers: { "Content-Type": "application/json" } });
    }

    await db.from("bookmarks").insert({ post_id, user_id: userId });
    return new Response(JSON.stringify({ saved: true }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
