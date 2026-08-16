import { revealCard } from "./postCardHTML";
import { bindCardActions } from "./cardActions";

export interface FeedConfig {
  url: string;
  gridId: string;
  skeletonId: string;
  emptyId?: string;
  moreWrapId?: string;
  countEl?: string;
  limit?: number;
}

export function initFeed(cfg: FeedConfig): void {
  const grid = document.getElementById(cfg.gridId) as HTMLElement;
  const skeleton = document.getElementById(cfg.skeletonId);
  const empty = cfg.emptyId ? document.getElementById(cfg.emptyId) : null;
  const moreWrap = cfg.moreWrapId ? document.getElementById(cfg.moreWrapId) : null;
  if (!grid) return;

  const limit = cfg.limit ?? 20;
  let offset = 0;

  async function fetchPage(off: number): Promise<unknown[]> {
    const sp = new URLSearchParams({ offset: String(off), limit: String(limit) });
    const base = new URL(cfg.url, location.origin);
    base.searchParams.forEach((v, k) => sp.set(k, v));
    const res = await fetch(`/api/posts?${sp.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat");
    return data.posts ?? [];
  }

  function setCount(n: number) {
    if (!cfg.countEl) return;
    const el = document.querySelector(cfg.countEl);
    if (el) el.textContent = String(n);
  }

  function showEmpty() {
    skeleton?.remove();
    grid.remove();
    moreWrap?.remove();
    empty?.classList.remove("hidden");
    empty?.classList.add("flex");
  }

  function append(posts: unknown[], visible: boolean) {
    const frag = document.createDocumentFragment();
    posts.forEach((post, i) => {
      const tmp = document.createElement("div");
      tmp.innerHTML = revealCard(post as any, i, visible);
      const el = tmp.firstElementChild as HTMLElement;
      if (!visible) requestAnimationFrame(() => el.classList.add("is-visible"));
      frag.appendChild(el);
    });
    grid.appendChild(frag);
    bindCardActions(grid);
  }

  function makeMoreBtn(): HTMLButtonElement | null {
    if (!moreWrap) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "flex h-12 items-center gap-2 rounded-md bg-white px-8 font-display text-[14px] font-medium text-ink shadow-raised transition-all duration-200 hover:bg-neutral hover:shadow-floating active:scale-95";
    btn.textContent = "Muat lebih banyak";
    moreWrap.classList.remove("hidden");
    moreWrap.classList.add("flex");
    moreWrap.appendChild(btn);
    return btn;
  }

  async function init() {
    try {
      const posts = await fetchPage(0);
      skeleton?.remove();
      if (!posts.length) {
        showEmpty();
        return;
      }
      setCount(posts.length);
      append(posts, true);
      offset = posts.length;

      const btn = makeMoreBtn();
      if (!btn) return;
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const more = await fetchPage(offset);
          if (!more.length) {
            moreWrap?.remove();
            return;
          }
          append(more, false);
          offset += more.length;
          setCount(offset);
        } catch {
          btn.textContent = "Gagal memuat. Coba lagi";
          setTimeout(() => (btn.textContent = "Muat lebih banyak"), 2500);
        } finally {
          btn.disabled = false;
        }
      });
    } catch {
      skeleton?.remove();
      if (empty) showEmpty();
      else grid.remove();
    }
  }

  init();
}
