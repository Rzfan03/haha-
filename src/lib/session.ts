export interface ClientUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  created_at: string;
}

let cached: { user: ClientUser | null } | null = null;

export async function getSession(): Promise<{ user: ClientUser | null }> {
  if (cached) return cached;
  try {
    const res = await fetch("/api/auth/session", { headers: { Accept: "application/json" } });
    cached = (await res.json()) as { user: ClientUser | null };
  } catch {
    cached = { user: null };
  }
  return cached;
}

export function requireLoginUrl(): string {
  return `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

export async function redirectToLoginIfNeeded(): Promise<ClientUser | null> {
  const { user } = await getSession();
  if (!user) {
    window.location.href = requireLoginUrl();
    return null;
  }
  return user;
}
