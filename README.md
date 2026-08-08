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
   people are divided evenly.
5. **Summary** — each person's total, with tax and tip distributed in
   proportion to what they ordered (not split evenly), and cents allocated
   with no rounding error left over.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@anthropic-ai/sdk` for receipt OCR/extraction via a Claude vision model,
  using forced tool-use for structured output
- No database, no auth — state lives in the browser for the duration of one
  split

## Getting started

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. On a phone, the file input opens the camera
directly.

## Notes on the math

All money is handled in integer cents internally (`lib/split.ts`) to avoid
floating-point rounding errors. Splitting an item or distributing tax/tip
proportionally uses the largest-remainder method so the split always sums
back exactly to the printed total — no missing or extra pennies.

If the scanned items, tax, and tip don't add up to the receipt's printed
total (common with OCR misreads), a warning is shown on the review screen
so it can be corrected before splitting.
