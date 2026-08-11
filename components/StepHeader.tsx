interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function StepHeader({ title, subtitle, onBack }: Props) {
  return (
    <div className="flex items-start gap-2">
      {onBack && (
        <button
          onClick={onBack}
          className="mt-1 text-ledger-inkFaint transition hover:text-ledger-ink"
          aria-label="Back"
        >
          ←
        </button>
      )}
      <div>
        <h2 className="font-hand text-2xl text-ledger-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ledger-inkSoft">{subtitle}</p>}
      </div>
    </div>
  );
}
