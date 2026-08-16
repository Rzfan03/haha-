import { redirectToLoginIfNeeded } from "../lib/session";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const VERIFIED_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

function userRowHTML(u: any, viewerId: string | null): string {
  const showBtn = viewerId && viewerId !== u.id;
  const following = u.following;
  return `<li class="flex items-center justify-between gap-3 rounded-md bg-white p-4 shadow-raised">
    <a href="/user/${esc(u.id)}" class="flex min-w-0 items-center gap-3">
      <span class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand text-[15px] font-bold text-white">
        ${u.avatar_url ? `<img src="${esc(u.avatar_url)}" alt="" class="size-full rounded-md object-cover" />` : esc(u.display_name.charAt(0).toUpperCase())}
      </span>
      <span class="flex min-w-0 items-center gap-1 text-[14px] font-bold text-ink">
        <span class="truncate">${esc(u.display_name)}</span>
        ${u.is_verified ? VERIFIED_SVG : ""}
      </span>
    </a>
    ${
      showBtn
        ? `<button class="follow-btn flex h-10 shrink-0 items-center rounded-md px-5 text-[13px] font-bold transition-all duration-200" data-user-id="${esc(u.id)}" data-following="${following}">${following ? "Mengikuti" : "Ikuti"}</button>`
        : ""
    }
  </li>`;
}

function bindFollowButtons(root: ParentNode): void {
  root.querySelectorAll<HTMLButtonElement>(".follow-btn").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    const userId = btn.dataset.userId!;
    let following = btn.dataset.following === "true";

    function paint() {
      btn.classList.toggle("bg-brand", !following);
      btn.classList.toggle("text-white", !following);
      btn.classList.toggle("bg-offwhite", following);
      btn.classList.toggle("text-ink", following);
      btn.textContent = following ? "Mengikuti" : "Ikuti";
    }

    btn.addEventListener("click", async () => {
      if (!(await redirectToLoginIfNeeded())) return;
      btn.disabled = true;
      const next = !following;
      following = next;
      paint();
      try {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_id: userId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        following = !next;
        paint();
      } finally {
        btn.disabled = false;
      }
    });
  });
}

export function initUserList(id: string, kind: "followers" | "following"): void {
  const list = document.getElementById("user-list") as HTMLElement | null;
  const empty = document.getElementById("user-empty");
  if (!list) return;

  (async () => {
    try {
      const res = await fetch(`/api/user-list?id=${encodeURIComponent(id)}&kind=${kind}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat");
      const users = (data.users ?? []).map((u: any) => ({ ...u, following: (data.followingIds ?? []).includes(u.id) }));
      const viewerId: string | null = data.viewerId ?? null;

      if (!users.length) {
        list.remove();
        empty?.classList.remove("hidden");
        empty?.classList.add("flex");
        return;
      }

      list.innerHTML = users.map((u: any) => userRowHTML(u, viewerId)).join("");
      bindFollowButtons(list);
    } catch {
      list.remove();
      empty?.classList.remove("hidden");
      empty?.classList.add("flex");
    }
  })();
}
