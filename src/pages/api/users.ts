import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 20);

  try {
    let query = serviceClient()
      .from("users")
      .select("id, display_name, avatar_url, banner_url, bio, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (q) query = query.ilike("display_name", `%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify({ users: data ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
