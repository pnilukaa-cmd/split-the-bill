import { ParsedReceipt } from "./types";

// Used by the "sample receipt" shortcut so the rest of the flow (people,
// assign, summary) can be tested repeatedly without paying for a real
// OCR call each time. See ReceiptUpload's demo-mode gating.
export const MOCK_RECEIPT: ParsedReceipt = {
  items: [
    { id: "mock-1", name: "Margherita Pizza", priceCents: 1600, quantity: 1 },
    { id: "mock-2", name: "Caesar Salad", priceCents: 1200, quantity: 1 },
    { id: "mock-3", name: "Craft Beer", priceCents: 700, quantity: 2 },
    { id: "mock-4", name: "Tiramisu", priceCents: 900, quantity: 1 },
  ],
  subtotalCents: 4400,
  taxCents: 385,
  tipCents: 800,
  totalCents: 5585,
};
