// Captures Chrome/Android's `beforeinstallprompt` event as early as possible.
// The event can only be reacted to once and only if `preventDefault()` is
// called synchronously inside the handler — so this listener is attached as
// a module-scope side effect (runs the moment this file is first imported,
// which happens on initial bundle load since the app has no code-splitting
// across routes) rather than waiting for a specific component to mount.

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((cb) => cb(deferredPrompt!));
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/** Fires once if the event already arrived, otherwise when it eventually does. */
export function onInstallPromptReady(cb: (event: BeforeInstallPromptEvent) => void): () => void {
  if (deferredPrompt) {
    cb(deferredPrompt);
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  // Other iOS browsers (Chrome/Firefox on iOS) embed their own name in the
  // UA even though they're really WebKit underneath — exclude those since
  // the Share-sheet walkthrough only applies to actual Safari.
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOSDevice && !isOtherIOSBrowser;
}

const DISMISSED_KEY = "split-the-bill:install-prompt-dismissed";
const SHOWN_COUNT_KEY = "split-the-bill:install-prompt-shown-count";
const MAX_SHOWS = 3;

export function shouldOfferInstall(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalone()) return false;
  try {
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return false;
    const count = parseInt(window.localStorage.getItem(SHOWN_COUNT_KEY) || "0", 10);
    return count < MAX_SHOWS;
  } catch {
    return true;
  }
}

export function recordInstallPromptShown(): void {
  try {
    const count = parseInt(window.localStorage.getItem(SHOWN_COUNT_KEY) || "0", 10);
    window.localStorage.setItem(SHOWN_COUNT_KEY, String(count + 1));
  } catch {
    // localStorage unavailable — the banner just won't be frequency-capped this session.
  }
}

export function dismissInstallPromptForever(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Nothing to do — worst case the banner reappears next time.
  }
}
