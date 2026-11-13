use serde::Serialize;

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyValue {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub overview: Overview,
    pub cpu: CpuInfo,
    pub board: BoardInfo,
    pub memory: MemoryInfo,
    pub gpus: Vec<GpuInfo>,
    pub storage: Vec<StorageDisk>,
    pub network: Vec<NetInterface>,
    pub software: SoftwareInfo,
    pub capabilities: Capabilities,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Overview {
    pub hostname: Option<String>,
    pub os_name: Option<String>,
    pub kernel: Option<String>,
    pub architecture: Option<String>,
    pub desktop: Option<String>,
    pub session_type: Option<String>,
    pub uptime_seconds: u64,
    pub boot_time_unix: u64,
    pub vendor: Option<String>,
    pub product: Option<String>,
    pub product_version: Option<String>,
    pub chassis_type: Option<String>,
    pub is_laptop: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CpuInfo {
    pub model: Option<String>,
    pub vendor: Option<String>,
    pub family: Option<String>,
    pub model_id: Option<String>,
    pub stepping: Option<String>,
    pub microcode: Option<String>,
    pub architecture: Option<String>,
    pub sockets: u32,
    pub cores: u32,
    pub threads: u32,
    pub base_mhz: Option<f64>,
    pub max_mhz: Option<f64>,
    pub min_mhz: Option<f64>,
    pub current_mhz: Option<f64>,
    pub governor: Option<String>,
    pub driver: Option<String>,
    pub energy_preference: Option<String>,
    pub virtualizations: Vec<String>,
    pub flags: Vec<String>,
    pub caches: Vec<CacheInfo>,
    pub topology: Vec<CoreTopology>,
    pub vulnerabilities: Vec<Vulnerability>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CacheInfo {
    pub level: u32,
    pub kind: String,
    pub size_bytes: u64,
    pub ways: Option<u32>,
    pub line_size: Option<u32>,
    pub shared_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CoreTopology {
    pub core_id: u32,
    pub package_id: u32,
    pub threads: Vec<u32>,
    pub max_mhz: Option<f64>,
    pub current_mhz: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Vulnerability {
    pub name: String,
    pub status: String,
    pub level: String,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BoardInfo {
    pub system_vendor: Option<String>,
    pub product_name: Option<String>,
    pub product_version: Option<String>,
    pub product_family: Option<String>,
    pub product_sku: Option<String>,
    pub board_vendor: Option<String>,
    pub board_name: Option<String>,
    pub board_version: Option<String>,
    pub board_serial: Option<String>,
    pub bios_vendor: Option<String>,
    pub bios_version: Option<String>,
    pub bios_date: Option<String>,
    pub chassis_vendor: Option<String>,
    pub chassis_type: Option<String>,
    pub chassis_version: Option<String>,
    pub serial_locked: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MemoryInfo {
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub cached_bytes: u64,
    pub buffers_bytes: u64,
    pub shared_bytes: u64,
    pub swap_total_bytes: u64,
    pub swap_free_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GpuInfo {
    pub pci_address: String,
    pub vendor: Option<String>,
    pub device: Option<String>,
    pub vendor_id: Option<String>,
    pub device_id: Option<String>,
    pub subsystem: Option<String>,
    pub class: Option<String>,
    pub driver: Option<String>,
    pub modules: Vec<String>,
    pub vram_bytes: Option<u64>,
    pub vram_shared: bool,
    pub pcie: Option<PcieLink>,
    pub displays: Vec<DisplayOutput>,
    pub opengl: Option<GraphicsApiInfo>,
    pub vulkan: Option<GraphicsApiInfo>,
    pub drm_card: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PcieLink {
    pub current_speed: Option<String>,
    pub current_width: Option<String>,
    pub max_speed: Option<String>,
    pub max_width: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DisplayOutput {
    pub connector: String,
    pub status: String,
    pub enabled: bool,
    pub current_mode: Option<String>,
    pub modes: Vec<String>,
    pub monitor_name: Option<String>,
    pub size_cm: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GraphicsApiInfo {
    pub name: String,
    pub vendor: Option<String>,
    pub renderer: Option<String>,
    pub version: Option<String>,
    pub api_version: Option<String>,
    pub memory_bytes: Option<u64>,
    pub unified_memory: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StorageDisk {
    pub name: String,
    pub path: String,
    pub model: Option<String>,
    pub vendor: Option<String>,
    pub serial: Option<String>,
    pub firmware: Option<String>,
    pub size_bytes: u64,
    pub interface: Option<String>,
    pub rotational: bool,
    pub removable: bool,
    pub state: Option<String>,
    pub temperature_c: Option<f64>,
    pub partitions: Vec<PartitionInfo>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PartitionInfo {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub kind: String,
    pub fstype: Option<String>,
    pub label: Option<String>,
    pub uuid: Option<String>,
    pub mountpoint: Option<String>,
    pub fs_total_bytes: Option<u64>,
    pub fs_used_bytes: Option<u64>,
    pub fs_available_bytes: Option<u64>,
    pub fs_use_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NetInterface {
    pub name: String,
    pub mac: Option<String>,
    pub state: Option<String>,
    pub speed_mbps: Option<u64>,
    pub duplex: Option<String>,
    pub mtu: Option<u32>,
    pub driver: Option<String>,
    pub vendor: Option<String>,
    pub device: Option<String>,
    pub pci_address: Option<String>,
    pub is_wireless: bool,
    pub is_virtual: bool,
    pub addresses: Vec<NetAddress>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NetAddress {
    pub family: String,
    pub address: String,
    pub prefix_len: u8,
    pub scope: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SoftwareInfo {
    pub distro_name: Option<String>,
    pub distro_id: Option<String>,
    pub distro_version: Option<String>,
    pub distro_id_like: Option<String>,
    pub kernel: Option<String>,
    pub kernel_build: Option<String>,
    pub architecture: Option<String>,
    pub glibc: Option<String>,
    pub systemd: Option<String>,
    pub desktop: Option<String>,
    pub session_type: Option<String>,
    pub shell: Option<String>,
    pub locale: Option<String>,
    pub timezone: Option<String>,
    pub package_manager: Option<String>,
    pub package_count: Option<u64>,
    pub flatpak_count: Option<u64>,
    pub virtualization: Option<String>,
    pub secure_boot: Option<bool>,
    pub boot_mode: Option<String>,
    pub kernel_cmdline: Option<String>,
    pub extra: Vec<KeyValue>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Capabilities {
    pub privileged_available: bool,
    pub smart_available: bool,
    pub rapl_locked: bool,
    pub lm_sensors_available: bool,
    pub nvidia_smi_available: bool,
    pub rocm_smi_available: bool,
    pub vulkaninfo_available: bool,
    pub glxinfo_available: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PrivilegedInfo {
    pub dmi: Option<DmiInfo>,
    pub smart: Vec<SmartInfo>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DmiInfo {
    pub bios: DmiSection,
    pub system: DmiSection,
    pub board: DmiSection,
    pub chassis: DmiSection,
    pub memory_devices: Vec<DimmInfo>,
    pub processors: Vec<DmiProcessor>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DmiSection {
    pub title: String,
    pub fields: Vec<KeyValue>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DimmInfo {
    pub locator: Option<String>,
    pub bank_locator: Option<String>,
    pub size: Option<String>,
    pub kind: Option<String>,
    pub speed: Option<String>,
    pub configured_speed: Option<String>,
    pub manufacturer: Option<String>,
    pub serial: Option<String>,
    pub part_number: Option<String>,
    pub rank: Option<String>,
    pub voltage: Option<String>,
    pub form_factor: Option<String>,
    pub populated: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DmiProcessor {
    pub socket: Option<String>,
    pub version: Option<String>,
    pub max_speed: Option<String>,
    pub current_speed: Option<String>,
    pub core_count: Option<String>,
    pub thread_count: Option<String>,
    pub l1_cache: Option<String>,
    pub l2_cache: Option<String>,
    pub l3_cache: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SmartInfo {
    pub device: String,
    pub model: Option<String>,
    pub serial: Option<String>,
    pub firmware: Option<String>,
    pub health_passed: Option<bool>,
    pub health_text: Option<String>,
    pub temperature_c: Option<f64>,
    pub power_on_hours: Option<u64>,
    pub power_cycles: Option<u64>,
    pub percentage_used: Option<f64>,
    pub data_written_bytes: Option<u64>,
    pub media_errors: Option<u64>,
    pub reallocated_sectors: Option<u64>,
    pub pending_sectors: Option<u64>,
    pub uncorrectable_sectors: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LiveSnapshot {
    pub timestamp_ms: u64,
    pub cpu: CpuLive,
    pub memory: MemoryLive,
    pub gpus: Vec<GpuLive>,
    pub temperatures: Vec<TempReading>,
    pub fans: Vec<FanReading>,
    pub battery: Option<BatteryLive>,
    pub process_count: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CpuLive {
    pub per_core: Vec<CoreLive>,
    pub package_temp_c: Option<f64>,
    pub package_power_w: Option<f64>,
    pub power_locked: bool,
    pub load_average: Vec<f64>,
    pub governor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CoreLive {
    pub id: u32,
    pub usage_percent: f64,
    pub freq_mhz: Option<f64>,
    pub temp_c: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MemoryLive {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub swap_total_bytes: u64,
    pub swap_used_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GpuLive {
    pub pci_address: String,
    pub name: String,
    pub freq_mhz: Option<f64>,
    pub temp_c: Option<f64>,
    pub usage_percent: Option<f64>,
    pub vram_used_bytes: Option<u64>,
    pub vram_total_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TempReading {
    pub source: String,
    pub label: String,
    pub value_c: f64,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FanReading {
    pub source: String,
    pub label: String,
    pub rpm: u64,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BatteryLive {
    pub name: String,
    pub capacity_percent: Option<f64>,
    pub status: Option<String>,
    pub voltage_v: Option<f64>,
    pub power_w: Option<f64>,
    pub energy_now_wh: Option<f64>,
    pub energy_full_wh: Option<f64>,
}
