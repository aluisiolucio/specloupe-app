import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("specloupe-theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // Storage can be unavailable in hardened webviews; fall through to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0a0d10" : "#f2efe8");
    try {
      window.localStorage.setItem("specloupe-theme", theme);
    } catch {
      // Ignore storage failures.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
