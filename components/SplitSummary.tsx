"use client";

import { Assignments, ParsedReceipt, Person } from "@/lib/types";
import { computeSplit, formatCents } from "@/lib/split";
import StepHeader from "./StepHeader";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  onStartOver: () => void;
  onBack: () => void;
}

export default function SplitSummary({ receipt, people, assignments, onStartOver, onBack }: Props) {
  const { totals, unassignedItemIds } = computeSplit(receipt, people, assignments);
  const unassignedItems = receipt.items.filter((item) => unassignedItemIds.includes(item.id));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Here's the split" subtitle="Proportional tax and tip included." onBack={onBack} />

      {unassignedItems.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {unassignedItems.length} item{unassignedItems.length === 1 ? " isn't" : "s aren't"} assigned to
          anyone yet, so {unassignedItems.length === 1 ? "it isn't" : "they aren't"} included below:{" "}
          {unassignedItems.map((i) => i.name).join(", ")}.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {totals.map((t) => (
          <li key={t.personId} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{t.name}</span>
              <span className="text-lg font-bold text-brand-700">{formatCents(t.totalCents)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Items {formatCents(t.itemsCents)}</span>
              <span>Tax {formatCents(t.taxCents)}</span>
              <span>Tip {formatCents(t.tipCents)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
        <span>Receipt total</span>
        <span>{formatCents(receipt.totalCents)}</span>
      </div>

      <p className="text-center text-xs text-slate-400">
        Settle up however you like — Venmo, cash, or whatever works.
      </p>

      <button
        onClick={onStartOver}
        className="mt-auto w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Split another bill
      </button>
    </div>
  );
}
