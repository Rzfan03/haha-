# HAHA! 😆 — Sosmed Meme

Pinterest-style social media untuk meme lucu. Upload, like, bookmark, dan komentar — semuanya tanpa login.

## Tech Stack

- **Astro v7** (SSR) + **Vercel adapter**
- **Tailwind CSS v4** (design system Pinterest-inspired)
- **Supabase** (Postgres + Storage, tanpa Auth — semua anonim)
- **astro-icon** (lucide icons)

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Environment variables

Salin `.env.example` ke `.env` dan isi kredensial Supabase kamu:

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Setup database

Buka **Supabase Dashboard → SQL Editor → New query**, lalu jalankan isi file:

```
supabase/schema.sql
```

Skrip ini membuat: tabel `categories`, `posts`, `likes`, `comments`, `bookmarks`, RLS policies, bucket storage `memes` (public), dan seed kategori awal.

### 4. Jalankan

```sh
npm run dev        # local: localhost:4321
npm run build      # build produksi (Vercel)
npx astro check    # type check
```

## Struktur

```
src/
├─ layouts/Layout.astro      # header + footer + upload modal + toast
├─ components/               # Header, MasonryGrid, PostCard, LoadMore,
│                            # UploadModal, LikeButton, BookmarkButton, CommentSection
├─ pages/
│  ├─ index.astro            # beranda (masonry grid)
│  ├─ search.astro           # pencarian
│  ├─ bookmarks.astro        # meme tersimpan (per perangkat)
│  ├─ post/[id].astro        # detail meme
│  ├─ category/[slug].astro  # filter kategori
│  ├─ tag/[slug].astro       # filter tag
│  └─ api/                   # upload, like, bookmark, comment, posts
└─ lib/                      # supabase client, tipe, client_id (localStorage)
```

## Deploy ke Vercel

1. Push repo ke GitHub, import di [vercel.com](https://vercel.com)
2. Tambahkan env vars `PUBLIC_SUPABASE_URL` dan `PUBLIC_SUPABASE_ANON_KEY`
3. Deploy — adapter `@astrojs/vercel` sudah terpasang
