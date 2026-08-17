"use client";

import { track } from "@vercel/analytics";
import { buildVenmoPayUrl } from "@/lib/payout";
import { TIP_VENMO_HANDLE } from "@/lib/config";

const PRESET_AMOUNTS_CENTS = [100, 200, 300];

// Shown once, right after a split is finished — the moment the app just
// delivered real value — rather than a passive link sitting in the footer
// of every screen, which converts close to never. Clicks are tracked
// (anonymous, no personal data — just which preset was tapped) so it's
// possible to tell whether this timing actually converts better.
export default function TipAsk() {
  return (
    <div className="rounded-lg border border-dashed border-ledger-rule px-4 py-3 text-center">
      <p className="text-sm text-ledger-inkSoft">
        That&apos;s the group-chat math argument avoided. Split the Bill is free — a couple bucks is always
        welcome if it saved you a headache.
      </p>
      <div className="mt-2 flex justify-center gap-2">
        {PRESET_AMOUNTS_CENTS.map((cents) => (
          <a
            key={cents}
            href={buildVenmoPayUrl(TIP_VENMO_HANDLE, cents, "Split the Bill — thanks!")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("tip_clicked", { amount: cents / 100 })}
            className="rounded-full border border-ledger-rule px-3 py-1 text-xs font-semibold text-ledger-inkSoft transition hover:border-brand-400 hover:text-ledger-accent"
          >
            ${(cents / 100).toFixed(0)}
          </a>
        ))}
      </div>
    </div>
  );
}
