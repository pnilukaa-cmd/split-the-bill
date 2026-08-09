import { colorForName, initialForName } from "@/lib/avatar";

interface Props {
  name: string;
  icon?: string;
  size?: "sm" | "md";
}

export default function PersonAvatar({ name, icon, size = "sm" }: Props) {
  const dimensionClasses = size === "md" ? "h-9 w-9 text-base" : "h-6 w-6 text-xs";

  if (icon) {
    return (
      <span
        className={`flex ${dimensionClasses} shrink-0 items-center justify-center rounded-full bg-white`}
        aria-hidden
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`flex ${dimensionClasses} shrink-0 items-center justify-center rounded-full font-serif font-semibold text-white`}
      style={{ backgroundColor: colorForName(name) }}
      aria-hidden
    >
      {initialForName(name)}
    </span>
  );
}
