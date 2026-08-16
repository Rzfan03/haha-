-- ============================================================
-- HAHA! — Sosmed Meme Schema (v2, dengan autentikasi)
-- Jalankan di Supabase Dashboard → SQL Editor → New query → Run
--
-- CATATAN UPGRADE:
-- Jika sebelumnya sudah pernah menjalankan schema v1 (yang memakai
-- client_id di likes/bookmarks), HAPUS dulu tabel lama ini lalu
-- jalankan ulang seluruh file:
--
--   drop table if exists public.bookmarks;
--   drop table if exists public.likes;
--   drop table if exists public.comments;
--   drop table if exists public.posts;
--   drop table if exists public.categories;
--   drop table if exists public.sessions;
--   drop table if exists public.users;
-- ============================================================

-- ---------- USERS ----------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null default 'Pengguna',
  avatar_url text,
  banner_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- ---------- FOLLOWS ----------
create table if not exists public.follows (
  follower_id uuid not null references public.users (id) on delete cascade,
  following_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- ---------- SESSIONS ----------
-- token_hash = sha256 dari token acak 32 byte yang dikirim via cookie.
-- Token mentah TIDAK disimpan di database (jadi aman walau DB bocor).
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on public.sessions (user_id);
create index if not exists sessions_token_idx on public.sessions (token_hash);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  emoji text default '😆'
);

-- ---------- POSTS ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text not null,
  category_id uuid references public.categories (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  tags text[] default '{}',
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists user_id uuid references public.users (id) on delete set null;

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_tags_idx on public.posts using gin (tags);

-- ---------- LIKES (wajib login, terikat user) ----------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  author_name text default 'Anonim',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at desc);

-- ---------- BOOKMARKS (wajib login, terikat user) ----------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id);

alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists banner_url text;
alter table public.users add column if not exists bio text;

-- Fitur verified account: is_verified = lencana centang biru (diatur admin),
-- is_admin = akun admin (diatur manual via SQL di bawah).
alter table public.users add column if not exists is_admin boolean not null default false;
alter table public.users add column if not exists is_verified boolean not null default false;

-- Menjadikan akun admin (ganti email-nya):
-- update public.users set is_admin = true where email = 'email@kamu.com';

-- ---------- RPC: update like_count ----------
create or replace function public.increment_like_count(row_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set like_count = like_count + 1 where id = row_id;
end;
$$;

create or replace function public.decrement_like_count(row_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set like_count = greatest(like_count - 1, 0) where id = row_id;
end;
$$;

grant execute on function public.increment_like_count(uuid) to anon, authenticated;
grant execute on function public.decrement_like_count(uuid) to anon, authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.follows enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.bookmarks enable row level security;

-- Data akun & session TIDAK boleh dibaca publik
-- (akses hanya via service role di server).

-- Semua orang boleh lihat konten
drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select using (true);
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (true);
drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (true);

-- Tulis hanya lewat API server (service role), bukan langsung dari browser.
-- Likes/bookmarks/comments/posts tidak punya policy insert/delete publik.

-- ---------- STORAGE BUCKET ----------
insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do nothing;

-- Bisa baca (public bucket sudah otomatis, tapi pastikan)
drop policy if exists "memes public read" on storage.objects;
create policy "memes public read"
  on storage.objects for select
  using (bucket_id = 'memes');

-- Upload hanya lewat server (service role) — policy tidak diberikan ke anon.

-- ---------- SEED KATEGORI ----------
insert into public.categories (name, slug, emoji) values
  ('Lucu', 'lucu', '😂'),
  ('Wajib Ngakak', 'wajib-ngakak', '💀'),
  ('Relatable', 'relatable', '🥲'),
  ('Gagal Paham', 'gagal-paham', '😤'),
  ('Gaming', 'gaming', '👾'),
  ('Sosmed', 'sosmed', '📱'),
  ('Hewan', 'hewan', '🐱'),
  ('Film & Series', 'film-series', '🎬'),
  ('Makanan', 'makanan', '🍜'),
  ('Kerja', 'kerja', '💼')
on conflict (slug) do nothing;
