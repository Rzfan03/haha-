import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user!;
    const { post_id, content } = await request.json();
    const text = String(content ?? "").trim().slice(0, 500);

    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id wajib" }), { status: 400 });
    }
    if (!text) {
      return new Response(JSON.stringify({ error: "Komentar tidak boleh kosong" }), { status: 400 });
    }

    const { data, error } = await serviceClient()
      .from("comments")
      .insert({ post_id, user_id: user.id, author_name: user.display_name, content: text })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ comment: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
