import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/auth";

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = locals.userId!;
    const fd = await request.formData();
    const file = fd.get("file");
    const title = String(fd.get("title") ?? "").trim().slice(0, 100);
    const description = String(fd.get("description") ?? "").trim().slice(0, 500);
    const category_id = String(fd.get("category_id") ?? "");
    const rawTags = String(fd.get("tags") ?? "").trim();
    const tags = rawTags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 8);

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "File gambar wajib diisi" }), { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return new Response(JSON.stringify({ error: "Tipe file harus JPG, PNG, GIF, atau WebP" }), { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: "Ukuran file maksimal 8MB" }), { status: 400 });
    }
    if (!category_id) {
      return new Response(JSON.stringify({ error: "Pilih kategori dulu" }), { status: 400 });
    }

    const db = serviceClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await db.storage
      .from("memes")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadErr) {
      return new Response(JSON.stringify({ error: "Gagal upload ke storage: " + uploadErr.message }), { status: 500 });
    }

    const image_url = db.storage.from("memes").getPublicUrl(path).data.publicUrl;

    const { data, error: insertErr } = await db
      .from("posts")
      .insert({
        title: title || null,
        description: description || null,
        image_url,
        category_id,
        user_id: userId,
        tags: tags.length ? tags : null,
        like_count: 0,
      })
      .select()
      .single();

    if (insertErr) {
      await db.storage.from("memes").remove([path]);
      return new Response(JSON.stringify({ error: "Gagal simpan ke database: " + insertErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ post: data }), {
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
