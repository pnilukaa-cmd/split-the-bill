import { Assignments, ParsedReceipt, Person, PersonTotal } from "./types";

/**
 * Splits an integer amount across weighted shares so the parts sum exactly
 * back to `amountCents` (largest-remainder method) — plain proportional
 * division leaves rounding cents unaccounted for, which is unacceptable
 * when the numbers represent money people owe each other.
 */
function distributeProportionally(amountCents: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0 || amountCents === 0) {
    return weights.map(() => 0);
  }
  const raw = weights.map((w) => (amountCents * w) / totalWeight);
  const floors = raw.map(Math.floor);
  const distributed = floors.reduce((a, b) => a + b, 0);
  let remainder = amountCents - distributed;

  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < remainder; k++) {
    result[order[k % order.length].i] += 1;
  }
  return result;
}

export interface SplitResult {
  totals: PersonTotal[];
  unassignedItemIds: string[];
}

export function computeSplit(
  receipt: ParsedReceipt,
  people: Person[],
  assignments: Assignments
): SplitResult {
  const itemsCentsByPerson: Record<string, number> = {};
  people.forEach((p) => (itemsCentsByPerson[p.id] = 0));

  const unassignedItemIds: string[] = [];
  const validPersonIds = new Set(people.map((p) => p.id));

  for (const item of receipt.items) {
    const assignees = (assignments[item.id] ?? []).filter((id) => validPersonIds.has(id));
    if (assignees.length === 0) {
      unassignedItemIds.push(item.id);
      continue;
    }
    const shares = distributeProportionally(
      item.priceCents,
      assignees.map(() => 1)
    );
    assignees.forEach((personId, idx) => {
      itemsCentsByPerson[personId] += shares[idx];
    });
  }

  const weights = people.map((p) => itemsCentsByPerson[p.id]);
  const taxShares = distributeProportionally(receipt.taxCents, weights);
  const tipShares = distributeProportionally(receipt.tipCents, weights);

  const totals: PersonTotal[] = people.map((p, idx) => {
    const itemsCents = itemsCentsByPerson[p.id];
    const taxCents = taxShares[idx];
    const tipCents = tipShares[idx];
    return {
      personId: p.id,
      name: p.name,
      itemsCents,
      taxCents,
      tipCents,
      totalCents: itemsCents + taxCents + tipCents,
    };
  });

  return { totals, unassignedItemIds };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
