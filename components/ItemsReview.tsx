"use client";

import { useEffect, useRef, useState } from "react";
import { Adjustment, ParsedReceipt, ReceiptItem } from "@/lib/types";
import { centsToDollarsInput, dollarsToCents, formatCents } from "@/lib/split";
import StepHeader from "./StepHeader";

interface Props {
  receipt: ParsedReceipt;
  onChange: (receipt: ParsedReceipt) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIP_PRESETS = [0.18, 0.2, 0.25];
const UNDO_TIMEOUT_MS = 6000;

type RemovedEntry =
  | { kind: "item"; value: ReceiptItem; index: number }
  | { kind: "adjustment"; value: Adjustment; index: number };

export default function ItemsReview({ receipt, onChange, onNext, onBack }: Props) {
  const [items, setItems] = useState<ReceiptItem[]>(receipt.items);
  const [taxCents, setTaxCents] = useState(receipt.taxCents);
  const [tipCents, setTipCents] = useState(receipt.tipCents);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(receipt.adjustments ?? []);

  // A stray tap on ✕ shouldn't mean re-typing an item from scratch — keep
  // the last removed item/adjustment around briefly so it can be restored.
  const [lastRemoved, setLastRemoved] = useState<RemovedEntry | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  function scheduleUndoClear() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setLastRemoved(null), UNDO_TIMEOUT_MS);
  }

  function undoRemove() {
    if (!lastRemoved) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (lastRemoved.kind === "item") {
      setItems((prev) => {
        const next = [...prev];
        next.splice(lastRemoved.index, 0, lastRemoved.value);
        return next;
      });
    } else {
      setAdjustments((prev) => {
        const next = [...prev];
        next.splice(lastRemoved.index, 0, lastRemoved.value);
        return next;
      });
    }
    setLastRemoved(null);
  }

  // Raw text currently being typed into a numeric field, keyed by field id.
  // A controlled input whose value is rebuilt from the formatted cents on
  // every keystroke snaps the cursor to the end after each character —
  // typing "12.50" becomes impossible. Showing the draft while focused
  // lets someone type freely (including a bare "12." mid-edit); on blur
  // the field falls back to the canonical formatted value.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function draftOr(key: string, formatted: string): string {
    return drafts[key] ?? formatted;
  }

  function setDraft(key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  function clearDraft(key: string) {
    setDrafts((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

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
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      setLastRemoved({ kind: "item", value: prev[index], index });
      scheduleUndoClear();
      return prev.filter((item) => item.id !== id);
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "New item", priceCents: 0, quantity: 1 }]);
  }

  function addAdjustment(kind: Adjustment["kind"]) {
    setAdjustments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: kind === "discount" ? "Discount" : "Service charge", amountCents: 0, kind },
    ]);
  }

  function updateAdjustment(id: string, field: "label" | "amount", value: string) {
    setAdjustments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (field === "label") return { ...a, label: value };
        return { ...a, amountCents: Math.abs(dollarsToCents(parseFloat(value) || 0)) };
      })
    );
  }

  function removeAdjustment(id: string) {
    setAdjustments((prev) => {
      const index = prev.findIndex((a) => a.id === id);
      if (index === -1) return prev;
      setLastRemoved({ kind: "adjustment", value: prev[index], index });
      scheduleUndoClear();
      return prev.filter((a) => a.id !== id);
    });
  }

  const itemsSubtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const adjustmentsNetCents = adjustments.reduce(
    (sum, a) => sum + (a.kind === "discount" ? -a.amountCents : a.amountCents),
    0
  );
  const totalCents = itemsSubtotalCents + taxCents + tipCents + adjustmentsNetCents;

  function handleNext() {
    onChange({
      items,
      subtotalCents: itemsSubtotalCents,
      taxCents,
      tipCents,
      adjustments,
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

      {lastRemoved && (
        <div className="flex items-center justify-between rounded-lg bg-ledger-paperMuted px-4 py-2 text-sm text-ledger-ink">
          <span>
            Removed &ldquo;{lastRemoved.kind === "item" ? lastRemoved.value.name : lastRemoved.value.label}
            &rdquo;
          </span>
          <button onClick={undoRemove} className="font-semibold text-brand-700 hover:underline">
            Undo
          </button>
        </div>
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
              value={draftOr(`qty-${item.id}`, String(item.quantity))}
              onChange={(e) => {
                setDraft(`qty-${item.id}`, e.target.value);
                updateItem(item.id, "quantity", e.target.value);
              }}
              onBlur={() => clearDraft(`qty-${item.id}`)}
            />
            <input
              type="number"
              step="0.01"
              className="w-20 rounded-md border border-ledger-rule px-2 py-1 text-right text-sm font-serif tabular-nums"
              value={draftOr(`price-${item.id}`, centsToDollarsInput(item.priceCents))}
              onChange={(e) => {
                setDraft(`price-${item.id}`, e.target.value);
                updateItem(item.id, "price", e.target.value);
              }}
              onBlur={() => clearDraft(`price-${item.id}`)}
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

      {adjustments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {adjustments.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                a.kind === "discount" ? "border-brand-300 bg-brand-50" : "border-ledger-rule bg-white"
              }`}
            >
              <span className="text-xs text-ledger-inkFaint" aria-hidden>
                {a.kind === "discount" ? "−" : "+"}
              </span>
              <input
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-ledger-ink focus:border-brand-500 focus:outline-none"
                value={a.label}
                onChange={(e) => updateAdjustment(a.id, "label", e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                className="w-20 rounded-md border border-ledger-rule bg-white px-2 py-1 text-right text-sm font-serif tabular-nums"
                value={draftOr(`adj-${a.id}`, centsToDollarsInput(a.amountCents))}
                onChange={(e) => {
                  setDraft(`adj-${a.id}`, e.target.value);
                  updateAdjustment(a.id, "amount", e.target.value);
                }}
                onBlur={() => clearDraft(`adj-${a.id}`)}
              />
              <button
                onClick={() => removeAdjustment(a.id)}
                className="text-ledger-inkFaint hover:text-red-600"
                aria-label={`Remove ${a.label}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4 self-start text-sm font-medium">
        <button onClick={() => addAdjustment("discount")} className="text-brand-700 hover:underline">
          + Add discount
        </button>
        <button onClick={() => addAdjustment("charge")} className="text-brand-700 hover:underline">
          + Add service charge
        </button>
      </div>

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
            value={draftOr("tax", centsToDollarsInput(taxCents))}
            onChange={(e) => {
              setDraft("tax", e.target.value);
              setTaxCents(dollarsToCents(parseFloat(e.target.value) || 0));
            }}
            onBlur={() => clearDraft("tax")}
          />
        </label>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="flex items-center justify-between gap-2">
            Tip
            <input
              type="number"
              step="0.01"
              className={`w-20 rounded-md border px-2 py-1 text-right font-serif tabular-nums ${
                tipCents === 0 ? "border-amber-400 ring-1 ring-amber-200" : "border-ledger-rule"
              }`}
              value={draftOr("tip", centsToDollarsInput(tipCents))}
              onChange={(e) => {
                setDraft("tip", e.target.value);
                setTipCents(dollarsToCents(parseFloat(e.target.value) || 0));
              }}
              onBlur={() => clearDraft("tip")}
            />
          </label>
          <div className="flex justify-end gap-1.5">
            {TIP_PRESETS.map((pct) => {
              const presetCents = Math.round(itemsSubtotalCents * pct);
              const active = tipCents === presetCents;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    clearDraft("tip");
                    setTipCents(presetCents);
                  }}
                  className={`rounded-full border px-2 py-0.5 text-xs tabular-nums transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ledger-rule text-ledger-inkSoft hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  {Math.round(pct * 100)}%
                </button>
              );
            })}
          </div>
        </div>
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
