import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { AstroCookies } from "astro";

export const SESSION_COOKIE = "haha_session";
const SESSION_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
}

const serviceUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export function serviceClient() {
  if (!serviceUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di .env (server-only)");
  }
  return createClient(serviceUrl, serviceKey);
}

/* ---------- password ---------- */

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ---------- token & session ---------- */

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function cookieOptions(): Parameters<AstroCookies["set"]>[2] {
  return {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  };
}

export async function createSession(userId: string, cookies: AstroCookies): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString();
  const { error } = await serviceClient().from("sessions").insert({
    user_id: userId,
    token_hash: sha256(token),
    expires_at: expiresAt,
  });
  if (error) throw error;
  cookies.set(SESSION_COOKIE, token, cookieOptions());
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await serviceClient().from("sessions").delete().eq("token_hash", sha256(token));
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function getUserFromCookies(cookies: AstroCookies): Promise<AuthUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { data } = await serviceClient()
      .from("sessions")
      .select("user_id, expires_at")
      .eq("token_hash", sha256(token))
      .maybeSingle();
    if (!data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) {
      await serviceClient().from("sessions").delete().eq("token_hash", sha256(token));
      return null;
    }
    const { data: user } = await serviceClient()
      .from("users")
      .select("id, email, display_name, avatar_url, banner_url, bio, is_admin, is_verified, created_at")
      .eq("id", data.user_id)
      .single();
    return (user as AuthUser) ?? null;
  } catch {
    return null;
  }
}

/* ---------- user helpers ---------- */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegister(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email tidak valid";
  if (password.length < 8) return "Password minimal 8 karakter";
  return null;
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const { data } = await serviceClient()
      .from("users")
      .select("id, email, display_name, avatar_url, banner_url, bio, is_admin, is_verified, created_at")
      .eq("id", id)
      .maybeSingle();
    return (data as AuthUser) ?? null;
  } catch {
    return null;
  }
}
