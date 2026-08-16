import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const GET: APIRoute = async ({ url, locals }) => {
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");
  const bookmarks = url.searchParams.get("bookmarks") === "true";
  const userId = url.searchParams.get("user_id") ?? locals.userId;

  try {
    let query = serviceClient()
      .from("posts")
      .select("*, categories(name, slug, emoji)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      const { data: cat } = await serviceClient().from("categories").select("id").eq("slug", category).single();
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (tag) query = query.contains("tags", [tag]);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    if (bookmarks && userId) {
      const { data: marks } = await serviceClient().from("bookmarks").select("post_id").eq("user_id", userId);
      const ids = (marks ?? []).map((m) => m.post_id);
      if (ids.length === 0) {
        return new Response(JSON.stringify({ posts: [] }), { headers: { "Content-Type": "application/json" } });
      }
      query = query.in("id", ids);
    }
    if (userId && !bookmarks) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify({ posts: data ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
