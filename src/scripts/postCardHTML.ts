export interface RawPost {
  id: string | number;
  image_url: string;
  title?: string | null;
  categories?: { name?: string; slug?: string; emoji?: string } | null;
  like_count?: number;
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BOOKMARK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 text-ink" data-bookmark-icon aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';

export function postCardHTML(post: RawPost): string {
  const catEmoji = post.categories?.emoji ?? "🖼️";
  const catName = escapeHTML(post.categories?.name ?? "Meme");
  const title = post.title
    ? `<h3 class="absolute bottom-2 left-2 right-2 rounded-md bg-ink/65 px-3 py-1.5 text-center font-display text-[13px] font-medium leading-snug text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">${escapeHTML(post.title)}</h3>`
    : "";
  return `
    <article class="group relative mb-4 break-inside-avoid overflow-hidden rounded-md bg-white shadow-raised transition-all duration-300 hover:shadow-floating" data-card-actions data-post-id="${post.id}">
      <a href="/post/${post.id}" class="block">
        <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-ink-mute">
          <img src="${escapeHTML(post.image_url)}" alt="${escapeHTML(post.title ?? "Meme lucu")}" loading="lazy" decoding="async"
            class="max-h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
          <span class="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/85 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
            ${catEmoji} ${catName}
          </span>
          ${title}
        </div>
      </a>
      <div class="flex items-center justify-between gap-2 px-3 py-2.5">
        <button data-like-btn data-count="${post.like_count ?? 0}"
          class="flex h-11 items-center gap-1.5 rounded-md px-3 text-[13px] font-bold text-ink transition-colors duration-200 hover:bg-neutral active:scale-95"
          aria-label="Reaksi ngakak">
          <span data-like-emoji class="text-[16px] leading-none">😆</span>
          <span data-like-count class="min-w-4 text-center">${post.like_count ?? 0}</span>
        </button>
        <button data-bookmark-btn
          class="flex size-11 items-center justify-center rounded-md text-ink transition-all duration-200 hover:bg-neutral active:scale-95"
          aria-label="Simpan meme ini">
          ${BOOKMARK_SVG}
        </button>
      </div>
    </article>`;
}

export function revealCard(post: RawPost, i: number, visible = false): string {
  return `<div class="reveal${visible ? " is-visible" : ""}" style="transition-delay:${(i % 12) * 40}ms">${postCardHTML(post)}</div>`;
}
