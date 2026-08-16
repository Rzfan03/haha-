import type { APIRoute } from "astro";
import { createSession, hashPassword, normalizeEmail, serviceClient, validateRegister } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const displayName = String(body.display_name ?? "").trim().slice(0, 30) || email.split("@")[0];

    const error = validateRegister(email, password);
    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const db = serviceClient();
    const { data: existing } = await db.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409, headers: { "Content-Type": "application/json" } });
    }

    const { data: user, error: insertError } = await db
      .from("users")
      .insert({ email, password_hash: await hashPassword(password), display_name: displayName })
      .select("id, email, display_name, avatar_url, banner_url, bio, created_at")
      .single();

    if (insertError) throw insertError;

    await createSession(user.id, cookies);
    return new Response(JSON.stringify({ user }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
