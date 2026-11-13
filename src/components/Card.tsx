import type { ReactNode } from "react";

interface CardProps {
  index?: string;
  title: string;
  aside?: ReactNode;
  className?: string;
  flush?: boolean;
  children: ReactNode;
}

export function Card({ index, title, aside, className, flush, children }: CardProps) {
  return (
    <section className={`card${className ? ` ${className}` : ""}`}>
      <header className="card-head">
        {index && <span className="card-index">{index}</span>}
        <h2 className="card-title">{title}</h2>
        {aside && <div className="card-aside">{aside}</div>}
      </header>
      <div className={`card-body${flush ? " is-flush" : ""}`}>{children}</div>
    </section>
  );
}
