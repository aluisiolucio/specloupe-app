export interface KeyValue {
  key: string;
  value: string;
}

export interface SystemInfo {
  overview: Overview;
  cpu: CpuInfo;
  board: BoardInfo;
  memory: MemoryInfo;
  gpus: GpuInfo[];
  storage: StorageDisk[];
  network: NetInterface[];
  software: SoftwareInfo;
  capabilities: Capabilities;
}

export interface Overview {
  hostname: string | null;
  osName: string | null;
  kernel: string | null;
  architecture: string | null;
  uptimeSeconds: number;
  bootTimeUnix: number;
  vendor: string | null;
  product: string | null;
  productVersion: string | null;
  chassisType: string | null;
}

export interface CpuInfo {
  model: string | null;
  vendor: string | null;
  family: string | null;
  modelId: string | null;
  stepping: string | null;
  microcode: string | null;
  architecture: string | null;
  sockets: number;
  cores: number;
  threads: number;
  baseMhz: number | null;
  maxMhz: number | null;
  minMhz: number | null;
  currentMhz: number | null;
  governor: string | null;
  driver: string | null;
  energyPreference: string | null;
  virtualizations: string[];
  flags: string[];
  caches: CacheInfo[];
  topology: CoreTopology[];
  vulnerabilities: Vulnerability[];
}

export interface CacheInfo {
  level: number;
  kind: string;
  sizeBytes: number;
  ways: number | null;
  lineSize: number | null;
  sharedBy: string | null;
}

export interface CoreTopology {
  coreId: number;
  packageId: number;
  threads: number[];
  maxMhz: number | null;
  currentMhz: number | null;
}

export interface Vulnerability {
  name: string;
  status: string;
  level: string;
}

export interface BoardInfo {
  systemVendor: string | null;
  productName: string | null;
  productVersion: string | null;
  productFamily: string | null;
  productSku: string | null;
  boardVendor: string | null;
  boardName: string | null;
  boardVersion: string | null;
  boardSerial: string | null;
  biosVendor: string | null;
  biosVersion: string | null;
  biosDate: string | null;
  chassisVendor: string | null;
  chassisType: string | null;
  chassisVersion: string | null;
  serialLocked: boolean;
}

export interface MemoryInfo {
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
  freeBytes: number;
  cachedBytes: number;
  buffersBytes: number;
  sharedBytes: number;
  swapTotalBytes: number;
  swapFreeBytes: number;
}

export interface GpuInfo {
  pciAddress: string;
  vendor: string | null;
  device: string | null;
  vendorId: string | null;
  deviceId: string | null;
  subsystem: string | null;
  class: string | null;
  driver: string | null;
  modules: string[];
  vramBytes: number | null;
  vramShared: boolean;
  pcie: PcieLink | null;
  displays: DisplayOutput[];
  opengl: GraphicsApiInfo | null;
  vulkan: GraphicsApiInfo | null;
  drmCard: string | null;
}

export interface PcieLink {
  currentSpeed: string | null;
  currentWidth: string | null;
  maxSpeed: string | null;
  maxWidth: string | null;
}

export interface DisplayOutput {
  connector: string;
  status: string;
  currentMode: string | null;
  modes: string[];
  monitorName: string | null;
  sizeCm: string | null;
}

export interface GraphicsApiInfo {
  name: string;
  vendor: string | null;
  renderer: string | null;
  version: string | null;
  apiVersion: string | null;
  memoryBytes: number | null;
  unifiedMemory: boolean | null;
}

export interface StorageDisk {
  name: string;
  path: string;
  model: string | null;
  serial: string | null;
  firmware: string | null;
  sizeBytes: number;
  interface: string | null;
  rotational: boolean;
  removable: boolean;
  state: string | null;
  temperatureC: number | null;
  partitions: PartitionInfo[];
}

export interface PartitionInfo {
  name: string;
  sizeBytes: number;
  fstype: string | null;
  label: string | null;
  uuid: string | null;
  mountpoint: string | null;
  fsTotalBytes: number | null;
  fsUsedBytes: number | null;
  fsAvailableBytes: number | null;
  fsUsePercent: number | null;
}

export interface NetInterface {
  name: string;
  mac: string | null;
  state: string | null;
  speedMbps: number | null;
  duplex: string | null;
  mtu: number | null;
  driver: string | null;
  device: string | null;
  pciAddress: string | null;
  isWireless: boolean;
  isVirtual: boolean;
  addresses: NetAddress[];
}

export interface NetAddress {
  family: string;
  address: string;
  prefixLen: number;
  scope: string | null;
}

export interface SoftwareInfo {
  distroName: string | null;
  distroId: string | null;
  distroVersion: string | null;
  distroIdLike: string | null;
  kernel: string | null;
  kernelBuild: string | null;
  architecture: string | null;
  glibc: string | null;
  systemd: string | null;
  desktop: string | null;
  sessionType: string | null;
  shell: string | null;
  locale: string | null;
  timezone: string | null;
  packageManager: string | null;
  packageCount: number | null;
  flatpakCount: number | null;
  virtualization: string | null;
  secureBoot: boolean | null;
  bootMode: string | null;
  kernelCmdline: string | null;
  extra: KeyValue[];
}

export interface Capabilities {
  privilegedAvailable: boolean;
  smartAvailable: boolean;
  raplLocked: boolean;
}

export interface PrivilegedInfo {
  dmi: DmiInfo | null;
  smart: SmartInfo[];
  warnings: string[];
}

export interface DmiInfo {
  bios: DmiSection;
  system: DmiSection;
  board: DmiSection;
  chassis: DmiSection;
  memoryDevices: DimmInfo[];
  processors: DmiProcessor[];
}

export interface DmiSection {
  title: string;
  fields: KeyValue[];
}

export interface DimmInfo {
  locator: string | null;
  bankLocator: string | null;
  size: string | null;
  kind: string | null;
  speed: string | null;
  configuredSpeed: string | null;
  manufacturer: string | null;
  serial: string | null;
  partNumber: string | null;
  rank: string | null;
  voltage: string | null;
  formFactor: string | null;
  populated: boolean;
}

export interface DmiProcessor {
  socket: string | null;
  version: string | null;
  maxSpeed: string | null;
  currentSpeed: string | null;
  coreCount: string | null;
  threadCount: string | null;
  l2Cache: string | null;
  l3Cache: string | null;
}

export interface SmartInfo {
  device: string;
  serial: string | null;
  healthPassed: boolean | null;
  healthText: string | null;
  temperatureC: number | null;
  powerOnHours: number | null;
  powerCycles: number | null;
  percentageUsed: number | null;
  dataWrittenBytes: number | null;
  mediaErrors: number | null;
  reallocatedSectors: number | null;
  pendingSectors: number | null;
  uncorrectableSectors: number | null;
}

export interface LiveSnapshot {
  timestampMs: number;
  cpu: CpuLive;
  memory: MemoryLive;
  gpus: GpuLive[];
  temperatures: TempReading[];
  fans: FanReading[];
  battery: BatteryLive | null;
  processCount: number | null;
}

export interface CpuLive {
  perCore: CoreLive[];
  packageTempC: number | null;
  packagePowerW: number | null;
  powerLocked: boolean;
  loadAverage: number[];
  governor: string | null;
}

export interface CoreLive {
  id: number;
  usagePercent: number;
  freqMhz: number | null;
  tempC: number | null;
}

export interface MemoryLive {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  swapTotalBytes: number;
  swapUsedBytes: number;
}

export interface GpuLive {
  pciAddress: string;
  freqMhz: number | null;
  tempC: number | null;
  usagePercent: number | null;
}

export interface TempReading {
  source: string;
  label: string;
  valueC: number;
}

export interface FanReading {
  source: string;
  label: string;
  rpm: number;
}

export interface BatteryLive {
  name: string;
  capacityPercent: number | null;
  status: string | null;
  voltageV: number | null;
  powerW: number | null;
  energyNowWh: number | null;
}

export type TabId =
  | "overview"
  | "cpu"
  | "board"
  | "memory"
  | "gpu"
  | "storage"
  | "network"
  | "software"
  | "sensors";
