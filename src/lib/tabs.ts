import type { TabId } from "./types";

export type IconName =
  | "loupe"
  | "cpu"
  | "board"
  | "memory"
  | "gpu"
  | "storage"
  | "network"
  | "software"
  | "sensors"
  | "download"
  | "refresh"
  | "lock"
  | "unlock"
  | "check"
  | "x"
  | "alert"
  | "pause"
  | "play"
  | "shield";

export interface TabMeta {
  id: TabId;
  index: string;
  icon: IconName;
  group: "machine" | "hardware" | "environment" | "telemetry";
}

export const TABS: TabMeta[] = [
  { id: "overview", index: "01", icon: "loupe", group: "machine" },
  { id: "cpu", index: "02", icon: "cpu", group: "hardware" },
  { id: "board", index: "03", icon: "board", group: "hardware" },
  { id: "memory", index: "04", icon: "memory", group: "hardware" },
  { id: "gpu", index: "05", icon: "gpu", group: "hardware" },
  { id: "storage", index: "06", icon: "storage", group: "hardware" },
  { id: "network", index: "07", icon: "network", group: "hardware" },
  { id: "software", index: "08", icon: "software", group: "environment" },
  { id: "sensors", index: "09", icon: "sensors", group: "telemetry" },
];

export function tabMeta(id: TabId): TabMeta {
  return TABS.find((tab) => tab.id === id) ?? TABS[0];
}
