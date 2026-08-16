import type { APIRoute } from "astro";
import { serviceClient } from "../../../lib/auth";

export const GET: APIRoute = async ({ params, locals }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Post id wajib" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = serviceClient();
    const { data: post, error } = await db
      .from("posts")
      .select("*, categories(name, slug, emoji)")
      .eq("id", id)
      .single();
    if (error) throw error;

    let liked = false;
    let saved = false;
    if (locals.userId) {
      const [l, s] = await Promise.all([
        db.from("likes").select("post_id").eq("post_id", id).eq("user_id", locals.userId).maybeSingle(),
        db.from("bookmarks").select("post_id").eq("post_id", id).eq("user_id", locals.userId).maybeSingle(),
      ]);
      liked = !!l.data;
      saved = !!s.data;
    }

    const [c, r] = await Promise.all([
      db.from("comments").select("*, users!comments_user_id_fkey(avatar_url, is_verified)").eq("post_id", id).order("created_at", { ascending: false }).limit(50),
      db.from("posts").select("*, categories(name, slug, emoji)").neq("id", id).order("created_at", { ascending: false }).limit(4),
    ]);
    if (c.error) throw c.error;
    if (r.error) throw r.error;

    let author = null;
    let isFollowing = false;
    if (post?.user_id) {
      const { data: au } = await db
        .from("users")
        .select("id, display_name, avatar_url, banner_url, bio, is_verified, created_at")
        .eq("id", post.user_id)
        .maybeSingle();
      author = au;
      if (locals.userId && locals.userId !== post.user_id) {
        const { data: fl } = await db
          .from("follows")
          .select("follower_id")
          .eq("follower_id", locals.userId)
          .eq("following_id", post.user_id)
          .maybeSingle();
        isFollowing = !!fl;
      }
    }

    const viewer = locals.user
      ? { id: locals.user.id, display_name: locals.user.display_name, avatar_url: locals.user.avatar_url, is_verified: locals.user.is_verified }
      : null;

    return new Response(JSON.stringify({ post, comments: c.data ?? [], related: r.data ?? [], liked, saved, author, isFollowing, viewer }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
