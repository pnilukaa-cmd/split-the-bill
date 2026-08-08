"use client";

import { Assignments, ParsedReceipt, Person } from "@/lib/types";
import { formatCents } from "@/lib/split";
import StepHeader from "./StepHeader";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  onChange: (assignments: Assignments) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ItemAssignment({ receipt, people, assignments, onChange, onNext, onBack }: Props) {
  const validPersonIds = new Set(people.map((p) => p.id));

  function assignedTo(itemId: string): string[] {
    return (assignments[itemId] ?? []).filter((id) => validPersonIds.has(id));
  }

  function toggle(itemId: string, personId: string) {
    const current = assignedTo(itemId);
    const next = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    onChange({ ...assignments, [itemId]: next });
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
            <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {item.name}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </span>
                <span className="text-sm text-slate-500">{formatCents(item.priceCents)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {people.map((p) => {
                  const active = assigned.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(item.id, p.id)}
                      className={`rounded-full px-3 py-1 text-sm transition ${
                        active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => assignToEveryone(item.id)}
                  className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
                >
                  Everyone
                </button>
              </div>
              {assigned.length === 0 && <p className="mt-1 text-xs text-amber-600">Not assigned yet</p>}
            </li>
          );
        })}
      </ul>

      <button
        onClick={onNext}
        className="mt-auto w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        {unassignedCount > 0
          ? `See split (${unassignedCount} item${unassignedCount === 1 ? "" : "s"} unassigned)`
          : "See the split"}
      </button>
    </div>
  );
}
