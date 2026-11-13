export const DASH = "—";

export function text(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DASH;
}

export function bytes(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  if (value < 1024) {
    return `${value} B`;
  }
  const units = ["KiB", "MiB", "GiB", "TiB", "PiB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const precision = size >= 100 ? 0 : digits;
  return `${size.toFixed(precision)} ${units[index]}`;
}

export function mhz(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${value.toFixed(digits)} MHz`;
}

export function ghz(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${(value / 1000).toFixed(digits)} GHz`;
}

export function temp(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${value.toFixed(digits)} °C`;
}

export function pct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${value.toFixed(digits)}%`;
}

export function watts(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${value.toFixed(digits)} W`;
}

export function rpm(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return `${Math.round(value).toLocaleString("en-US")} RPM`;
}

export function uptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return DASH;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m`;
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function unixDate(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return DASH;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

export function timeOnly(millis: number | null | undefined): string {
  if (millis === null || millis === undefined || !Number.isFinite(millis)) {
    return DASH;
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(millis));
}

export function decimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return value.toFixed(digits);
}

export function integer(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return DASH;
  }
  return Math.round(value).toLocaleString("en-US");
}

export function speed(mbps: number | null | undefined): string {
  if (mbps === null || mbps === undefined || !Number.isFinite(mbps) || mbps <= 0) {
    return DASH;
  }
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)} Gb/s`;
  }
  return `${mbps} Mb/s`;
}

export function yesNo(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return DASH;
  }
  return value ? "Yes" : "No";
}

export function list(values: string[] | null | undefined, separator = ", "): string {
  if (!values || values.length === 0) {
    return DASH;
  }
  return values.join(separator);
}

export function shortList(values: string[] | null | undefined, limit: number): string {
  if (!values || values.length === 0) {
    return DASH;
  }
  if (values.length <= limit) {
    return values.join(", ");
  }
  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function fileStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}-${`${date.getHours()}`.padStart(2, "0")}${`${date.getMinutes()}`.padStart(2, "0")}`;
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
