"use client";

import { useState } from "react";
import { ParsedReceipt } from "@/lib/types";
import { dollarsToCents } from "@/lib/split";
import StepHeader from "./StepHeader";

interface Props {
  onNext: (receipt: ParsedReceipt) => void;
  onBack: () => void;
}

export default function QuickSplitEntry({ onNext, onBack }: Props) {
  const [amount, setAmount] = useState("");

  const totalCents = dollarsToCents(parseFloat(amount) || 0);
  const canContinue = totalCents > 0;

  function handleSubmit() {
    if (!canContinue) return;
    onNext({
      items: [{ id: crypto.randomUUID(), name: "Bill total", priceCents: totalCents, quantity: 1 }],
      subtotalCents: totalCents,
      taxCents: 0,
      tipCents: 0,
      adjustments: [],
      totalCents,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Split a total evenly" subtitle="No receipt needed — just the amount." onBack={onBack} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ledger-inkSoft">Bill total</span>
        <div className="flex items-center gap-1 rounded-lg border border-ledger-rule bg-white px-3 py-2 focus-within:border-brand-500">
          <span className="font-serif text-lg text-ledger-inkFaint">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            autoFocus
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            className="flex-1 border-none bg-transparent font-serif text-lg tabular-nums text-ledger-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </label>

      <p className="text-sm text-ledger-inkFaint">
        Everyone you add next gets an equal share — the whole amount split evenly across the group.
      </p>

      <button
        onClick={handleSubmit}
        disabled={!canContinue}
        className="mt-auto w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        Next: Add people
      </button>
    </div>
  );
}
