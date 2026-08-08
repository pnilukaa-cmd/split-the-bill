# split-the-bill

A mobile-optimized web app for splitting a restaurant bill by item: photo of
the receipt → Claude vision OCR → item assignment per person → per-person
total with tax/tip split proportionally. No payment integration — the app
computes who owes what and leaves settling up to the group.

Stack: Next.js (App Router) + TypeScript + Tailwind. See README.md for setup
and architecture notes.

## Agent workflow

This repo doesn't have custom named subagents (no dedicated `researcher`,
`pm`, `dev`, `qa-tester`, `designer` agent definitions). Work is done using
the generic agent types available in the environment (`general-purpose`,
`Explore`, `Plan`, etc.), mapped to these roles:

- **PM / spec** — done directly in conversation, or via the `Plan` agent
  when a task needs a formal step-by-step implementation plan first.
- **Research** — `general-purpose` agent for open-ended market/tech
  research (e.g. the initial opportunity deep-dive).
- **Dev** — done directly, or delegated to a `general-purpose` agent for a
  well-scoped, self-contained implementation task.
- **QA** — a `general-purpose` or `Explore` agent for a review pass, plus
  the `code-review` skill for a structured bug/simplification/efficiency
  pass before merging non-trivial changes.
- **Designer** — no dedicated agent; UI/UX passes are done directly,
  informed by the `artifact-design` / `dataviz` skills where relevant.

Reminder: agent/skill definitions and conventions are repo-local. Nothing
carries over from other repos automatically — if a future session should
reuse something from another repo (e.g. prior agent definitions), that repo
must be attached explicitly and the relevant files copied over on request.

## Conventions

- Money is always handled in integer cents internally (`lib/split.ts`), and
  split/rounding uses the largest-remainder method so allocations sum back
  exactly to the source amount — never plain floating-point division.
- No database, no auth. State lives in the browser for the duration of one
  split.
- Keep the settle-up step a deep-link/manual step (Venmo, cash, etc.) —
  avoid building payment-holding infrastructure, which triggers
  money-transmitter licensing (see the opportunity research for why).
