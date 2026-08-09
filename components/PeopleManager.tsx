"use client";

import { useState } from "react";
import { Person } from "@/lib/types";
import { PERSON_ICONS } from "@/lib/avatar";
import PersonAvatar from "./PersonAvatar";
import StepHeader from "./StepHeader";

interface Props {
  people: Person[];
  onChange: (people: Person[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PeopleManager({ people, onChange, onNext, onBack }: Props) {
  const [name, setName] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  function addPerson() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...people, { id: crypto.randomUUID(), name: trimmed }]);
    setName("");
  }

  function removePerson(id: string) {
    onChange(people.filter((p) => p.id !== id));
    if (pickerFor === id) setPickerFor(null);
  }

  function setIcon(personId: string, icon: string | undefined) {
    onChange(people.map((p) => (p.id === personId ? { ...p, icon } : p)));
    setPickerFor(null);
  }

  const pickerPerson = people.find((p) => p.id === pickerFor);

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
          className="flex-1 rounded-lg border border-ledger-rule px-3 py-2 text-sm text-ledger-ink focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Add
        </button>
      </form>

      <ul className="flex flex-wrap gap-2">
        {people.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-full bg-brand-50 py-1 pl-1 pr-3 text-sm text-brand-700"
          >
            <button
              type="button"
              onClick={() => setPickerFor(pickerFor === p.id ? null : p.id)}
              aria-label={`Change icon for ${p.name}`}
              className="rounded-full"
            >
              <PersonAvatar name={p.name} icon={p.icon} />
            </button>
            {p.name}
            <button
              onClick={() => removePerson(p.id)}
              className="text-brand-400 hover:text-red-600"
              aria-label={`Remove ${p.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {pickerPerson && (
        <div className="rounded-lg border border-ledger-rule bg-white p-3">
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

      {people.length === 0 && (
        <p className="text-sm text-ledger-inkFaint">Add at least one person to continue.</p>
      )}

      <button
        onClick={onNext}
        disabled={people.length === 0}
        className="mt-auto w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        Next: Assign items
      </button>
    </div>
  );
}
