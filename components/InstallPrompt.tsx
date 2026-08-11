"use client";

import { useEffect, useState } from "react";
import {
  BeforeInstallPromptEvent,
  clearDeferredInstallPrompt,
  dismissInstallPromptForever,
  getDeferredInstallPrompt,
  isIOSSafari,
  isStandalone,
  onInstallPromptReady,
  recordInstallPromptShown,
  shouldOfferInstall,
} from "@/lib/installPrompt";

type Mode = "none" | "android" | "ios";

// Shown once someone's reached a completed split — a real interest signal,
// unlike prompting on landing where it just gets reflexively dismissed.
export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("none");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!shouldOfferInstall()) return;

    const existing = getDeferredInstallPrompt();
    if (existing) {
      setInstallEvent(existing);
      setMode("android");
      recordInstallPromptShown();
      return;
    }

    if (isIOSSafari() && !isStandalone()) {
      setMode("ios");
      recordInstallPromptShown();
      return;
    }

    // Chrome may not have fired the event yet (it waits for an engagement
    // heuristic) — keep listening for the rest of this visit.
    return onInstallPromptReady((event) => {
      if (!shouldOfferInstall()) return;
      setInstallEvent(event);
      setMode("android");
      recordInstallPromptShown();
    });
  }, []);

  function dismiss() {
    setDismissed(true);
    dismissInstallPromptForever();
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    clearDeferredInstallPrompt();
    setDismissed(true);
  }

  if (mode === "none" || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-ledger-rule bg-ledger-surface px-4 py-2.5 text-sm">
      {mode === "android" ? (
        <>
          <span className="text-ledger-inkSoft">Add Split the Bill to your phone for one tap next time.</span>
          <button
            onClick={handleInstall}
            className="shrink-0 font-semibold text-brand-700 hover:underline"
          >
            Add
          </button>
        </>
      ) : (
        <span className="text-ledger-inkSoft">
          Add this to your home screen: tap <span className="font-semibold text-ledger-ink">Share</span>, then{" "}
          <span className="font-semibold text-ledger-ink">Add to Home Screen</span>.
        </span>
      )}
      <button onClick={dismiss} className="shrink-0 text-ledger-inkFaint hover:text-ledger-ink" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
