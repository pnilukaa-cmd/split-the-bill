"use client";

import { useState } from "react";
import { PayoutHandles, savePayoutHandles } from "@/lib/payout";

interface Props {
  payouts: PayoutHandles;
  onChange: (payouts: PayoutHandles) => void;
}

// Shown right where TipAsk is — the moment the split is finished and the
// organizer can see money is owed to them — instead of behind ShareSplit's
// "More options" toggle, where PayLinks silently never renders for anyone
// who skips it.
export default function PayoutAsk({ payouts, onChange }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || payouts.venmo || payouts.paypal) return null;

  function update(field: keyof PayoutHandles, value: string) {
    const next = { ...payouts, [field]: value || undefined };
    onChange(next);
    savePayoutHandles(next);
  }

  return (
    <div className="rounded-lg border border-dashed border-ledger-rule px-4 py-3">
      <p className="text-center text-sm text-ledger-inkSoft">
        Want people to be able to pay you straight from this link? Add your Venmo or PayPal.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={payouts.venmo ?? ""}
          onChange={(e) => update("venmo", e.target.value)}
          placeholder="Venmo handle"
          className="min-w-0 flex-1 rounded-md border border-ledger-rule bg-ledger-paperMuted px-2 py-1.5 text-xs text-ledger-ink placeholder:text-ledger-inkFaint focus:border-brand-500 focus:outline-none"
        />
        <input
          value={payouts.paypal ?? ""}
          onChange={(e) => update("paypal", e.target.value)}
          placeholder="PayPal.me handle"
          className="min-w-0 flex-1 rounded-md border border-ledger-rule bg-ledger-paperMuted px-2 py-1.5 text-xs text-ledger-ink placeholder:text-ledger-inkFaint focus:border-brand-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-1.5 block w-full text-center text-xs text-ledger-inkFaint hover:text-ledger-ink"
      >
        Skip — I&apos;ll collect another way
      </button>
    </div>
  );
}
