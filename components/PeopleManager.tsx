"use client";

import { useEffect, useRef, useState } from "react";
import { Person } from "@/lib/types";
import { PERSON_ICONS } from "@/lib/avatar";
import { loadRecentPeople, rememberPerson, RecentPerson } from "@/lib/recentPeople";
import { formatCents } from "@/lib/split";
import PersonAvatar from "./PersonAvatar";
import StepHeader from "./StepHeader";

interface Props {
  people: Person[];
  onChange: (people: Person[]) => void;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  /** The receipt total, if known — used only for the "split evenly" preview below the list. */
  receiptTotalCents?: number;
  /** True when there's no item-assignment step after this one, so the even split shown is the real, final one. */
  evenSplitIsFinal?: boolean;
}

export default function PeopleManager({
  people,
  onChange,
  onNext,
  onBack,
  nextLabel = "Next: Assign items",
  receiptTotalCents = 0,
  evenSplitIsFinal = false,
}: Props) {
  const [name, setName] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentPerson[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecentPeople());
  }, []);

  // Closes the icon picker on an outside tap — the toggle buttons manage
  // their own open/close/switch, so this only needs to catch everything else.
  useEffect(() => {
    if (!pickerFor) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (pickerRef.current?.contains(target)) return;
      if (target.closest("[data-avatar-toggle]")) return;
      setPickerFor(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerFor]);

  function addPerson() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...people, { id: crypto.randomUUID(), name: trimmed }]);
    rememberPerson({ name: trimmed });
    setName("");
  }

  function addFromRecent(person: RecentPerson) {
    onChange([...people, { id: crypto.randomUUID(), name: person.name, icon: person.icon }]);
    rememberPerson(person);
  }

  function removePerson(id: string) {
    onChange(people.filter((p) => p.id !== id));
    if (pickerFor === id) setPickerFor(null);
  }

  function setIcon(personId: string, icon: string | undefined) {
    const person = people.find((p) => p.id === personId);
    onChange(people.map((p) => (p.id === personId ? { ...p, icon } : p)));
    if (person) rememberPerson({ name: person.name, icon });
    setPickerFor(null);
  }

  const pickerPerson = people.find((p) => p.id === pickerFor);
  const addedNames = new Set(people.map((p) => p.name.toLowerCase()));
  const suggestions = recent.filter((r) => !addedNames.has(r.name.toLowerCase()));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Who's splitting?" subtitle="Add everyone at the table." onBack={onBack} />

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addPerson();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a name"
          className="flex-1 rounded-lg border border-ledger-rule bg-ledger-surface px-3 py-2 text-sm text-ledger-ink focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-700"
        >
          Add
        </button>
      </form>

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-ledger-inkFaint">From this device</p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((r) => (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => addFromRecent(r)}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-ledger-rule bg-ledger-surface py-1 pl-1 pr-3 text-sm text-ledger-inkSoft transition hover:border-brand-400 hover:text-ledger-accent"
                >
                  <PersonAvatar name={r.name} icon={r.icon} />
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex flex-wrap gap-2">
        {people.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-full bg-brand-50 py-1 pl-1 pr-3 text-sm text-ledger-accent"
          >
            <button
              type="button"
              data-avatar-toggle
              onClick={() => setPickerFor(pickerFor === p.id ? null : p.id)}
              aria-label={`Change icon for ${p.name}`}
              className="rounded-full"
            >
              <PersonAvatar name={p.name} icon={p.icon} />
            </button>
            {p.name}
            <button
              onClick={() => removePerson(p.id)}
              className="text-ledger-accent hover:text-red-400"
              aria-label={`Remove ${p.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Fills whatever's left below the chips instead of leaving it blank above a
          bottom-pinned button — the picker and the split preview center inside it. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {pickerPerson && (
          <div ref={pickerRef} className="w-full rounded-lg border border-ledger-rule bg-ledger-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-ledger-inkSoft">Pick an icon for {pickerPerson.name}</p>
              <button
                onClick={() => setPickerFor(null)}
                className="text-xs text-ledger-inkFaint hover:text-ledger-ink"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {PERSON_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setIcon(pickerPerson.id, icon)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-ledger-paperMuted"
                >
                  {icon}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIcon(pickerPerson.id, undefined)}
                aria-label="Use default color instead of an icon"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-ledger-rule text-xs text-ledger-inkFaint hover:bg-ledger-paperMuted"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {people.length > 1 && receiptTotalCents > 0 && (
          <div className="w-full rounded-lg border border-dashed border-ledger-rule bg-ledger-surface p-4 text-center">
            <p className="text-xs text-ledger-inkFaint">
              {evenSplitIsFinal ? `Split evenly across ${people.length} people` : `If split evenly across ${people.length} people`}
            </p>
            <p className="font-hand text-3xl text-ledger-ink">
              {formatCents(Math.round(receiptTotalCents / people.length))}{" "}
              <span className="text-base text-ledger-inkFaint">each</span>
            </p>
            {!evenSplitIsFinal && (
              <p className="mt-1 text-xs text-ledger-inkFaint">
                Next step lets you assign items instead, if it wasn&apos;t even.
              </p>
            )}
          </div>
        )}

        {people.length === 0 && (
          <p className="text-sm text-ledger-inkFaint">Add at least one person to continue.</p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={people.length === 0}
        className="w-full rounded-md bg-brand-600 px-6 py-3 font-semibold text-brand-ink shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {nextLabel}
      </button>
    </div>
  );
}
