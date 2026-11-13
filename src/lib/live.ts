import { average } from "./format";
import type { FanReading, GpuLive, LiveSnapshot } from "./types";

export function cpuLoad(snapshot: LiveSnapshot | null): number | null {
  if (!snapshot || snapshot.cpu.perCore.length === 0) {
    return null;
  }
  return average(snapshot.cpu.perCore.map((core) => core.usagePercent));
}

export function cpuFrequency(snapshot: LiveSnapshot | null): number | null {
  if (!snapshot) {
    return null;
  }
  const frequencies = snapshot.cpu.perCore
    .map((core) => core.freqMhz)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return frequencies.length > 0 ? average(frequencies) : null;
}

export function memoryPercent(snapshot: LiveSnapshot | null): number | null {
  if (!snapshot || snapshot.memory.totalBytes <= 0) {
    return null;
  }
  return (snapshot.memory.usedBytes / snapshot.memory.totalBytes) * 100;
}

export function primaryFan(snapshot: LiveSnapshot | null): FanReading | null {
  return snapshot?.fans[0] ?? null;
}

export function gpuLive(snapshot: LiveSnapshot | null, pciAddress: string): GpuLive | null {
  if (!snapshot) {
    return null;
  }
  return (
    snapshot.gpus.find((gpu) => gpu.pciAddress === pciAddress) ??
    snapshot.gpus[0] ??
    null
  );
}

export function cpuLoadSeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => cpuLoad(snapshot));
}

export function cpuTempSeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => snapshot.cpu.packageTempC);
}

export function cpuPowerSeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => snapshot.cpu.packagePowerW);
}

export function memoryPercentSeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => memoryPercent(snapshot));
}

export function fanSeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => snapshot.fans[0]?.rpm ?? null);
}

export function gpuFreqSeries(
  history: LiveSnapshot[],
  pciAddress: string,
): Array<number | null> {
  return history.map((snapshot) => gpuLive(snapshot, pciAddress)?.freqMhz ?? null);
}

export function gpuTempSeries(
  history: LiveSnapshot[],
  pciAddress: string,
): Array<number | null> {
  return history.map((snapshot) => gpuLive(snapshot, pciAddress)?.tempC ?? null);
}

export function batterySeries(history: LiveSnapshot[]): Array<number | null> {
  return history.map((snapshot) => snapshot.battery?.capacityPercent ?? null);
}
