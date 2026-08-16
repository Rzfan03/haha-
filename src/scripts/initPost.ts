import { bindCardActions } from "./cardActions";
import { revealCard } from "./postCardHTML";
import { redirectToLoginIfNeeded } from "../lib/session";

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const timeFmt = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
function timeAgo(date: string): string {
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "baru saja";
  if (abs < 3600) return timeFmt.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return timeFmt.format(Math.round(diff / 3600), "hour");
  if (abs < 604800) return timeFmt.format(Math.round(diff / 86400), "day");
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const VERIFIED_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
const USER_PLUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>';
const USER_CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>';

function avatarWrap(url: string | null, name: string, wrapClass: string): string {
  const initial = escapeHTML(name.charAt(0).toUpperCase());
  const inner = url
    ? `<img src="${escapeHTML(url)}" alt="" class="size-full rounded-full object-cover" />`
    : initial;
  return `<span class="flex ${wrapClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-white">${inner}</span>`;
}

function renderPost(data: any): string {
  const { post, comments, related, liked, saved, author, isFollowing, viewer } = data;

  const cat = post.categories
    ? `<a href="/category/${escapeHTML(post.categories.slug)}" class="flex items-center gap-1.5 rounded-md bg-offwhite px-4 py-2 text-[12px] font-bold text-ink transition-colors hover:bg-neutral">${escapeHTML(post.categories.emoji ?? "🖼️")} ${escapeHTML(post.categories.name ?? "Meme")}</a>`
    : "";
  const date = new Date(post.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const desc = post.description ? `<p class="mb-4 whitespace-pre-line text-[14px] leading-relaxed text-ink">${escapeHTML(post.description)}</p>` : "";
  const tags = post.tags?.length
    ? `<div class="mt-4 flex flex-wrap gap-2">${post.tags.map((t: string) => `<a href="/tag/${encodeURIComponent(t)}" class="rounded-md bg-brand-soft px-3 py-2 text-[12px] font-bold text-brand transition-colors hover:bg-brand/20">#${escapeHTML(t)}</a>`).join("")}</div>`
    : "";

  const authorCard = author
    ? `<section class="mb-6 flex items-center gap-4 rounded-md bg-white p-5 shadow-raised">
        <a href="/user/${author.id}" class="group flex min-w-0 items-center gap-3">
          ${avatarWrap(author.avatar_url, author.display_name, "size-14 text-[18px] font-bold")}
          <span class="min-w-0">
            <span class="flex items-center gap-1.5 font-display text-[16px] font-semibold text-ink transition-colors group-hover:text-brand">${escapeHTML(author.display_name)}${author.is_verified ? VERIFIED_SVG : ""}</span>
            <span class="block truncate text-[12px] text-ink-soft">${author.bio ? escapeHTML(author.bio) : "Pembuat meme lucu"}</span>
          </span>
        </a>
        ${followBtnHTML(author, viewer, isFollowing)}
      </section>`
    : "";

  const bookmarkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 text-ink" data-bookmark-icon aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';

  const postCard = `<div class="overflow-hidden rounded-md bg-white shadow-floating">
    <div class="flex items-center justify-center bg-ink-mute">
      <img src="${escapeHTML(post.image_url)}" alt="${escapeHTML(post.title ?? "Meme")}" class="aspect-[4/3] w-full object-contain sm:aspect-auto sm:max-h-[70vh]" />
    </div>
    <div class="p-6 sm:p-8">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        ${cat}
        <span class="ml-auto flex items-center gap-1.5 text-[12px] text-ink-soft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          ${date}
        </span>
      </div>
      <h1 class="mb-2 font-display text-[26px] font-semibold leading-tight text-ink">${escapeHTML(post.title ?? "Meme lucu")}</h1>
      ${desc}
      ${tags}
      <div class="mt-6 flex items-center justify-center gap-3 border-t border-neutral pt-6">
        <div data-card-actions data-post-id="${post.id}" data-liked="${liked}" data-saved="${saved}" class="flex items-center gap-3">
          <button data-like-btn data-count="${post.like_count ?? 0}" class="flex h-14 items-center gap-2 rounded-md bg-white px-7 font-display text-[17px] font-medium text-ink shadow-raised transition-all duration-200 hover:bg-neutral hover:shadow-floating active:scale-90" aria-label="Reaksi ngakak" aria-pressed="${liked}">
            <span data-like-emoji class="text-[20px] leading-none">😆</span>
            <span data-like-count class="min-w-4 text-center">${post.like_count ?? 0}</span>
            <span class="font-sans text-[13px] font-bold text-ink-soft">Ngakak</span>
          </button>
          <button data-bookmark-btn class="flex size-14 items-center justify-center rounded-md bg-white text-ink shadow-raised transition-all duration-200 hover:bg-neutral hover:shadow-floating active:scale-90" aria-label="Simpan meme ini" aria-pressed="${saved}">
            ${bookmarkIcon}
          </button>
        </div>
      </div>
    </div>
  </div>`;

  const commentsHTML = renderComments(post, comments, viewer);
  const relatedHTML = related.length
    ? `<section class="mt-12"><h2 class="mb-6 font-display text-[20px] font-semibold text-ink">Meme lainnya</h2><div id="related-grid" class="columns-1 gap-4 sm:columns-2">${related.map((p: any, i: number) => revealCard(p, i, true)).join("")}</div></section>`
    : "";

  return authorCard + postCard + commentsHTML + relatedHTML;
}

function followBtnHTML(author: any, viewer: any, isFollowing: boolean): string {
  if (!viewer || author.id === viewer.id) return "";
  const following = !!isFollowing;
  const base =
    "flex h-12 shrink-0 items-center gap-2 rounded-md px-6 font-display text-[14px] font-medium transition-all duration-200 active:scale-95";
  const style = following ? "bg-brand-soft text-brand hover:bg-brand/20" : "bg-brand text-white hover:bg-brand-hover";
  return `<button type="button" data-follow-btn data-target="${author.id}" data-following="${following}" class="${base} ${style}">
    <span data-follow-icon>${following ? USER_CHECK_SVG : USER_PLUS_SVG}</span>
    <span data-follow-text>${following ? "Mengikuti" : "Follow"}</span>
  </button>`;
}

function renderComments(post: any, comments: any[], viewer: any): string {
  const list = comments
    .map((c) => {
      const name = escapeHTML(c.author_name ?? "Anonim");
      const avatar = c.users?.avatar_url
        ? `<span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-[12px] font-bold text-white"><img src="${escapeHTML(c.users.avatar_url)}" alt="" class="size-full rounded-full object-cover" /></span>`
        : `<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">${escapeHTML((c.author_name || "A").charAt(0).toUpperCase())}</span>`;
      return `<li class="flex gap-3 rounded-md bg-offwhite p-4">
        ${avatar}
        <div class="min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="flex items-center gap-1 text-[12px] font-bold text-ink">${name}${c.user_id && c.users?.is_verified ? VERIFIED_SVG : ""}</span>
            <span class="text-[12px] text-ink-soft">${timeAgo(c.created_at)}</span>
          </div>
          <p class="mt-1 text-[14px] text-ink">${escapeHTML(c.content)}</p>
        </div>
      </li>`;
    })
    .join("");

  const empty = comments.length === 0
    ? `<div id="comment-empty" class="mb-6 flex flex-col items-center gap-2 rounded-md bg-offwhite px-6 py-10 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-8 text-ink-soft"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
        <p class="text-[14px] font-bold text-ink">Belum ada komentar</p>
        <p class="text-[12px] text-ink-soft">Jadi yang pertama kasih komentar lucu!</p>
      </div>`
    : "";

  const form = viewer
    ? `<form id="comment-form" data-post-id="${post.id}" data-user-name="${escapeHTML(viewer.display_name)}" data-user-verified="${viewer.is_verified}" data-user-avatar="${escapeHTML(viewer.avatar_url ?? "")}" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          ${avatarWrap(viewer.avatar_url, viewer.display_name, "size-9 text-[13px] font-bold")}
          <span class="text-[13px] font-bold text-ink">${escapeHTML(viewer.display_name)}</span>
        </div>
        <textarea id="comment-content" name="content" rows="3" required maxlength="500" placeholder="Tulis komentar lucu..." class="w-full resize-none rounded-md border border-[#919190] bg-white px-4 py-3 text-[14px] text-ink outline-none transition-all placeholder:text-ink-soft focus:border-ink focus:ring-2 focus:ring-brand"></textarea>
        <div class="flex justify-end">
          <button type="submit" class="flex h-12 items-center gap-2 rounded-md bg-brand px-6 text-[14px] text-white transition-colors duration-200 hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:bg-neutral disabled:text-ink-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            Kirim
          </button>
        </div>
      </form>`
    : `<a href="/login?next=${encodeURIComponent(`/post/${post.id}`)}" class="flex h-12 items-center justify-center gap-2 rounded-md bg-offwhite px-6 text-[14px] font-bold text-brand transition-colors hover:bg-neutral">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
        Login untuk berkomentar
      </a>`;

  return `<section class="rounded-md bg-white p-6 shadow-raised">
    <h2 class="mb-6 flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 text-brand"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      Komentar <span id="comment-count" class="text-ink-soft">(${comments.length})</span>
    </h2>
    <ul id="comment-list" class="mb-6 space-y-4" aria-live="polite">${list}</ul>
    ${empty}
    ${form}
  </section>`;
}

export async function initPost(id: string): Promise<void> {
  const root = document.getElementById("post-root") as HTMLElement | null;
  const notFound = document.getElementById("post-notfound");
  if (!root) return;

  try {
    const res = await fetch(`/api/post/${id}`);
    const data = await res.json();
    if (!res.ok || !data.post) throw new Error(data.error || "Meme tidak ditemukan");
    root.innerHTML = renderPost(data);
    bindInteractions(root);
  } catch {
    root.remove();
    notFound?.classList.remove("hidden");
    notFound?.classList.add("flex");
  }
}

function bindInteractions(root: HTMLElement): void {
  bindCardActions(root);

  const followBtn = root.querySelector<HTMLButtonElement>("[data-follow-btn]");
  followBtn?.addEventListener("click", async () => {
    if (followBtn.disabled) return;
    if (!(await redirectToLoginIfNeeded())) return;
    const target = followBtn.dataset.target!;
    followBtn.disabled = true;
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: target }),
      });
      const resp = await res.json();
      if (!res.ok) throw new Error(resp.error || "Gagal follow");
      const following = resp.following === true;
      followBtn.dataset.following = String(following);
      followBtn.classList.toggle("bg-brand", !following);
      followBtn.classList.toggle("text-white", !following);
      followBtn.classList.toggle("hover:bg-brand-hover", !following);
      followBtn.classList.toggle("bg-brand-soft", following);
      followBtn.classList.toggle("text-brand", following);
      followBtn.classList.toggle("hover:bg-brand/20", following);
      const icon = followBtn.querySelector("[data-follow-icon]")!;
      const text = followBtn.querySelector("[data-follow-text]")!;
      icon.innerHTML = following ? USER_CHECK_SVG : USER_PLUS_SVG;
      text.textContent = following ? "Mengikuti" : "Follow";
    } catch (err) {
      window.dispatchEvent(new CustomEvent("haha:toast", { detail: { message: (err as Error).message, type: "error" } }));
    } finally {
      followBtn.disabled = false;
    }
  });

  const form = root.querySelector<HTMLFormElement>("#comment-form");
  if (form) {
    const list = root.querySelector("#comment-list") as HTMLElement;
    const countEl = root.querySelector("#comment-count") as HTMLElement;
    const contentInput = root.querySelector("#comment-content") as HTMLTextAreaElement;
    const commentEmpty = root.querySelector("#comment-empty");
    const pid = form.dataset.postId;
    const userName = form.dataset.userName || "Pengguna";
    const userVerified = form.dataset.userVerified === "true";
    const userAvatar = form.dataset.userAvatar || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = contentInput.value.trim();
      if (!content) return;

      const submitBtn = form.querySelector("button[type=submit]") as HTMLButtonElement;
      submitBtn.disabled = true;
      try {
        const res = await fetch("/api/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: pid, content }),
        });
        const resp = await res.json();
        if (!res.ok) throw new Error(resp.error || "Gagal kirim");
        contentInput.value = "";
        const li = document.createElement("li");
        li.className = "flex gap-3 rounded-md bg-offwhite p-4 animate-fade-up";
        li.innerHTML = `
          ${userAvatar
            ? `<span class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-[12px] font-bold text-white"><img src="${userAvatar}" alt="" class="size-full rounded-full object-cover" /></span>`
            : `<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">${escapeHTML(userName.charAt(0).toUpperCase())}</span>`}
          <div class="min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="flex items-center gap-1 text-[12px] font-bold text-ink" id="comment-author"></span>
              <span class="text-[12px] text-ink-soft">baru saja</span>
            </div>
            <p class="mt-1 text-[14px] text-ink"></p>
          </div>`;
        li.querySelector("#comment-author")!.textContent = userName;
        if (userVerified) {
          const badge = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          badge.setAttribute("class", "size-3.5 shrink-0");
          badge.setAttribute("viewBox", "0 0 24 24");
          badge.setAttribute("fill", "none");
          badge.setAttribute("stroke", "#3B82F6");
          badge.setAttribute("stroke-width", "2");
          badge.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
          li.querySelector("#comment-author")!.appendChild(badge);
        }
        li.querySelector("p")!.textContent = content;
        list.prepend(li);
        commentEmpty?.remove();
        const n = Number(countEl.textContent?.replace(/[()]/g, "") || 0) + 1;
        countEl.textContent = `(${n})`;
        window.dispatchEvent(new CustomEvent("haha:toast", { detail: { message: "Komentar terkirim! 💬" } }));
      } catch (err) {
        window.dispatchEvent(new CustomEvent("haha:toast", { detail: { message: (err as Error).message, type: "error" } }));
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
}
