// A small palette of "ink" colors, like different pens used across a
// ledger's entries — kept muted so any of them reads fine as a solid
// circle background, unlike a full rainbow palette.
const INK_COLORS = [
  "#1f5c43", // forest
  "#9c7a2c", // brass
  "#a34a2f", // rust
  "#38507c", // indigo
  "#6b3a56", // plum
  "#3f6b6e", // teal
  "#6b6b2f", // olive
  "#7a2f3f", // burgundy
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return INK_COLORS[Math.abs(hash) % INK_COLORS.length];
}

export function initialForName(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// A curated, dining-themed set rather than a full emoji picker — every
// option is on-topic and the whole set is scannable in one glance.
export const PERSON_ICONS = [
  "🍕", "🍔", "🌮", "🍣", "🥗", "🍰", "🍷", "🍺",
  "🍹", "🍦", "🥑", "🍗", "🧀", "🍜", "🥐", "🍩",
  "🍤", "🥩", "🍟", "🍪", "🍫", "🍇", "🥂", "🍿",
];
