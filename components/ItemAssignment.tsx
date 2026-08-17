"use client";

import { Assignments, ItemWeights, ParsedReceipt, Person } from "@/lib/types";
import { formatCents } from "@/lib/split";
import PersonAvatar from "./PersonAvatar";
import StepHeader from "./StepHeader";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  onChange: (assignments: Assignments) => void;
  itemWeights: ItemWeights;
  onWeightsChange: (weights: ItemWeights) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ItemAssignment({
  receipt,
  people,
  assignments,
  onChange,
  itemWeights,
  onWeightsChange,
  onNext,
  onBack,
}: Props) {
  const validPersonIds = new Set(people.map((p) => p.id));

  function assignedTo(itemId: string): string[] {
    return (assignments[itemId] ?? []).filter((id) => validPersonIds.has(id));
  }

  function weightFor(itemId: string, personId: string): number {
    return itemWeights[itemId]?.[personId] ?? 1;
  }

  function setWeight(itemId: string, personId: string, weight: number, quantity: number) {
    const clamped = Math.max(1, Math.min(weight, Math.max(quantity, 1)));
    onWeightsChange({
      ...itemWeights,
      [itemId]: { ...itemWeights[itemId], [personId]: clamped },
    });
  }

  function toggle(itemId: string, personId: string) {
    const current = assignedTo(itemId);
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    onChange({ ...assignments, [itemId]: next });

    if (current.includes(personId)) {
      // Drop the now-unused weight entry so it can't resurface if the person is re-added later.
      const itemWeightMap = { ...itemWeights[itemId] };
      delete itemWeightMap[personId];
      onWeightsChange({ ...itemWeights, [itemId]: itemWeightMap });
    }
  }

  function assignToEveryone(itemId: string) {
    onChange({ ...assignments, [itemId]: people.map((p) => p.id) });
  }

  const unassignedCount = receipt.items.filter((item) => assignedTo(item.id).length === 0).length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Who had what?" subtitle="Tap everyone who shared each item." onBack={onBack} />

      <ul className="flex flex-col gap-3">
        {receipt.items.map((item) => {
          const assigned = assignedTo(item.id);
          return (
            <li key={item.id} className="rounded-lg border border-ledger-rule bg-ledger-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ledger-ink">
                  {item.name}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </span>
                <span className="font-mono text-sm tabular-nums text-ledger-inkSoft">
                  {formatCents(item.priceCents)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {people.map((p) => {
                  const active = assigned.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(item.id, p.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition ${
                        active
                          ? "bg-brand-600 text-brand-ink"
                          : "bg-ledger-paperMuted text-ledger-inkSoft hover:bg-ledger-ruleSoft"
                      }`}
                    >
                      <PersonAvatar name={p.name} icon={p.icon} />
                      {p.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => assignToEveryone(item.id)}
                  className="rounded-full border border-dashed border-ledger-rule px-3 py-1 text-sm text-ledger-inkSoft hover:border-brand-400 hover:text-ledger-accent"
                >
                  Everyone
                </button>
              </div>
              {assigned.length === 0 && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Not assigned yet</p>
              )}

              {item.quantity > 1 && assigned.length > 1 && (
                <div className="mt-2 rounded-md bg-ledger-paperMuted p-2">
                  <p className="text-xs text-ledger-inkFaint">
                    Split unevenly? Set each person&apos;s relative share below — it&apos;s a ratio, not a
                    head count, so the numbers don&apos;t need to add up to {item.quantity}.
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {(() => {
                      const totalWeight = assigned.reduce((sum, id) => sum + weightFor(item.id, id), 0);
                      return assigned.map((personId) => {
                        const person = people.find((p) => p.id === personId);
                        if (!person) return null;
                        const weight = weightFor(item.id, personId);
                        const sharePct = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
                        return (
                          <div key={personId} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-ledger-inkSoft">
                              <PersonAvatar name={person.name} icon={person.icon} />
                              {person.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Smaller share for ${person.name}`}
                                onClick={() => setWeight(item.id, personId, weight - 1, item.quantity)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ledger-rule text-ledger-inkSoft hover:border-brand-400 hover:text-ledger-accent"
                              >
                                −
                              </button>
                              <span className="w-9 text-center font-mono text-xs tabular-nums text-ledger-inkFaint">
                                {sharePct}%
                              </span>
                              <button
                                type="button"
                                aria-label={`Larger share for ${person.name}`}
                                onClick={() => setWeight(item.id, personId, weight + 1, item.quantity)}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-ledger-rule text-ledger-inkSoft hover:border-brand-400 hover:text-ledger-accent"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        onClick={onNext}
        className="mt-auto w-full rounded-md bg-brand-600 px-6 py-3 font-semibold text-brand-ink shadow-sm transition hover:bg-brand-700"
      >
        {unassignedCount > 0
          ? `See split (${unassignedCount} item${unassignedCount === 1 ? "" : "s"} unassigned)`
          : "See the split"}
      </button>
    </div>
  );
}
