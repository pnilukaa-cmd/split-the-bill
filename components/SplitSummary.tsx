"use client";

import { useEffect, useState } from "react";
import { Assignments, ItemWeights, ParsedReceipt, Person } from "@/lib/types";
import { computeSplit, formatCents } from "@/lib/split";
import { loadPayoutHandles, PayoutHandles } from "@/lib/payout";
import PersonAvatar from "./PersonAvatar";
import PayLinks from "./PayLinks";
import StepHeader from "./StepHeader";
import ShareSplit from "./ShareSplit";
import InstallPrompt from "./InstallPrompt";
import PayoutAsk from "./PayoutAsk";
import TipAsk from "./TipAsk";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  itemWeights: ItemWeights;
  onStartOver: () => void;
  onBack: () => void;
}

export default function SplitSummary({ receipt, people, assignments, itemWeights, onStartOver, onBack }: Props) {
  const { totals, unassignedItemIds } = computeSplit(receipt, people, assignments, itemWeights);
  const unassignedItems = receipt.items.filter((item) => unassignedItemIds.includes(item.id));
  const iconByPersonId = new Map(people.map((p) => [p.id, p.icon]));
  const [payouts, setPayouts] = useState<PayoutHandles>({});

  useEffect(() => {
    setPayouts(loadPayoutHandles());
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Here's the split" subtitle="Proportional tax and tip included." onBack={onBack} />

      <InstallPrompt />

      {unassignedItems.length > 0 && (
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          {unassignedItems.length} item{unassignedItems.length === 1 ? " isn't" : "s aren't"} assigned to
          anyone yet, so {unassignedItems.length === 1 ? "it isn't" : "they aren't"} included below:{" "}
          {unassignedItems.map((i) => i.name).join(", ")}.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {totals.map((t) => (
          <li key={t.personId} className="rounded-lg border border-ledger-rule bg-ledger-surface p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-ledger-ink">
                <PersonAvatar name={t.name} icon={iconByPersonId.get(t.personId)} size="md" />
                {t.name}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-ledger-accent">
                {formatCents(t.totalCents)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-ledger-inkSoft">
              <span>Items {formatCents(t.itemsCents)}</span>
              <span>Tax {formatCents(t.taxCents)}</span>
              <span>Tip {formatCents(t.tipCents)}</span>
              {t.adjustmentsCents !== 0 && (
                <span className={t.adjustmentsCents < 0 ? "text-ledger-negative" : undefined}>
                  Adjustments {t.adjustmentsCents > 0 ? "+" : ""}
                  {formatCents(t.adjustmentsCents)}
                </span>
              )}
            </div>
            <PayLinks payouts={payouts} amountCents={t.totalCents} note={`Split the Bill — ${t.name}`} />
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-lg bg-ledger-paperMuted px-4 py-2 text-sm font-medium text-ledger-ink">
        <span>Receipt total</span>
        <span className="font-mono tabular-nums">{formatCents(receipt.totalCents)}</span>
      </div>

      {unassignedItems.length === 0 && (
        <div className="flex justify-center">
          <span className="font-hand text-xl text-ledger-accent">Balanced to the cent</span>
        </div>
      )}

      {people.length > 1 && <PayoutAsk payouts={payouts} onChange={setPayouts} />}

      <TipAsk />

      <p className="text-center text-xs text-ledger-inkFaint">
        Settle up however you like — Venmo, cash, or whatever works.
      </p>

      <ShareSplit
        receipt={receipt}
        people={people}
        assignments={assignments}
        itemWeights={itemWeights}
        totals={totals}
        payouts={payouts}
        onPayoutsChange={setPayouts}
      />

      <button
        onClick={onStartOver}
        className="mt-auto w-full rounded-md border border-ledger-ink px-6 py-3 font-semibold text-ledger-ink shadow-sm transition hover:bg-ledger-surface"
      >
        Split another bill
      </button>
    </div>
  );
}
