import { t } from "../i18n/en";
import { Sparkline } from "./Sparkline";
import { Tag } from "./Tag";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  values: Array<number | null>;
  min?: number;
  max?: number;
  tone?: "accent" | "mint" | "danger";
  footLeft?: string;
  footRight?: string;
  locked?: boolean;
  title?: string;
}

const COLORS = {
  accent: "var(--accent)",
  mint: "var(--mint)",
  danger: "var(--danger)",
};

export function MetricCard({
  label,
  value,
  unit,
  values,
  min,
  max,
  tone = "accent",
  footLeft,
  footRight,
  locked,
  title,
}: MetricCardProps) {
  return (
    <article className="metric-card" title={title}>
      <header className="metric-head">
        <span className="metric-label">{label}</span>
        {locked && <Tag tone="warn">{t.labels.locked}</Tag>}
      </header>
      <div className="metric-readout">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <Sparkline
        values={values}
        min={min}
        max={max}
        color={COLORS[tone]}
        height={44}
        label={`${label} over the last 60 seconds`}
      />
      <footer className="metric-foot">
        <span>{footLeft ?? "60 s"}</span>
        <span>{footRight}</span>
      </footer>
    </article>
  );
}
