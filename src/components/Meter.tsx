import { clamp } from "../lib/format";

interface MeterProps {
  value: number;
  tone?: "accent" | "mint" | "danger" | "warn";
  label?: string;
}

export function Meter({ value, tone = "accent", label }: MeterProps) {
  const safe = clamp(value);
  return (
    <div
      className={`meter meter-${tone}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      aria-label={label}
    >
      <span className="meter-fill" style={{ width: `${safe}%` }} />
    </div>
  );
}
