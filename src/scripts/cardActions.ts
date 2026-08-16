import { redirectToLoginIfNeeded } from "../lib/session";

export function bindCardActions(root: ParentNode = document): void {
  const cards = root.querySelectorAll<HTMLElement>("[data-card-actions]");
  cards.forEach((card) => {
    if (card.dataset.cardsBound === "1") return;
    card.dataset.cardsBound = "1";

    const postId = card.dataset.postId!;
    const likeBtn = card.querySelector<HTMLButtonElement>("[data-like-btn]");
    const likeCountEl = likeBtn?.querySelector<HTMLElement>("[data-like-count]");
    const likeEmoji = likeBtn?.querySelector<HTMLElement>("[data-like-emoji]");
    const bookmarkBtn = card.querySelector<HTMLButtonElement>("[data-bookmark-btn]");
    const bookmarkIcon = bookmarkBtn?.querySelector<HTMLElement>("[data-bookmark-icon]");

    let liked = false;
    let saved = false;
    let likeCount = Number(likeBtn?.dataset.count || 0);

    function paintLike(animate: boolean) {
      likeBtn?.classList.toggle("bg-brand-soft", liked);
      [likeEmoji, likeCountEl].forEach((el) => {
        el?.classList.toggle("text-brand", liked);
        el?.classList.toggle("text-ink", !liked);
      });
      if (animate && likeEmoji) {
        likeEmoji.classList.remove("animate-pop");
        void likeEmoji.offsetWidth;
        likeEmoji.classList.add("animate-pop");
      }
    }

    function paintBookmark() {
      bookmarkIcon?.classList.toggle("text-brand", saved);
      bookmarkIcon?.classList.toggle("fill-brand", saved);
      bookmarkIcon?.classList.toggle("text-ink", !saved);
    }

    likeBtn?.addEventListener("click", async () => {
      if (likeBtn.disabled) return;
      if (!(await redirectToLoginIfNeeded())) return;
      likeBtn.disabled = true;
      const next = !liked;
      liked = next;
      likeCount += next ? 1 : -1;
      likeCountEl!.textContent = String(likeCount);
      paintLike(true);
      try {
        const res = await fetch("/api/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        liked = !next;
        likeCount += !next ? 1 : -1;
        likeCountEl!.textContent = String(likeCount);
        paintLike(false);
      } finally {
        likeBtn.disabled = false;
      }
    });

    bookmarkBtn?.addEventListener("click", async () => {
      if (bookmarkBtn.disabled) return;
      if (!(await redirectToLoginIfNeeded())) return;
      bookmarkBtn.disabled = true;
      const next = !saved;
      saved = next;
      paintBookmark();
      if (bookmarkIcon) {
        bookmarkIcon.classList.remove("animate-pop");
        void bookmarkIcon.offsetWidth;
        bookmarkIcon.classList.add("animate-pop");
      }
      try {
        const res = await fetch("/api/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId }),
        });
        if (!res.ok) throw new Error();
      } catch {
        saved = !next;
        paintBookmark();
      } finally {
        bookmarkBtn.disabled = false;
      }
    });
  });
}
