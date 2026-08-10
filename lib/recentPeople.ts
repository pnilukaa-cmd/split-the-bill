const STORAGE_KEY = "split-the-bill:recent-people";
const MAX_RECENT = 8;

export interface RecentPerson {
  name: string;
  icon?: string;
}

/**
 * Names/icons used on this device in past sessions, purely as tap-to-add
 * suggestions — the same category as browser autofill, not an account.
 * Nothing here syncs across devices or identifies anyone to a server.
 */
export function loadRecentPeople(): RecentPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is RecentPerson => !!p && typeof p === "object" && typeof p.name === "string"
    );
  } catch {
    return [];
  }
}

export function rememberPerson(person: RecentPerson): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadRecentPeople().filter((p) => p.name.toLowerCase() !== person.name.toLowerCase());
    const next = [person, ...existing].slice(0, MAX_RECENT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, quota) — suggestions just won't persist this time.
  }
}
