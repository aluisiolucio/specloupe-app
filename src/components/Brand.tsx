import { t } from "../i18n/en";

export function LoupeMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="loupe-mark"
    >
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="9"
        className="loupe-mark-bg"
      />
      <circle cx="17.4" cy="17.4" r="9.4" className="loupe-mark-ring" strokeWidth="2.3" />
      <circle cx="17.4" cy="17.4" r="4.4" className="loupe-mark-die" strokeWidth="1.4" />
      <path d="M24.2 24.2 31 31" className="loupe-mark-ring" strokeWidth="3.3" strokeLinecap="round" />
      <path
        d="M13.2 17.4h8.4M17.4 13.2v8.4"
        className="loupe-mark-ring"
        strokeWidth="0.9"
        opacity="0.5"
      />
    </svg>
  );
}

export function Brand() {
  return (
    <div className="brand">
      <LoupeMark />
      <div className="brand-copy">
        <div className="brand-name">{t.app.name}</div>
        <div className="brand-tagline">{t.app.tagline}</div>
      </div>
    </div>
  );
}
