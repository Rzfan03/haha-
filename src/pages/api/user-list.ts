import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const GET: APIRoute = async ({ url, locals }) => {
  const id = url.searchParams.get("id");
  const kind = url.searchParams.get("kind") === "following" ? "following" : "followers";

  if (!id) {
    return new Response(JSON.stringify({ error: "Parameter id wajib" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = serviceClient();
    const view = kind === "followers" ? "following_id" : "follower_id";
    const target = kind === "followers" ? "follower_id" : "following_id";

    const { data: rows, error } = await client
      .from("follows")
      .select(`follower_id, following_id`)
      .eq(view, id);

    if (error) throw error;

    const ids = (rows ?? []).map((r) => r[target]);
    let users: unknown[] = [];
    if (ids.length > 0) {
      const { data, error: uErr } = await client
        .from("users")
        .select("id, display_name, avatar_url, banner_url, bio, is_verified, created_at")
        .in("id", ids);
      if (uErr) throw uErr;
      users = data ?? [];
    }

    let followingIds: string[] = [];
    if (locals.userId) {
      const { data: fl } = await client.from("follows").select("following_id").eq("follower_id", locals.userId);
      followingIds = (fl ?? []).map((r) => r.following_id);
    }

    return new Response(JSON.stringify({ users, followingIds, viewerId: locals.userId, ownerId: id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
