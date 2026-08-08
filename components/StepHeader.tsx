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
          className="mt-1 text-slate-400 transition hover:text-slate-700"
          aria-label="Back"
        >
          ←
        </button>
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
