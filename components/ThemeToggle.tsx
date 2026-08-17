"use client";

import { useEffect, useState } from "react";
import { applyTheme, loadThemePreference, resolveTheme, saveThemePreference, ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Match device", icon: "◐" },
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
];

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setPref(loadThemePreference());
  }, []);

  useEffect(() => {
    if (!pref) return;
    applyTheme(resolveTheme(pref));
    if (pref !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme(resolveTheme("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [pref]);

  function choose(next: ThemePreference) {
    setPref(next);
    saveThemePreference(next);
  }

  // Reserve the same footprint before mount so the toggle doesn't pop in and shift the layout.
  if (!pref) return <div className="h-7 w-[84px]" aria-hidden />;

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-ledger-rule bg-ledger-surface p-0.5"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => choose(opt.value)}
          aria-pressed={pref === opt.value}
          aria-label={opt.label}
          title={opt.label}
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition ${
            pref === opt.value
              ? "bg-brand-600 text-brand-ink"
              : "text-ledger-inkFaint hover:text-ledger-ink"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
