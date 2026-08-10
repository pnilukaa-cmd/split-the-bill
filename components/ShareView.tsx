"use client";

import { useEffect, useRef } from "react";
import { SharePayload } from "@/lib/share";
import { computeSplit, formatCents } from "@/lib/split";
import PersonAvatar from "./PersonAvatar";

interface Props {
  payload: SharePayload;
  highlightPersonId: string | null;
  onStartOwn: () => void;
}

export default function ShareView({ payload, highlightPersonId, onStartOwn }: Props) {
  const { receipt, people, assignments, itemWeights } = payload;
  const { totals, unassignedItemIds } = computeSplit(receipt, people, assignments, itemWeights);
  const unassignedItems = receipt.items.filter((item) => unassignedItemIds.includes(item.id));
  const iconByPersonId = new Map(people.map((p) => [p.id, p.icon]));
  const highlightRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ledger-brass">Shared split</p>
        <h1 className="font-serif text-2xl font-semibold text-ledger-ink">Here&apos;s the split</h1>
        <p className="mt-1 text-sm text-ledger-inkSoft">Proportional tax and tip included.</p>
      </div>

      {unassignedItems.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {unassignedItems.length} item{unassignedItems.length === 1 ? " isn't" : "s aren't"} assigned to
          anyone yet, so {unassignedItems.length === 1 ? "it isn't" : "they aren't"} included below:{" "}
          {unassignedItems.map((i) => i.name).join(", ")}.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {totals.map((t) => (
          <li
            key={t.personId}
            ref={t.personId === highlightPersonId ? highlightRef : undefined}
            className={`rounded-lg border p-3 transition ${
              t.personId === highlightPersonId
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300"
                : "border-ledger-rule bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-ledger-ink">
                <PersonAvatar name={t.name} icon={iconByPersonId.get(t.personId)} size="md" />
                {t.name}
              </span>
              <span className="font-serif text-lg font-bold tabular-nums text-brand-700">
                {formatCents(t.totalCents)}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-xs tabular-nums text-ledger-inkSoft">
              <span>Items {formatCents(t.itemsCents)}</span>
              <span>Tax {formatCents(t.taxCents)}</span>
              <span>Tip {formatCents(t.tipCents)}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-lg bg-ledger-paperMuted px-4 py-2 text-sm font-medium text-ledger-ink">
        <span>Receipt total</span>
        <span className="font-serif tabular-nums">{formatCents(receipt.totalCents)}</span>
      </div>

      <p className="text-center text-xs text-ledger-inkFaint">
        Settle up however you like — Venmo, cash, or whatever works.
      </p>

      <button
        onClick={onStartOwn}
        className="mt-auto w-full rounded-xl bg-ledger-ink px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Split your own bill
      </button>
    </div>
  );
}
