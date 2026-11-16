# SpecLoupe — complete spec inventory

Review of every value SpecLoupe collects and where it appears. Baseline:
v0.1.4, after the A + B + C cleanup and the security hardening pass.

Legend:

- **UI** — rendered in the desktop app.
- **MD** — rendered in the Markdown report.
- **Toggle** — rendered only after the user enables a disclosure or filter.
- **Live** — sampled at 1 Hz.
- Every field listed below is present in the JSON export unless marked otherwise.
- `DASH` means the UI prints an em dash when the kernel/firmware does not expose it.

## 1. Machine overview (`Overview`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `hostname` | Overview identity, top bar, Software session, MD | Identifies the machine |
| `osName` | Overview hero + identity, MD | Duplicated with Software → distribution |
| `kernel` | Overview hero + identity, MD | Duplicated with Software → kernel |
| `architecture` | Board page, MD | Duplicated with Software → architecture |
| `uptimeSeconds` | Overview hero + identity, MD | Useful |
| `bootTimeUnix` | Overview identity, MD | Low value, but cheap |
| `vendor` | Overview identity, MD | Useful |
| `product` | Overview hero + identity, MD | Useful |
| `productVersion` | Overview identity, MD | Low value |
| `chassisType` | Overview hero + identity, MD | Useful |
| Derived subtitle | Overview hero | CPU model · total RAM · first GPU name |
| Per-core activity bars | Overview processor card | Derived from live topology |

## 2. Processor (`CPU`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `model` | CPU title, Overview subtitle, MD | Core identity |
| `vendor` | CPU identification, MD | Useful |
| `family` | CPU identification, MD | Enthusiast detail |
| `modelId` | CPU identification, MD | Enthusiast detail |
| `stepping` | CPU identification, MD | Enthusiast detail |
| `microcode` | CPU identification, MD | Useful for firmware checks |
| `architecture` | CPU intro + identification, MD | Duplicated on Board/Software |
| `sockets` | CPU intro, Overview, MD | Useful |
| `cores` | CPU intro, Overview, MD | Useful |
| `threads` | CPU intro, Overview, MD | Useful |
| `baseMhz` | Clocks card, Overview, MD | Useful |
| `maxMhz` | Clocks card, Overview, MD | Useful |
| `minMhz` | Clocks card, MD | Low value for most users |
| `currentMhz` | Clocks card, Overview, MD | Useful |
| `governor` | Clocks card, Overview, MD | Useful |
| `driver` | Clocks card, MD | Low value |
| `energyPreference` | Clocks card, MD | Enthusiast detail |
| `virtualizations` | Identification + header tags, MD | Useful |
| `flags` | Instruction set card | Up to 24 notable flags; full list behind “Show all” |
| `caches.level/kind/size` | Cache table, MD | Useful |
| `caches.ways` | Cache table, MD | Enthusiast detail |
| `caches.lineSize` | Cache table, MD | Enthusiast detail |
| `caches.sharedBy` | Cache table, MD | Enthusiast detail |
| `topology.coreId/packageId/threads` | Core topology tiles, Overview bars | Useful; package ID itself is not shown |
| `topology.maxMhz/currentMhz` | Core tiles (“max” + live clock) | Useful |
| `vulnerabilities.name/status/level` | Vulnerabilities card, MD | Security-relevant |
| Live per-core usage/frequency | Overview, Sensors, live tables | Useful |
| Live package temp/power | Overview, Sensors, MD latest sample | Useful |
| Live load average / process count | Sensors, MD latest sample | Useful |
| Live governor | Sensors, MD latest sample | Useful |

## 3. Motherboard & firmware (`Board`)

### Curated board data

| Field | Shown in | Notes |
| --- | --- | --- |
| `systemVendor` | System identity, MD | Useful |
| `productName` | Page title + identity, MD | Useful |
| `productVersion` | System identity, MD | Low value |
| `productFamily` | System identity, MD | Low value |
| `productSku` | System identity, MD | Low value |
| `boardVendor` | Board & firmware, MD | Useful |
| `boardName` | Board & firmware, MD | Useful |
| `boardVersion` | Board & firmware, MD | Useful |
| `boardSerial` | Board & firmware, MD | Protected; shown as LOCKED until authorized |
| `biosVendor` | Board & firmware, MD | Useful |
| `biosVersion` | Board & firmware, MD | Useful |
| `biosDate` | Board & firmware, MD | Useful |
| `chassisVendor` | System identity, MD | Low value |
| `chassisType` | System identity + header tag, MD | Useful |
| `chassisVersion` | System identity, MD | Low value |
| `serialLocked` | Board tags | Derived indicator |
| `architecture` | Board & firmware | Comes from `overview.architecture`; duplicate of CPU/Software |

### Raw SMBIOS sections (privileged, behind a toggle)

The Motherboard page keeps the curated cards visible and puts the raw DMI dump
behind **Show raw SMBIOS** (off by default):

- **BIOS Information** — vendor, version, release date, address, runtime size, ROM size, platform firmware revision, embedded controller firmware revision, etc.
- **System Information** — manufacturer, product name, version, serial number, UUID, wake-up type, SKU number, family, etc.
- **Base Board Information** — manufacturer, product name, version, serial number, asset tag, etc.
- **Chassis Information** — manufacturer, type, version, serial number, asset tag, SKU number, etc.

These duplicate the curated cards above and include several fields users rarely
need (`Address`, `Runtime Size`, `ROM Size`, `Asset Tag`, `SKU Number`, etc.).

### SMBIOS processors (behind the same toggle)

| Field | Shown in | Notes |
| --- | --- | --- |
| `socket` | SMBIOS processors card | Useful |
| `version` | SMBIOS processors card | Duplicate of CPU model |
| `maxSpeed` | SMBIOS processors card | Duplicate of CPU max clock |
| `currentSpeed` | SMBIOS processors card | Duplicate of CPU current clock |
| `coreCount` / `threadCount` | SMBIOS processors card | Duplicate of CPU |
| `l2Cache` / `l3Cache` | SMBIOS processors card | Useful but duplicate of cache table |

## 4. Memory (`Memory`)

### Live kernel allocation

| Field | Shown in | Notes |
| --- | --- | --- |
| `totalBytes` | Allocation hero + spec list, Overview, MD | Useful |
| `availableBytes` | Allocation hero + spec list, MD | Useful |
| `usedBytes` | Allocation hero + spec list, Overview, MD | Useful |
| `freeBytes` | Allocation spec list, MD | Useful |
| `cachedBytes` | Allocation legend + spec list, Overview, MD | Useful |
| `buffersBytes` | JSON export and MD | Kept in the data model; no longer a UI row |
| `sharedBytes` | JSON export and MD | Kept in the data model; no longer a UI row |
| `swapTotalBytes` | Allocation spec list, MD | Useful |
| `swapFreeBytes` | Allocation spec list (derived swap used), MD | Useful |
| Live `total/used/available/swap` | Overview, Sensors, MD latest sample | Useful |

### Physical modules (SMBIOS type 17, privileged)

| Field | Shown in | Notes |
| --- | --- | --- |
| `locator` | Module header + empty-card slot row | Useful |
| `bankLocator` | Sub-label under slot header; empty-card row | Useful for slot identification |
| `size` | Module tag (e.g. `8 GiB`) | Useful |
| `kind` | Type row (e.g. DDR5) | Useful |
| `speed` | Speed row | Useful |
| `configuredSpeed` | Configured speed row | Useful |
| `manufacturer` | Manufacturer row | Useful |
| `serial` | Serial row, MD | Protected; export redacted by default |
| `partNumber` | Part number row, MD | Useful |
| `rank` | Rank row | Enthusiast detail |
| `voltage` | Voltage row | Often `DASH`; low value |
| `formFactor` | Form factor row | Useful |
| `populated` | Drives the empty-slot card | Useful |
| Empty slot | Dedicated dashed card with slot, bank locator, status | Shows free slots explicitly |
| `swapFreeBytes` derived | Swap used row | Derived |

## 5. Graphics (`GPU`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `pciAddress` | Showcase subtitle + device card, MD | Useful |
| `vendor` / `device` | Showcase title + device card, MD | Useful |
| `vendorId` / `deviceId` | Showcase subtitle + device card, MD | Enthusiast detail |
| `subsystem` | Device card, MD | Enthusiast detail |
| `class` | Device card, MD | Low value (`VGA compatible controller`) |
| `driver` | Showcase tag + device card, MD | Useful |
| `modules` | Device card, MD | Enthusiast detail |
| `vramBytes` | Showcase readout + video memory note, MD | Useful |
| `vramShared` | Shared-memory tag + note, MD | Useful on iGPUs |
| `drmCard` | Device card | Low value |
| `pcie.currentSpeed/currentWidth` | PCIe card, MD | Useful |
| `pcie.maxSpeed/maxWidth` | PCIe card | Useful for link health |
| Display `connector/status/currentMode/monitorName` | Displays card, MD | Useful |
| Display `sizeCm` | Displays card | Low value |
| Display `modes` | Displays card, behind **Show display modes** | Full list kept in JSON export |
| OpenGL `name/vendor/renderer/version/apiVersion/memory/unified` | OpenGL card, MD | Useful, but often duplicates Vulkan |
| Vulkan `name/vendor/renderer/version/apiVersion/memory/unified` | Vulkan card, MD | Useful, but often duplicates OpenGL |
| Live GPU frequency | GPU showcase + Sensors, MD latest sample | Useful |
| Live GPU temperature/usage | GPU showcase | Useful |

## 6. Storage (`Storage`)

### Disks

| Field | Shown in | Notes |
| --- | --- | --- |
| `name` / `path` | Capacity tags, MD | Useful |
| `model` | Card title + model row, MD | Useful |
| `serial` | Serial row, MD | Protected; export redacted by default |
| `firmware` | Firmware row, MD | Useful |
| `sizeBytes` | Capacity readout, MD | Useful |
| `interface` | Header tag + interface row, MD | Useful |
| `rotational` | SSD/HDD tag, MD | Useful |
| `removable` | Removable tag | Useful |
| `state` | State row, MD | Useful |
| `temperatureC` | Header tag + temp row, MD | Useful |
| Partitions | Table | See below |

### Partitions

| Field | Shown in | Notes |
| --- | --- | --- |
| `name` | Partition table, MD | Useful |
| `sizeBytes` | Partition table, MD | Useful |
| `fstype` | Partition table, MD | Useful |
| `label` | Partition table, MD | Useful |
| `uuid` | MD only (redacted by default) | Not shown in the UI |
| `mountpoint` | Partition table, MD | Useful |
| `fsTotalBytes` | Overview storage card (root), MD indirectly | Used only for root summary |
| `fsUsedBytes` | Overview storage card (root), MD indirectly | Used only for root summary |
| `fsAvailableBytes` | **Hidden** | Collected and exported, never displayed |
| `fsUsePercent` | Partition usage meter, MD | Useful |

### SMART (privileged)

| Field | Shown in | Notes |
| --- | --- | --- |
| `device` | Matched to disk, MD | Useful |
| `serial` | Fallback serial, MD | Protected |
| `healthPassed` / `healthText` | SMART badge | Useful |
| `temperatureC` | SMART strip, MD | Useful |
| `powerOnHours` | SMART strip, MD | Useful |
| `powerCycles` | SMART strip, MD | Useful |
| `percentageUsed` | SMART strip, MD | Useful |
| `dataWrittenBytes` | SMART strip, MD | Useful |
| `mediaErrors` | SMART strip, MD | Useful |
| `reallocatedSectors` | SMART strip + MD only when > 0 | Amber warning |
| `pendingSectors` | SMART strip + MD only when > 0 | Red warning |
| `uncorrectableSectors` | SMART strip + MD only when > 0 | Red warning |

## 7. Network (`Network`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `name` | Card title, Overview connectivity | Useful |
| `mac` | MAC row, MD | Protected; export redacted by default |
| `state` | Header tag + state row, MD | Useful |
| `speedMbps` | Link speed row, MD | Useful |
| `duplex` | Duplex row | Useful |
| `mtu` | MTU row, MD | Low value |
| `driver` | Driver row, MD | Useful |
| `device` | Device row, MD | Useful |
| `pciAddress` | PCI address row, MD | Useful |
| `isWireless` | Wireless tag, MD title | Useful |
| `isVirtual` | Virtual tag, MD title | Drives the default filter |
| `addresses.family` | Address chip, MD | Useful |
| `addresses.address` | Address chip, MD | Protected; export redacted by default |
| `addresses.prefixLen` | Address chip, MD | Useful |
| `addresses.scope` | Address chip | Drives the link-local filter |
| Virtual interfaces | Behind **Show virtual interfaces** (off by default) | Loopback, bridges, VPN, container links |
| IPv6 link-local addresses | Behind **Show link-local addresses** (off by default) | `scope=link` chips |

## 8. Software & environment (`Software`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `distroName` | Page title + OS card, MD | Useful |
| `distroId` | OS card, MD | Low value |
| `distroVersion` | OS card, MD | Useful |
| `distroIdLike` | OS card, MD | Low value |
| `architecture` | OS card, MD | Duplicate row removed from Package inventory |
| `glibc` | OS card, MD | Low value |
| `systemd` | OS card, MD | Low value |
| `kernel` | Kernel card, MD | Useful |
| `kernelBuild` | Kernel card, MD | Low value |
| `bootMode` | Kernel card + header tag, MD | Useful |
| `secureBoot` | Kernel card + header tag, MD | Useful |
| `virtualization` | Kernel card, MD | Useful |
| `kernelCmdline` | Kernel card, behind **Show advanced details** | Long; low value outside debugging |
| `desktop` | Session card, MD | Useful |
| `sessionType` | Session card, MD | Useful |
| `shell` | Session card, MD | Low value |
| `locale` | Session card, MD | Low value |
| `timezone` | Session card, MD | Low value |
| `hostname` | Session card, MD | Duplicate of Overview |
| `packageManager` | Package card, MD | Useful |
| `packageCount` | Package card, MD | Useful |
| `flatpakCount` | Package card, MD | Useful only on Flatpak systems |
| `extra.VARIANT` / `VARIANT_ID` | OS-release card, behind **Show advanced details** | Low value |
| `extra.BUILD_ID` | OS-release card, behind **Show advanced details** | Low value |
| `extra.HOME_URL` | Filtered out of the UI and Markdown report | Irrelevant for a hardware inspector |
| `extra.DOCUMENTATION_URL` | Filtered out of the UI and Markdown report | Irrelevant for a hardware inspector |

## 9. Live telemetry (`Sensors`)

| Field | Shown in | Notes |
| --- | --- | --- |
| `timestampMs` | Sensors header + kernel context, MD | Useful |
| `cpu.perCore.id/usagePercent/freqMhz` | Overview, Sensors, per-core grid | Useful |
| `cpu.perCore.tempC` | **Always null currently** | Placeholder; never populated |
| `cpu.packageTempC` | Overview, Sensors, MD | Useful |
| `cpu.packagePowerW` | Sensors (RAPL), MD | Useful |
| `cpu.powerLocked` | Sensors lock state, MD | Useful |
| `cpu.loadAverage` | Sensors kernel context, MD | Useful |
| `cpu.governor` | Sensors kernel context, MD | Useful |
| `memory.total/used/available/swapTotal/swapUsed` | Overview, Sensors, MD | Some values duplicate static memory page |
| `gpus.pciAddress/freqMhz/tempC/usagePercent` | GPU page, Sensors (frequency) | Useful |
| `temperatures.source/label/valueC` | Sensors temperature list, MD | Useful; can be a long list |
| `fans.source/label/rpm` | Sensors fan list, MD (first fan only) | Useful |
| `battery.name` | Battery card | Useful |
| `battery.capacityPercent` | Sensors metric + battery card, MD | Useful |
| `battery.status` | Battery tag, MD | Useful |
| `battery.voltageV` | Battery card | Useful |
| `battery.powerW` | Battery card | Useful |
| `battery.energyNowWh` | Battery card | Useful |
| `processCount` | Sensors kernel context, MD | Useful |

## 10. Capabilities / internal flags

| Field | Used by | Notes |
| --- | --- | --- |
| `privilegedAvailable` | Privileged panel + startup authorization | Useful |
| `smartAvailable` | Privileged panel notice | Useful |
| `raplLocked` | Sensors package-power lock notice | Useful |

## 11. What changed in v0.1.3

### A. Removed (unused or duplicate)

- `Overview.desktop`, `Overview.sessionType`, `Overview.isLaptop`.
- Five unused capability flags: `lmSensorsAvailable`, `nvidiaSmiAvailable`,
  `rocmSmiAvailable`, `vulkaninfoAvailable`, `glxinfoAvailable`.
- `DmiProcessor.l1Cache`, `StorageDisk.vendor`, `PartitionInfo.path`,
  `PartitionInfo.kind`, `NetInterface.vendor`, `DisplayOutput.enabled`,
  `BatteryLive.energyFullWh`, `GpuLive.name/vramUsed/vramTotal`,
  `SmartInfo.model/firmware`.
- Duplicate `architecture` row in Software → Package inventory.
- `extra.HOME_URL` and `extra.DOCUMENTATION_URL` from the UI and Markdown report.

### B. Hidden behind a disclosure or filter by default

- Raw DMI tables and SMBIOS processors → **Show raw SMBIOS**.
- Virtual network interfaces → **Show virtual interfaces**.
- IPv6 link-local addresses → **Show link-local addresses**.
- `kernelCmdline` and OS-release extras → **Show advanced details**.
- Memory `buffers`/`shared` rows removed from the allocation card.
- GPU display modes → **Show display modes**.
- CPU flags → notable virtualization/security/crypto flags, full list behind
  **Show all (N)**.

### C. Surfaced SMART health signals

- `reallocatedSectors`, `pendingSectors`, `uncorrectableSectors` now appear in
  the SMART strip and Markdown report only when greater than zero, using amber
  and red warning colors.

### D. Deliberately kept

- CPU model, cores/threads, clocks, cache size, vulnerabilities.
- Motherboard product, board name, BIOS vendor/version/date, serial (protected).
- Memory total/used, physical modules, speeds, empty slots.
- GPU model, driver, VRAM, PCIe link, display connections, OpenGL/Vulkan.
- Storage model, capacity, filesystem usage, SMART health and wear indicators.
- Physical network links, driver, link speed, addresses.
- Distribution, kernel, desktop/session, package count.
- Live package temperature/power, load, memory, fans, battery, sensors.

## 12. Security hardening in v0.1.4

No spec data changed in this release. The desktop shell was tightened:

- Production and development Content Security Policies now restrict scripts,
  styles, fonts, images and connections to local assets and Tauri IPC.
- The dialog capability was reduced from all dialog commands to
  `dialog:allow-save`.
- `write_report` accepts only `.md`/`.json` paths and a 16 MiB content limit,
  and no longer creates arbitrary directories.
- Audit findings: no HTTP client or outbound request code; no shell, filesystem
  or HTTP plugins; only `/proc`, `/sys`, `/etc/os-release` and efivars are read;
  the privileged helper runs `dmidecode` and `smartctl -a` read-only.
