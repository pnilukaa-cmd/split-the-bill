export interface ReceiptItem {
  id: string;
  name: string;
  /** Total price for this line (already includes quantity), in cents. */
  priceCents: number;
  quantity: number;
}

/**
 * A discount (coupon, promo) or service charge (auto-gratuity for large
 * parties, etc.), distinct from tax and tip. Prorated across people the
 * same way tax and tip are — a discount subtracts, a charge adds.
 */
export interface Adjustment {
  id: string;
  label: string;
  /** Always a positive magnitude; `kind` decides the sign. */
  amountCents: number;
  kind: "discount" | "charge";
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  adjustments: Adjustment[];
  totalCents: number;
  /** Set when the line items + tax + tip + adjustments don't reconcile with the printed total. */
  warning?: string;
}

export interface Person {
  id: string;
  name: string;
  /** Emoji override for the person's avatar. Falls back to a color+initial when unset. */
  icon?: string;
}

/** itemId -> personIds currently sharing that item. */
export type Assignments = Record<string, string[]>;

/** itemId -> personId -> weight (units), for splitting a shared item unevenly. Missing entries default to 1. */
export type ItemWeights = Record<string, Record<string, number>>;

export interface PersonTotal {
  personId: string;
  name: string;
  itemsCents: number;
  taxCents: number;
  tipCents: number;
  /** Net of discounts (negative) and service charges (positive), prorated by this person's item share. */
  adjustmentsCents: number;
  totalCents: number;
}

export type WizardStep = "upload" | "quick-entry" | "review-items" | "people" | "assign" | "summary";
