import { invoke } from "@tauri-apps/api/core";

import { demoPrivilegedInfo, demoSystemInfo } from "./demo";
import type { PrivilegedInfo, SystemInfo } from "./types";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const wait = (millis: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, millis);
  });

export async function collectSystemInfo(): Promise<{ info: SystemInfo; demo: boolean }> {
  if (!isTauri()) {
    return { info: demoSystemInfo(), demo: true };
  }
  const info = await invoke<SystemInfo>("collect_system_info");
  return { info, demo: false };
}

export async function loadPrivilegedInfo(refresh = false): Promise<PrivilegedInfo> {
  if (!isTauri()) {
    await wait(700);
    return demoPrivilegedInfo();
  }
  return invoke<PrivilegedInfo>("load_privileged_info", { refresh });
}

export async function setLivePaused(paused: boolean): Promise<void> {
  if (!isTauri()) {
    return;
  }
  await invoke("set_live_paused", { paused });
}

export async function saveReport(
  content: string,
  extension: "md" | "json",
): Promise<string | null> {
  const stamp = new Date();
  const filename = `specloupe-report-${stamp.getFullYear()}${`${stamp.getMonth() + 1}`.padStart(2, "0")}${`${stamp.getDate()}`.padStart(2, "0")}.${extension}`;

  if (!isTauri()) {
    const blob = new Blob([content], {
      type: extension === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return filename;
  }

  const { save } = await import("@tauri-apps/plugin-dialog");
  const path = await save({
    title: "Export SpecLoupe report",
    defaultPath: filename,
    filters: [
      {
        name: extension === "json" ? "JSON report" : "Markdown report",
        extensions: [extension],
      },
    ],
  });
  if (!path) {
    return null;
  }
  await invoke("write_report", { path, content });
  return path;
}
