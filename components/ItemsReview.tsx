"use client";

import { useState } from "react";
import { ParsedReceipt, ReceiptItem } from "@/lib/types";
import { centsToDollarsInput, dollarsToCents, formatCents } from "@/lib/split";
import StepHeader from "./StepHeader";

interface Props {
  receipt: ParsedReceipt;
  onChange: (receipt: ParsedReceipt) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ItemsReview({ receipt, onChange, onNext, onBack }: Props) {
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items);
  const [taxCents, setTaxCents] = useState(receipt.taxCents);
  const [tipCents, setTipCents] = useState(receipt.tipCents);

  function updateItem(id: string, field: "name" | "price" | "quantity", value: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "name") return { ...item, name: value };
        if (field === "price") return { ...item, priceCents: dollarsToCents(parseFloat(value) || 0) };
        return { ...item, quantity: parseInt(value, 10) || 1 };
      })
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "New item", priceCents: 0, quantity: 1 }]);
  }

  const itemsSubtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const totalCents = itemsSubtotalCents + taxCents + tipCents;

  function handleNext() {
    onChange({
      items,
      subtotalCents: itemsSubtotalCents,
      taxCents,
      tipCents,
      totalCents,
    });
    onNext();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <StepHeader title="Review items" subtitle="Fix anything the scan got wrong." onBack={onBack} />

      {receipt.warning && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">{receipt.warning}</p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-ledger-rule bg-white p-2"
          >
            <input
              className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm text-ledger-ink focus:border-brand-500 focus:outline-none"
              value={item.name}
              onChange={(e) => updateItem(item.id, "name", e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="w-12 rounded-md border border-ledger-rule px-1 py-1 text-center text-sm tabular-nums"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className="w-20 rounded-md border border-ledger-rule px-2 py-1 text-right text-sm font-serif tabular-nums"
              value={centsToDollarsInput(item.priceCents)}
              onChange={(e) => updateItem(item.id, "price", e.target.value)}
            />
            <button
              onClick={() => removeItem(item.id)}
              className="text-ledger-inkFaint hover:text-red-600"
              aria-label={`Remove ${item.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button onClick={addItem} className="self-start text-sm font-medium text-brand-700 hover:underline">
        + Add item
      </button>

      {tipCents === 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <span aria-hidden>💡</span>
          Most receipts don&apos;t print the tip — add yours below so everyone&apos;s split is accurate.
        </p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-3 rounded-lg border border-ledger-rule bg-white p-3 text-sm">
        <div className="col-span-2 flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-serif font-medium tabular-nums">{formatCents(itemsSubtotalCents)}</span>
        </div>
        <label className="flex items-center justify-between gap-2">
          Tax
          <input
            type="number"
            step="0.01"
            className="w-20 rounded-md border border-ledger-rule px-2 py-1 text-right font-serif tabular-nums"
            value={centsToDollarsInput(taxCents)}
            onChange={(e) => setTaxCents(dollarsToCents(parseFloat(e.target.value) || 0))}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          Tip
          <input
            type="number"
            step="0.01"
            className={`w-20 rounded-md border px-2 py-1 text-right font-serif tabular-nums ${
              tipCents === 0 ? "border-amber-400 ring-1 ring-amber-200" : "border-ledger-rule"
            }`}
            value={centsToDollarsInput(tipCents)}
            onChange={(e) => setTipCents(dollarsToCents(parseFloat(e.target.value) || 0))}
          />
        </label>
        <div className="col-span-2 flex items-center justify-between border-t border-ledger-ruleSoft pt-2 font-semibold">
          <span>Total</span>
          <span className="font-serif tabular-nums">{formatCents(totalCents)}</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={items.length === 0}
        className="mt-auto w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        Next: Add people
      </button>
    </div>
  );
}
