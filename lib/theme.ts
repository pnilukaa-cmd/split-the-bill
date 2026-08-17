const STORAGE_KEY = "split-the-bill:theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function loadThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : "system";
}

export function saveThemePreference(pref: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    if (pref === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // localStorage unavailable — the choice just won't persist this time.
  }
}

/** Falls back to dark (the brand default) when there's no window or no matchMedia support. */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref !== "system") return pref;
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

// Mirrors the logic above — kept in sync by hand since this runs as a raw
// string in a blocking <script> tag before any JS module can load, so it
// can't just import this file.
export const THEME_INIT_SCRIPT = `(function(){try{var k="${STORAGE_KEY}";var p=localStorage.getItem(k);var t=(p==="light"||p==="dark")?p:((window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
