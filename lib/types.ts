export interface ReceiptItem {
  id: string;
  name: string;
  /** Total price for this line (already includes quantity), in cents. */
  priceCents: number;
  quantity: number;
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  /** Set when the line items + tax + tip don't reconcile with the printed total. */
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
  totalCents: number;
}

export type WizardStep = "upload" | "review-items" | "people" | "assign" | "summary";
