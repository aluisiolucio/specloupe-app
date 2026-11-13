import type { ReactNode } from "react";

import { DASH } from "../lib/format";

interface SpecListProps {
  children: ReactNode;
  className?: string;
}

export function SpecList({ children, className }: SpecListProps) {
  return <dl className={`spec-list${className ? ` ${className}` : ""}`}>{children}</dl>;
}

interface SpecRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  tone?: "default" | "muted" | "accent" | "ok" | "warn" | "danger";
  title?: string;
  wide?: boolean;
}

export function SpecRow({
  label,
  value,
  mono = true,
  tone = "default",
  title,
  wide = false,
}: SpecRowProps) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div
      className={`spec-row${wide ? " is-wide" : ""}${tone !== "default" ? ` tone-${tone}` : ""}`}
      title={title}
    >
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{empty ? DASH : value}</dd>
    </div>
  );
}
