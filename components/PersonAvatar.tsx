import { colorForName, initialForName } from "@/lib/avatar";

interface Props {
  name: string;
  icon?: string;
  size?: "sm" | "md";
}

export default function PersonAvatar({ name, icon, size = "sm" }: Props) {
  const boxClasses = size === "md" ? "h-9 w-9" : "h-6 w-6";
  const emojiTextClasses = size === "md" ? "text-base" : "text-xs";
  // NothingYouCouldDo is a script face — a single glyph needs to run larger
  // than the emoji size to stay legible at these small circle dimensions.
  const initialTextClasses = size === "md" ? "text-xl" : "text-sm";

  if (icon) {
    return (
      <span
        className={`flex ${boxClasses} ${emojiTextClasses} shrink-0 items-center justify-center rounded-full bg-ledger-surface`}
        aria-hidden
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`flex ${boxClasses} ${initialTextClasses} shrink-0 items-center justify-center rounded-full font-hand font-semibold text-white`}
      style={{ backgroundColor: colorForName(name) }}
      aria-hidden
    >
      {initialForName(name)}
    </span>
  );
}
