const STORAGE_KEY = "split-the-bill:payout-handles";

export interface PayoutHandles {
  venmo?: string;
  paypal?: string;
}

/**
 * The organizer's own Venmo/PayPal handle, remembered on this device only
 * (localStorage) so it doesn't need retyping every session. Never sent
 * anywhere except baked into a share link the organizer explicitly creates.
 */
export function loadPayoutHandles(): PayoutHandles {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const { venmo, paypal } = parsed as PayoutHandles;
    return {
      venmo: typeof venmo === "string" ? venmo : undefined,
      paypal: typeof paypal === "string" ? paypal : undefined,
    };
  } catch {
    return {};
  }
}

export function savePayoutHandles(handles: PayoutHandles): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
  } catch {
    // localStorage unavailable — the handle just won't persist this time.
  }
}

// Strips an "@" someone might paste in front of a handle.
function cleanHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

/**
 * Venmo's documented deep-link format: opens the app (or web) with the
 * payment pre-filled, ready for the payer to review and send. `txn=pay`
 * (not `charge`) so this only ever triggers from the payer's own tap —
 * never something the organizer could send on someone else's behalf.
 */
export function buildVenmoPayUrl(handle: string, amountCents: number, note: string): string {
  const params = new URLSearchParams({
    txn: "pay",
    amount: (amountCents / 100).toFixed(2),
    note,
    audience: "private",
  });
  return `https://venmo.com/${encodeURIComponent(cleanHandle(handle))}?${params.toString()}`;
}

/** PayPal.me's amount-in-path format: paypal.me/<handle>/<amount>. */
export function buildPayPalPayUrl(handle: string, amountCents: number): string {
  const amount = (amountCents / 100).toFixed(2);
  return `https://paypal.me/${encodeURIComponent(cleanHandle(handle))}/${amount}`;
}
