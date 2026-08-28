// The developer's own Venmo handle, used for the optional tip ask —
// separate from lib/payout.ts, which handles a *split organizer's* own
// handle for collecting from the people they split with.
export const TIP_VENMO_HANDLE = "Nilsmack";

// How long a short share link (lib/shareStore.ts) stays resolvable before
// its cached payload expires from Redis. Shown in UI copy, so keep both in sync.
export const SHARE_LINK_TTL_DAYS = 60;
