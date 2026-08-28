# Split the Bill

A mobile-optimized web app for splitting a restaurant bill by item. Take a
photo of the receipt, Claude reads the line items, everyone claims what they
had, and the app works out each person's share — including their
proportional cut of tax and tip.

This is an MVP: it computes the math, it does not move money. Settle up
however your group already does (Venmo, cash, etc.).

## How it works

1. **Upload** — snap or upload a photo of the receipt.
2. **Review items** — the receipt is parsed by a Claude vision model into
   line items, subtotal, tax, tip, and total. Fix anything the scan got
   wrong (thermal-printed receipts especially can be hard to read).
3. **Add people** — everyone at the table.
4. **Assign items** — tap who shared each item. Items split among multiple
   people are divided evenly by default; for a multi-unit item (e.g. a round
   of drinks) you can set how many units each person had for an uneven
   split.
5. **Summary** — each person's total, with tax and tip distributed in
   proportion to what they ordered (not split evenly), and cents allocated
   with no rounding error left over. From here you can share the split as a
   link (with a QR code, or a per-person deep link to just their total). The
   whole split is encoded directly in the URL — that link works with no login
   and no server involved. If Upstash Redis is configured (see below), sharing
   also offers a short link instead: the same encoded data, cached server-side
   behind a short slug for `SHARE_LINK_TTL_DAYS` (60 by default) and then
   expired. Either way nothing is stored permanently or tied to an account.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@anthropic-ai/sdk` for receipt OCR/extraction via a Claude vision model,
  using forced tool-use for structured output
- No database, no auth — state lives in the browser for the duration of one
  split
- Optional `@upstash/ratelimit` + `@upstash/redis` for a per-IP daily scan
  cap (no-ops if unconfigured — see below)
- Shareable summary links are stateless: the split is compressed
  (`lz-string`) into the URL hash, so a shared link is fully self-contained
  and never touches a server. `qrcode` renders that link as a QR code
  client-side.

## Getting started

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. "Take photo" opens the camera; "Choose photo"
opens the library.

## Cost controls

Every scan costs a small amount in Claude API tokens. Two layers protect
against a surprise bill:

1. **Per-IP daily cap (in this repo)** — set `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` (free tier at [upstash.com](https://upstash.com))
   to cap scans at 8/day per IP. Without these set, the app still works but
   has no rate limiting.
2. **Hard spend limit (set this yourself, not code)** — in the
   [Anthropic Console](https://console.anthropic.com), set a monthly spend
   cap on the API key this app uses. This is the backstop that matters most:
   it's a hard ceiling regardless of what happens at the app layer.

## Notes on the math

All money is handled in integer cents internally (`lib/split.ts`) to avoid
floating-point rounding errors. Splitting an item or distributing tax/tip
proportionally uses the largest-remainder method so the split always sums
back exactly to the printed total — no missing or extra pennies.

If the scanned items, tax, and tip don't add up to the receipt's printed
total (common with OCR misreads), a warning is shown on the review screen
so it can be corrected before splitting.
