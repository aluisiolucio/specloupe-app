import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}

export function PageIntro({ eyebrow, title, description, aside }: PageIntroProps) {
  return (
    <header className="page-intro">
      <div className="page-intro-main">
        <div className="eyebrow">
          <span className="eyebrow-rule" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="page-intro-aside">{aside}</div>}
    </header>
  );
}
