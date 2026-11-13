import type { IconName } from "../lib/tabs";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

function paths(name: IconName) {
  switch (name) {
    case "loupe":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.4 15.4 5.1 5.1" />
          <path d="M10.5 7.5v6M7.5 10.5h6" opacity=".45" />
        </>
      );
    case "cpu":
      return (
        <>
          <rect x="6" y="6" width="12" height="12" rx="1.2" />
          <rect x="9.5" y="9.5" width="5" height="5" rx=".5" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
        </>
      );
    case "board":
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1.2" />
          <rect x="7" y="8" width="5" height="5" rx=".6" />
          <path d="M15 8h3M15 11h3M7 16h11" />
        </>
      );
    case "memory":
      return (
        <>
          <rect x="3" y="7" width="18" height="9" rx="1" />
          <path d="M7 7v9M11 7v9M15 7v9M19 7v9M6 16v3M10 16v3M14 16v3M18 16v3" />
        </>
      );
    case "gpu":
      return (
        <>
          <rect x="3" y="6" width="18" height="11" rx="1.2" />
          <circle cx="13.5" cy="11.5" r="2.5" />
          <path d="M6 9h4M6 12h4M6 15h2M8 17v3M18 17v3" />
        </>
      );
    case "storage":
      return (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="2.5" />
          <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
          <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
        </>
      );
    case "network":
      return (
        <>
          <path d="M3 9a14 14 0 0 1 18 0" />
          <path d="M6.5 12.5a9 9 0 0 1 11 0" />
          <path d="M10 16a4 4 0 0 1 4 0" />
          <circle cx="12" cy="19" r=".9" fill="currentColor" stroke="none" />
        </>
      );
    case "software":
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1.2" />
          <path d="m7 9 3 3-3 3M13 15h4" />
        </>
      );
    case "sensors":
      return <path d="M3 12h4l2.2-5 4 10 2.3-5H21" />;
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
        </>
      );
    case "moon":
      return <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />;
    case "download":
      return (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 20h16" />
        </>
      );
    case "refresh":
      return (
        <>
          <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
          <path d="M4 4v4h4M20 20v-4h-4" />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
          <circle cx="12" cy="15" r="1" />
        </>
      );
    case "unlock":
      return (
        <>
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
          <path d="M8 10.5V7a4 4 0 0 1 7.7-1.5" />
        </>
      );
    case "check":
      return <path d="m5 12.5 4.5 4.5L19 7.5" />;
    case "x":
      return <path d="m6 6 12 12M18 6 6 18" />;
    case "alert":
      return (
        <>
          <path d="M12 3.5 2.8 20h18.4L12 3.5Z" />
          <path d="M12 9v5M12 17.2v.1" />
        </>
      );
    case "pause":
      return <path d="M9 5v14M15 5v14" />;
    case "play":
      return <path d="m8 5 11 7-11 7V5Z" />;
    case "shield":
      return (
        <>
          <path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths(name)}
    </svg>
  );
}
