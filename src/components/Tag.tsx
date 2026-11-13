import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "muted" | "mint";

interface TagProps {
  children: ReactNode;
  tone?: Tone;
  title?: string;
}

export function Tag({ children, tone = "neutral", title }: TagProps) {
  return (
    <span className={`tag tag-${tone}`} title={title}>
      {children}
    </span>
  );
}

export function StatusDot({ tone = "ok" }: { tone?: Tone }) {
  return <span className={`status-dot is-${tone}`} />;
}
