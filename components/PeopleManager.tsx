"use client";

import { useState } from "react";
import { Person } from "@/lib/types";
import StepHeader from "./StepHeader";

interface Props {
  people: Person[];
  onChange: (people: Person[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PeopleManager({ people, onChange, onNext, onBack }: Props) {
  const [name, setName] = useState("");

  function addPerson() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...people, { id: crypto.randomUUID(), name: trimmed }]);
    setName("");
  }

  function removePerson(id: string) {
    onChange(people.filter((p) => p.id !== id));
  }

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
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
            className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-700"
          >
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

      {people.length === 0 && <p className="text-sm text-slate-400">Add at least one person to continue.</p>}

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
