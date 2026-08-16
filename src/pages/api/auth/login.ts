import type { APIRoute } from "astro";
import { createSession, normalizeEmail, serviceClient, verifyPassword } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    const db = serviceClient();
    const { data: user } = await db.from("users").select("id, email, password_hash").eq("email", email).maybeSingle();
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return new Response(JSON.stringify({ error: "Email atau password salah" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    await createSession(user.id, cookies);
    const { data: profile } = await db
      .from("users")
      .select("id, email, display_name, avatar_url, banner_url, bio, created_at")
      .eq("id", user.id)
      .single();

    return new Response(JSON.stringify({ user: profile }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
