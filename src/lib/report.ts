import {
  average,
  bytes,
  ghz,
  integer,
  list,
  pct,
  speed,
  temp,
  timeOnly,
  unixDate,
  uptime,
  watts,
  yesNo,
  DASH,
} from "./format";
import type { LiveSnapshot, PrivilegedInfo, SystemInfo } from "./types";

export type ReportFormat = "md" | "json";

const OMITTED = "[omitted]";

function redact(value: string | null, includeSensitive: boolean): string | null {
  if (includeSensitive) {
    return value;
  }
  return value ? OMITTED : null;
}

function sanitizeInfo(info: SystemInfo, includeSensitive: boolean): SystemInfo {
  const copy = structuredClone(info);
  if (includeSensitive) {
    return copy;
  }

  copy.board.boardSerial = redact(copy.board.boardSerial, false);
  for (const disk of copy.storage) {
    disk.serial = redact(disk.serial, false);
    for (const partition of disk.partitions) {
      partition.uuid = redact(partition.uuid, false);
    }
  }
  for (const net of copy.network) {
    net.mac = redact(net.mac, false);
    for (const address of net.addresses) {
      address.address = OMITTED;
    }
  }
  return copy;
}

function sanitizePrivileged(info: PrivilegedInfo, includeSensitive: boolean): PrivilegedInfo {
  const copy = structuredClone(info);
  if (includeSensitive) {
    return copy;
  }
  const dmi = copy.dmi;
  if (dmi) {
    for (const section of [dmi.bios, dmi.system, dmi.board, dmi.chassis]) {
      for (const field of section.fields) {
        if (/serial|uuid|asset\s*tag/i.test(field.key)) {
          field.value = OMITTED;
        }
      }
    }
    for (const device of dmi.memoryDevices) {
      device.serial = redact(device.serial, false);
    }
  }
  for (const smart of copy.smart) {
    smart.serial = redact(smart.serial, false);
  }
  return copy;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function table(rows: Array<[string, string | null | undefined]>): string {
  const cleaned = rows.filter(
    (row): row is [string, string] =>
      row[1] !== null && row[1] !== undefined && row[1] !== "" && row[1] !== DASH,
  );
  if (cleaned.length === 0) {
    return "_No data reported._";
  }
  return [
    "| Field | Value |",
    "| --- | --- |",
    ...cleaned.map(([key, value]) => `| ${escapeCell(key)} | ${escapeCell(value)} |`),
  ].join("\n");
}

function heading(level: number, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

function buildMarkdown(
  info: SystemInfo,
  privileged: PrivilegedInfo | null,
  live: LiveSnapshot | null,
  includeSensitive: boolean,
): string {
  const generated = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(new Date());

  const sections: string[] = [];
  sections.push(
    heading(1, "SpecLoupe report"),
    "",
    `Generated ${generated} · \`${info.overview.hostname ?? "unknown"}\` · SpecLoupe v0.1.0`,
    "",
    includeSensitive
      ? "> Privacy: the report includes serial numbers, MAC addresses and IP addresses."
      : "> Privacy: serial numbers, MAC addresses, IP addresses, asset tags and UUIDs are omitted.",
    "",
  );

  sections.push(
    heading(2, "System overview"),
    "",
    table([
      ["System vendor", info.overview.vendor],
      ["Product", info.overview.product],
      ["Product version", info.overview.productVersion],
      ["Chassis", info.overview.chassisType],
      ["Hostname", info.overview.hostname],
      ["Operating system", info.overview.osName],
      ["Kernel", info.overview.kernel],
      ["Architecture", info.overview.architecture],
      ["Desktop", info.overview.desktop],
      ["Session type", info.overview.sessionType],
      ["Uptime", uptime(info.overview.uptimeSeconds)],
      ["Booted", unixDate(info.overview.bootTimeUnix)],
      ["BIOS", [info.board.biosVendor, info.board.biosVersion].filter(Boolean).join(" ")],
      ["BIOS date", info.board.biosDate],
      ["Board", [info.board.boardVendor, info.board.boardName].filter(Boolean).join(" ")],
    ]),
    "",
  );

  const cpu = info.cpu;
  sections.push(
    heading(2, "Processor"),
    "",
    table([
      ["Model", cpu.model],
      ["Vendor", cpu.vendor],
      ["Family", cpu.family],
      ["Model ID", cpu.modelId],
      ["Stepping", cpu.stepping],
      ["Microcode", cpu.microcode],
      ["Architecture", cpu.architecture],
      ["Sockets", String(cpu.sockets)],
      ["Cores", String(cpu.cores)],
      ["Threads", String(cpu.threads)],
      ["Base clock", ghz(cpu.baseMhz)],
      ["Max boost", ghz(cpu.maxMhz)],
      ["Current clock", ghz(cpu.currentMhz)],
      ["Governor", cpu.governor],
      ["Driver", cpu.driver],
      ["Energy preference", cpu.energyPreference],
      ["Virtualization", list(cpu.virtualizations)],
    ]),
    "",
    heading(3, "Cache hierarchy"),
    "",
    [
      "| Level | Type | Size | Ways | Line | Shared by |",
      "| --- | --- | --- | --- | --- | --- |",
      ...cpu.caches.map(
        (cache) =>
          `| L${cache.level} | ${escapeCell(cache.kind)} | ${bytes(cache.sizeBytes)} | ${cache.ways ?? DASH} | ${cache.lineSize ?? DASH} | ${cache.sharedBy ?? DASH} |`,
      ),
    ].join("\n"),
    "",
    heading(3, "Kernel mitigations"),
    "",
    [
      "| Vulnerability | Status | Verdict |",
      "| --- | --- | --- |",
      ...cpu.vulnerabilities.map(
        (item) =>
          `| ${escapeCell(item.name)} | ${escapeCell(item.status)} | ${escapeCell(item.level)} |`,
      ),
    ].join("\n"),
    "",
  );

  sections.push(
    heading(2, "Motherboard"),
    "",
    table([
      ["System vendor", info.board.systemVendor],
      ["Product", info.board.productName],
      ["Product version", info.board.productVersion],
      ["Product family", info.board.productFamily],
      ["Product SKU", info.board.productSku],
      ["Board vendor", info.board.boardVendor],
      ["Board name", info.board.boardName],
      ["Board version", info.board.boardVersion],
      ["Board serial", info.board.boardSerial],
      ["BIOS vendor", info.board.biosVendor],
      ["BIOS version", info.board.biosVersion],
      ["BIOS date", info.board.biosDate],
      ["Chassis vendor", info.board.chassisVendor],
      ["Chassis type", info.board.chassisType],
      ["Chassis version", info.board.chassisVersion],
    ]),
    "",
  );

  if (privileged?.dmi) {
    sections.push(heading(3, "DMI detail"), "");
    for (const section of [
      privileged.dmi.bios,
      privileged.dmi.system,
      privileged.dmi.board,
      privileged.dmi.chassis,
    ]) {
      if (!section.title || section.fields.length === 0) {
        continue;
      }
      sections.push(heading(4, section.title), "", table(section.fields.map((field) => [field.key, field.value])), "");
    }
  }

  sections.push(
    heading(2, "Memory"),
    "",
    table([
      ["Total", bytes(info.memory.totalBytes)],
      ["Used", bytes(info.memory.usedBytes)],
      ["Available", bytes(info.memory.availableBytes)],
      ["Free", bytes(info.memory.freeBytes)],
      ["Cached", bytes(info.memory.cachedBytes)],
      ["Buffers", bytes(info.memory.buffersBytes)],
      ["Shared", bytes(info.memory.sharedBytes)],
      ["Swap total", bytes(info.memory.swapTotalBytes)],
      [
        "Swap used",
        bytes(Math.max(0, info.memory.swapTotalBytes - info.memory.swapFreeBytes)),
      ],
    ]),
    "",
  );

  if (privileged?.dmi?.memoryDevices?.length) {
    sections.push(
      heading(3, "Memory modules"),
      "",
      [
        "| Slot | Size | Type | Speed | Manufacturer | Part number | Serial |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...privileged.dmi.memoryDevices.map(
          (module) =>
            `| ${escapeCell(module.locator ?? DASH)} | ${escapeCell(module.size ?? DASH)} | ${escapeCell(module.kind ?? DASH)} | ${escapeCell(module.configuredSpeed ?? module.speed ?? DASH)} | ${escapeCell(module.manufacturer ?? DASH)} | ${escapeCell(module.partNumber ?? DASH)} | ${escapeCell(module.serial ?? DASH)} |`,
        ),
      ].join("\n"),
      "",
    );
  }

  sections.push(heading(2, "Graphics"), "");
  if (info.gpus.length === 0) {
    sections.push("_No PCI display device reported._", "");
  }
  info.gpus.forEach((gpu, index) => {
    sections.push(
      heading(3, `GPU ${index + 1} — ${[gpu.vendor, gpu.device].filter(Boolean).join(" ") || gpu.pciAddress}`),
      "",
      table([
        ["PCI address", gpu.pciAddress],
        ["Vendor ID", gpu.vendorId],
        ["Device ID", gpu.deviceId],
        ["Subsystem", gpu.subsystem],
        ["Class", gpu.class],
        ["Kernel driver", gpu.driver],
        ["Kernel modules", list(gpu.modules)],
        ["Video memory", gpu.vramBytes ? bytes(gpu.vramBytes) : null],
        ["Memory type", gpu.vramShared ? "Shared system memory" : null],
        ["PCIe link", gpu.pcie ? `${gpu.pcie.currentSpeed ?? DASH} × ${gpu.pcie.currentWidth ?? DASH}` : null],
      ]),
      "",
    );
    if (gpu.displays.length) {
      sections.push(
        heading(4, "Displays"),
        "",
        [
          "| Connector | Status | Mode | Monitor |",
          "| --- | --- | --- | --- |",
          ...gpu.displays.map(
            (display) =>
              `| ${escapeCell(display.connector)} | ${escapeCell(display.status)} | ${escapeCell(display.currentMode ?? DASH)} | ${escapeCell(display.monitorName ?? DASH)} |`,
          ),
        ].join("\n"),
        "",
      );
    }
    for (const api of [gpu.opengl, gpu.vulkan]) {
      if (!api) {
        continue;
      }
      sections.push(
        heading(4, api.name),
        "",
        table([
          ["Vendor", api.vendor],
          ["Renderer", api.renderer],
          ["Driver version", api.version],
          ["API version", api.apiVersion],
          ["Memory", api.memoryBytes ? bytes(api.memoryBytes) : null],
          ["Unified memory", api.unifiedMemory === null ? null : yesNo(api.unifiedMemory)],
        ]),
        "",
      );
    }
  });

  sections.push(heading(2, "Storage"), "");
  if (info.storage.length === 0) {
    sections.push("_No physical block devices reported._", "");
  }
  for (const disk of info.storage) {
    const smart = privileged?.smart.find((entry) => entry.device === disk.path);
    sections.push(
      heading(3, `${disk.model ?? disk.name} · ${bytes(disk.sizeBytes)}`),
      "",
      table([
        ["Device", disk.path],
        ["Model", disk.model],
        ["Serial", disk.serial ?? smart?.serial],
        ["Firmware", disk.firmware],
        ["Interface", disk.interface],
        ["Media", disk.rotational ? "Rotational" : "Solid state"],
        ["Temperature", temp(disk.temperatureC)],
        ["State", disk.state],
      ]),
      "",
    );
    if (disk.partitions.length) {
      sections.push(
        heading(4, "Partitions"),
        "",
        [
          "| Partition | Filesystem | Label | Mount | Size | Used | UUID |",
          "| --- | --- | --- | --- | --- | --- | --- |",
          ...disk.partitions.map(
            (partition) =>
              `| ${escapeCell(partition.name)} | ${escapeCell(partition.fstype ?? DASH)} | ${escapeCell(partition.label ?? DASH)} | ${escapeCell(partition.mountpoint ?? DASH)} | ${bytes(partition.sizeBytes)} | ${partition.fsUsePercent === null ? DASH : pct(partition.fsUsePercent, 1)} | ${escapeCell(partition.uuid ?? DASH)} |`,
          ),
        ].join("\n"),
        "",
      );
    }
    if (smart) {
      sections.push(
        heading(4, "SMART health"),
        "",
        table([
          ["Health", smart.healthText],
          ["Temperature", temp(smart.temperatureC)],
          ["Power-on hours", smart.powerOnHours === null ? null : integer(smart.powerOnHours)],
          ["Power cycles", smart.powerCycles === null ? null : integer(smart.powerCycles)],
          ["Data written", smart.dataWrittenBytes === null ? null : bytes(smart.dataWrittenBytes)],
          ["Wear level used", smart.percentageUsed === null ? null : pct(smart.percentageUsed, 1)],
          ["Media errors", smart.mediaErrors === null ? null : integer(smart.mediaErrors)],
        ]),
        "",
      );
    }
  }

  sections.push(heading(2, "Network"), "");
  if (info.network.length === 0) {
    sections.push("_No network interfaces reported._", "");
  }
  for (const net of info.network) {
    sections.push(
      heading(3, `${net.name}${net.isVirtual ? " · virtual" : net.isWireless ? " · wireless" : ""}`),
      "",
      table([
        ["State", net.state],
        ["MAC address", net.mac],
        ["Driver", net.driver],
        ["Device", net.device],
        ["PCI address", net.pciAddress],
        ["Link speed", speed(net.speedMbps)],
        ["MTU", net.mtu === null ? null : String(net.mtu)],
        [
          "Addresses",
          net.addresses.length
            ? net.addresses.map((address) => `${address.address}/${address.prefixLen}`).join(", ")
            : null,
        ],
      ]),
      "",
    );
  }

  sections.push(
    heading(2, "Software"),
    "",
    table([
      ["Distribution", info.software.distroName],
      ["Distribution ID", info.software.distroId],
      ["Distribution version", info.software.distroVersion],
      ["ID like", info.software.distroIdLike],
      ["Kernel", info.software.kernel],
      ["Kernel build", info.software.kernelBuild],
      ["Architecture", info.software.architecture],
      ["glibc", info.software.glibc],
      ["systemd", info.software.systemd],
      ["Desktop", info.software.desktop],
      ["Session type", info.software.sessionType],
      ["Shell", info.software.shell],
      ["Locale", info.software.locale],
      ["Timezone", info.software.timezone],
      ["Boot mode", info.software.bootMode],
      ["Secure boot", info.software.secureBoot === null ? null : yesNo(info.software.secureBoot)],
      ["Virtualization", info.software.virtualization],
      ["Package manager", info.software.packageManager],
      ["Installed packages", info.software.packageCount === null ? null : integer(info.software.packageCount)],
      ["Flatpak apps", info.software.flatpakCount === null ? null : integer(info.software.flatpakCount)],
      ["Kernel command line", info.software.kernelCmdline],
      ...info.software.extra.map((item) => [item.key, item.value] as [string, string]),
    ]),
    "",
  );

  if (live) {
    const load =
      live.cpu.perCore.length > 0
        ? average(live.cpu.perCore.map((core) => core.usagePercent))
        : null;
    sections.push(
      heading(2, "Latest live sample"),
      "",
      `Captured ${timeOnly(live.timestampMs)} · 1 Hz sampler`,
      "",
      table([
        ["CPU load", load === null ? null : pct(load, 1)],
        ["Package temperature", temp(live.cpu.packageTempC)],
        [
          "Package power",
          live.cpu.powerLocked ? "Locked (RAPL is root-only)" : watts(live.cpu.packagePowerW),
        ],
        ["Memory used", `${bytes(live.memory.usedBytes)} of ${bytes(live.memory.totalBytes)}`],
        ["Swap used", bytes(live.memory.swapUsedBytes)],
        ["Load average", live.cpu.loadAverage.map((value) => value.toFixed(2)).join(" · ")],
        ["Processes", live.processCount === null ? null : integer(live.processCount)],
        ["Fan speed", live.fans[0] ? `${integer(live.fans[0].rpm)} RPM` : null],
        ["Battery", live.battery ? pct(live.battery.capacityPercent, 0) : null],
      ]),
      "",
      [
        "| Sensor | Source | Value |",
        "| --- | --- | --- |",
        ...live.temperatures.map(
          (reading) =>
            `| ${escapeCell(reading.label)} | ${escapeCell(reading.source)} | ${temp(reading.valueC)} |`,
        ),
      ].join("\n"),
      "",
    );
  }

  sections.push(
    "---",
    "",
    "Generated locally by SpecLoupe. No telemetry, no network requests.",
    includeSensitive
      ? "This file contains identifying hardware data. Handle it with care."
      : "Sensitive identifiers were intentionally omitted.",
    "",
  );

  return sections.join("\n");
}

export function buildReport(options: {
  info: SystemInfo;
  privileged: PrivilegedInfo | null;
  live: LiveSnapshot | null;
  format: ReportFormat;
  includeSensitive: boolean;
}): string {
  const { info, privileged, live, format, includeSensitive } = options;
  const safeInfo = sanitizeInfo(info, includeSensitive);
  const safePrivileged = privileged
    ? sanitizePrivileged(privileged, includeSensitive)
    : null;

  if (format === "json") {
    return JSON.stringify(
      {
        generator: "SpecLoupe 0.1.0",
        generatedAt: new Date().toISOString(),
        privacy: {
          serialsIncluded: includeSensitive,
          macAddressesIncluded: includeSensitive,
          ipAddressesIncluded: includeSensitive,
          uuidsIncluded: includeSensitive,
        },
        system: safeInfo,
        privileged: safePrivileged,
        live,
      },
      null,
      2,
    );
  }

  return buildMarkdown(safeInfo, safePrivileged, live, includeSensitive);
}

export function reportSectionCount(): number {
  return 9;
}
