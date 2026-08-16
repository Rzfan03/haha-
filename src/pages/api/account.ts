import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

const MAX_AVATAR = 2 * 1024 * 1024;
const MAX_BANNER = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

async function uploadMedia(
  db: ReturnType<typeof serviceClient>,
  folder: string,
  userId: string,
  file: File,
  maxBytes: number,
  label: string,
): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error(`${label} harus JPG, PNG, GIF, atau WebP`);
  if (file.size > maxBytes) throw new Error(`${label} maksimal ${Math.floor(maxBytes / 1024 / 1024)}MB`);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${userId}-${Date.now()}.${ext}`;

  const { data: existing } = await db.storage.from("memes").list(folder, { limit: 100 });
  const oldFiles = (existing ?? [])
    .filter((o) => o.name.startsWith(userId))
    .map((o) => `${folder}/${o.name}`);
  if (oldFiles.length) {
    await db.storage.from("memes").remove(oldFiles);
  }

  const { error } = await db.storage.from("memes").upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  return db.storage.from("memes").getPublicUrl(path).data.publicUrl;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.userId!;
    const isAdmin = locals.user?.is_admin === true;
    const db = serviceClient();

    const contentType = request.headers.get("content-type") ?? "";
    let displayName: string | null = null;
    let bio: string | null = null;
    let avatarUrl: string | null = null;
    let bannerUrl: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      displayName = body.display_name ? String(body.display_name).trim().slice(0, 30) : null;
      bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 160) : null;
    } else {
      const fd = await request.formData();
      if (typeof fd.get("display_name") === "string") {
        displayName = String(fd.get("display_name")).trim().slice(0, 30) || null;
      }
      if (typeof fd.get("bio") === "string") {
        bio = String(fd.get("bio")).trim().slice(0, 160);
      }
      const avatar = fd.get("avatar");
      if (avatar instanceof File && avatar.size > 0) avatarUrl = await uploadMedia(db, "avatars", userId, avatar, MAX_AVATAR, "Avatar");
      const banner = fd.get("banner");
      if (banner instanceof File && banner.size > 0) {
        if (banner.type === "image/gif" && !isAdmin) {
          return new Response(JSON.stringify({ error: "Banner GIF hanya untuk akun terverifikasi (admin)" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
        bannerUrl = await uploadMedia(db, "banners", userId, banner, MAX_BANNER, "Banner");
      }
    }

    const patch: Record<string, unknown> = {};
    if (displayName !== null) patch.display_name = displayName;
    if (bio !== null) patch.bio = bio;
    if (avatarUrl) patch.avatar_url = avatarUrl;
    if (bannerUrl) patch.banner_url = bannerUrl;

    const { data, error } = await db
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select("id, email, display_name, avatar_url, banner_url, bio, created_at")
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ user: data }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
