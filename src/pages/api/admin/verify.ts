import type { APIRoute } from "astro";
import { serviceClient } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user?.is_admin) {
      return new Response(JSON.stringify({ error: "Hanya admin" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const targetId = typeof body.user_id === "string" ? body.user_id : "";
    const verified = body.verified === true;

    if (!targetId) return new Response(JSON.stringify({ error: "user_id wajib diisi" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const db = serviceClient();
    const { data, error } = await db
      .from("users")
      .update({ is_verified: verified })
      .eq("id", targetId)
      .select("id, display_name, is_verified")
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ user: data }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
