import type {
  DimmInfo,
  LiveSnapshot,
  NetInterface,
  PrivilegedInfo,
  SystemInfo,
} from "./types";

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

const FLAGS = [
  "fpu", "vme", "de", "pse", "tsc", "msr", "pae", "mce", "cx8", "apic", "sep", "mtrr",
  "pge", "mca", "cmov", "pat", "pse36", "clflush", "dts", "acpi", "mmx", "fxsr", "sse",
  "sse2", "ss", "ht", "tm", "pbe", "syscall", "nx", "pdpe1gb", "rdtscp", "lm",
  "constant_tsc", "art", "arch_perfmon", "pebs", "bts", "rep_good", "nopl", "xtopology",
  "nonstop_tsc", "cpuid", "aperfmperf", "tsc_known_freq", "pni", "pclmulqdq", "dtes64",
  "monitor", "ds_cpl", "vmx", "smx", "est", "tm2", "ssse3", "sdbg", "fma", "cx16",
  "xtpr", "pdcm", "pcid", "sse4_1", "sse4_2", "x2apic", "movbe", "popcnt",
  "tsc_deadline_timer", "aes", "xsave", "avx", "f16c", "rdrand", "lahf_lm", "abm",
  "3dnowprefetch", "cpuid_fault", "epb", "ssbd", "ibrs", "ibpb", "stibp",
  "ibrs_enhanced", "tpr_shadow", "vnmi", "flexpriority", "ept", "vpid", "ept_ad",
  "fsgsbase", "tsc_adjust", "bmi1", "avx2", "smep", "bmi2", "erms", "invpcid",
  "rdseed", "adx", "smap", "clflushopt", "clwb", "intel_pt", "sha_ni", "xsaveopt",
  "xsavec", "xgetbv1", "xsaves", "split_lock_detect", "dtherm", "ida", "arat", "pln",
  "pts", "hwp", "hwp_notify", "hwp_act_window", "hwp_epp", "hwp_pkg_req", "hfi",
  "umip", "pku", "ospke", "waitpkg", "gfni", "vaes", "vpclmulqdq", "rdpid",
  "movdiri", "movdir64b", "fsrm", "md_clear", "serialize", "tsxldtrk", "pconfig",
  "arch_lbr", "ibt", "flush_l1d", "arch_capabilities",
];

const TOPOLOGY = [
  { coreId: 0, threads: [0, 1], maxMhz: 4900 },
  { coreId: 4, threads: [2, 3], maxMhz: 4900 },
  { coreId: 8, threads: [4, 5], maxMhz: 4900 },
  { coreId: 12, threads: [6, 7], maxMhz: 4900 },
  { coreId: 16, threads: [8, 9], maxMhz: 4900 },
  { coreId: 20, threads: [10, 11], maxMhz: 4900 },
  { coreId: 24, threads: [12], maxMhz: 3700 },
  { coreId: 25, threads: [13], maxMhz: 3700 },
  { coreId: 26, threads: [14], maxMhz: 3700 },
  { coreId: 27, threads: [15], maxMhz: 3700 },
];

function network(): NetInterface[] {
  return [
    {
      name: "lo",
      mac: "00:00:00:00:00:00",
      state: "unknown",
      speedMbps: null,
      duplex: null,
      mtu: 65536,
      driver: null,
      vendor: null,
      device: null,
      pciAddress: null,
      isWireless: false,
      isVirtual: true,
      addresses: [
        { family: "inet", address: "127.0.0.1", prefixLen: 8, scope: "host" },
        { family: "inet6", address: "::1", prefixLen: 128, scope: "host" },
      ],
    },
    {
      name: "wlp1s0",
      mac: "a4:bb:6d:2e:91:c0",
      state: "up",
      speedMbps: null,
      duplex: null,
      mtu: 1500,
      driver: "rtw89_8852be",
      vendor: "10ec",
      device: "RTL8852BE PCIe 802.11ax Wireless Network Controller",
      pciAddress: "0000:02:00.0",
      isWireless: true,
      isVirtual: false,
      addresses: [
        { family: "inet", address: "192.168.1.42", prefixLen: 24, scope: "global" },
        { family: "inet6", address: "fe80::a6bb:6dff:fe2e:91c0", prefixLen: 64, scope: "link" },
      ],
    },
    {
      name: "enp3s0",
      mac: "9c:6b:00:4a:12:de",
      state: "down",
      speedMbps: null,
      duplex: null,
      mtu: 1500,
      driver: "r8169",
      vendor: "10ec",
      device: "RTL8111/8168/8211/8411 PCI Express Gigabit Ethernet Controller",
      pciAddress: "0000:03:00.0",
      isWireless: false,
      isVirtual: false,
      addresses: [],
    },
    {
      name: "virbr0",
      mac: "52:54:00:6f:1d:22",
      state: "down",
      speedMbps: null,
      duplex: null,
      mtu: 1500,
      driver: null,
      vendor: null,
      device: null,
      pciAddress: null,
      isWireless: false,
      isVirtual: true,
      addresses: [{ family: "inet", address: "192.168.122.1", prefixLen: 24, scope: "global" }],
    },
  ];
}

export function demoSystemInfo(): SystemInfo {
  const now = Math.floor(Date.now() / 1000);
  const uptimeSeconds = 148_322;

  return {
    overview: {
      hostname: "nova",
      osName: "Fedora Linux 44 (Workstation Edition)",
      kernel: "7.2.15-200.fc44.x86_64",
      architecture: "x86_64",
      desktop: "GNOME",
      sessionType: "wayland",
      uptimeSeconds,
      bootTimeUnix: now - uptimeSeconds,
      vendor: "ASUSTeK COMPUTER INC.",
      product: "ASUS Vivobook Pro 16X K6604JV",
      productVersion: "1.0",
      chassisType: "Notebook",
      isLaptop: true,
    },
    cpu: {
      model: "Intel(R) Core(TM) i7-13620H",
      vendor: "GenuineIntel",
      family: "6",
      modelId: "186",
      stepping: "2",
      microcode: "0x4123",
      architecture: "x86_64",
      sockets: 1,
      cores: 10,
      threads: 16,
      baseMhz: 2400,
      maxMhz: 4900,
      minMhz: 400,
      currentMhz: 2986,
      governor: "powersave",
      driver: "intel_pstate",
      energyPreference: "balance_performance",
      virtualizations: ["Intel VT-x"],
      flags: FLAGS,
      caches: [
        {
          level: 1,
          kind: "Data",
          sizeBytes: 48 * 1024,
          ways: 12,
          lineSize: 64,
          sharedBy: "0-1",
        },
        {
          level: 1,
          kind: "Instruction",
          sizeBytes: 32 * 1024,
          ways: 8,
          lineSize: 64,
          sharedBy: "0-1",
        },
        {
          level: 2,
          kind: "Unified",
          sizeBytes: 1280 * 1024,
          ways: 20,
          lineSize: 64,
          sharedBy: "0-1",
        },
        {
          level: 3,
          kind: "Unified",
          sizeBytes: 24 * 1024 * 1024,
          ways: 12,
          lineSize: 64,
          sharedBy: "0-15",
        },
      ],
      topology: TOPOLOGY.map((core, index) => ({
        coreId: core.coreId,
        packageId: 0,
        threads: core.threads,
        maxMhz: core.maxMhz,
        currentMhz: core.maxMhz > 4000
          ? 2800 + ((index * 197) % 1700)
          : 1900 + ((index * 131) % 1200),
      })),
      vulnerabilities: [
        { name: "spectre_v1", status: "Mitigation: usercopy/swapgs barriers and __user pointer sanitization", level: "mitigated" },
        { name: "spectre_v2", status: "Mitigation: Enhanced / Automatic IBRS; IBPB: conditional; STIBP: always-on", level: "mitigated" },
        { name: "spec_rstack_overflow", status: "Not affected", level: "safe" },
        { name: "spec_store_bypass", status: "Mitigation: Speculative Store Bypass disabled via prctl", level: "mitigated" },
        { name: "gather_data_sampling", status: "Not affected", level: "safe" },
        { name: "meltdown", status: "Not affected", level: "safe" },
        { name: "mmio_stale_data", status: "Mitigation: Clear CPU buffers; SMT vulnerable", level: "mitigated" },
        { name: "retbleed", status: "Mitigation: Enhanced IBRS", level: "mitigated" },
        { name: "reg_file_data_sampling", status: "Not affected", level: "safe" },
        { name: "tsx_async_abort", status: "Not affected", level: "safe" },
      ],
    },
    board: {
      systemVendor: "ASUSTeK COMPUTER INC.",
      productName: "ASUS Vivobook Pro 16X K6604JV",
      productVersion: "1.0",
      productFamily: "Vivobook",
      productSku: "K6604JV-716512G0W",
      boardVendor: "ASUSTeK COMPUTER INC.",
      boardName: "K6604JV",
      boardVersion: "1.0",
      boardSerial: null,
      biosVendor: "American Megatrends International, LLC.",
      biosVersion: "K6604JV.310",
      biosDate: "08/14/2025",
      chassisVendor: "ASUSTeK COMPUTER INC.",
      chassisType: "Notebook",
      chassisVersion: "1.0",
      serialLocked: true,
    },
    memory: {
      totalBytes: 16 * GIB,
      availableBytes: 8.4 * GIB,
      usedBytes: 16 * GIB - 8.4 * GIB,
      freeBytes: 2.2 * GIB,
      cachedBytes: 6.1 * GIB,
      buffersBytes: 0.3 * GIB,
      sharedBytes: 1.1 * GIB,
      swapTotalBytes: 8 * GIB,
      swapFreeBytes: 8 * GIB,
    },
    gpus: [
      {
        pciAddress: "0000:00:02.0",
        vendor: "Intel",
        device: "Raptor Lake-P [UHD Graphics]",
        vendorId: "8086",
        deviceId: "a7a8",
        subsystem: "ASUSTeK Computer Inc. Device 13f4",
        class: "VGA compatible controller",
        driver: "i915",
        modules: ["i915", "xe"],
        vramBytes: 8 * GIB * 0.923,
        vramShared: true,
        pcie: {
          currentSpeed: null,
          currentWidth: null,
          maxSpeed: null,
          maxWidth: null,
        },
        displays: [
          {
            connector: "eDP-1",
            status: "connected",
            enabled: true,
            currentMode: "1920x1200",
            modes: ["1920x1200", "1920x1080", "1680x1050", "1600x1200", "1280x800"],
            monitorName: "BOE 0x0BCA",
            sizeCm: "34 × 22 cm",
          },
          {
            connector: "DP-1",
            status: "disconnected",
            enabled: false,
            currentMode: null,
            modes: [],
            monitorName: null,
            sizeCm: null,
          },
          {
            connector: "HDMI-A-1",
            status: "disconnected",
            enabled: false,
            currentMode: null,
            modes: [],
            monitorName: null,
            sizeCm: null,
          },
        ],
        opengl: {
          name: "OpenGL",
          vendor: "Intel",
          renderer: "Mesa Intel(R) UHD Graphics (RPL-P)",
          version: "Mesa 25.2.4",
          apiVersion: "4.6 (Core Profile) Mesa 25.2.4",
          memoryBytes: 7570 * MIB,
          unifiedMemory: true,
        },
        vulkan: null,
        drmCard: "card1",
      },
    ],
    storage: [
      {
        name: "nvme0n1",
        path: "/dev/nvme0n1",
        model: "WD PC SN740 SDDPNQD-512G",
        vendor: "Western Digital",
        serial: null,
        firmware: "73113000",
        sizeBytes: 512_110_190_592,
        interface: "NVMe",
        rotational: false,
        removable: false,
        state: "live",
        temperatureC: 43.9,
        partitions: [
          {
            name: "nvme0n1p1",
            path: "/dev/nvme0n1p1",
            sizeBytes: 629_145_600,
            kind: "part",
            fstype: "vfat",
            label: "EFI",
            uuid: "3A21-8F07",
            mountpoint: "/boot/efi",
            fsTotalBytes: 600 * MIB,
            fsUsedBytes: 42 * MIB,
            fsAvailableBytes: 558 * MIB,
            fsUsePercent: 7,
          },
          {
            name: "nvme0n1p2",
            path: "/dev/nvme0n1p2",
            sizeBytes: 1_073_741_824,
            kind: "part",
            fstype: "ext4",
            label: null,
            uuid: "b2f6ab44-1a19-4c0d-a63c-62f3df896b13",
            mountpoint: "/boot",
            fsTotalBytes: 973 * MIB,
            fsUsedBytes: 284 * MIB,
            fsAvailableBytes: 689 * MIB,
            fsUsePercent: 29.2,
          },
          {
            name: "nvme0n1p3",
            path: "/dev/nvme0n1p3",
            sizeBytes: 508_792_832_000,
            kind: "part",
            fstype: "btrfs",
            label: "fedora",
            uuid: "6f0a3d2e-87b4-4a82-9d0a-2f23b1e2c814",
            mountpoint: "/",
            fsTotalBytes: 473.5 * GIB,
            fsUsedBytes: 212.8 * GIB,
            fsAvailableBytes: 260.7 * GIB,
            fsUsePercent: 44.9,
          },
        ],
      },
    ],
    network: network(),
    software: {
      distroName: "Fedora Linux 44 (Workstation Edition)",
      distroId: "fedora",
      distroVersion: "44",
      distroIdLike: "rhel centos fedora",
      kernel: "7.2.15-200.fc44.x86_64",
      kernelBuild: "#1 SMP PREEMPT_DYNAMIC Thu Nov 5 14:12:07 UTC 2026",
      architecture: "x86_64",
      glibc: "glibc 2.42",
      systemd: "systemd 258 (258.7-1.fc44)",
      desktop: "GNOME",
      sessionType: "wayland",
      shell: "bash",
      locale: "en_US.UTF-8",
      timezone: "America/Sao_Paulo",
      packageManager: "RPM / dnf",
      packageCount: 2841,
      flatpakCount: 17,
      virtualization: null,
      secureBoot: true,
      bootMode: "UEFI",
      kernelCmdline: "BOOT_IMAGE=(hd0,gpt2)/vmlinuz-7.2.15-200.fc44.x86_64 root=UUID=6f0a3d2e-87b4-4a82-9d0a-2f23b1e2c814 ro rootflags=subvol=root rhgb quiet",
      extra: [
        { key: "VARIANT", value: "Workstation Edition" },
        { key: "VARIANT_ID", value: "workstation" },
        { key: "BUILD_ID", value: "20261101.n.0" },
        { key: "HOME_URL", value: "https://fedoraproject.org/" },
      ],
    },
    capabilities: {
      privilegedAvailable: true,
      smartAvailable: true,
      raplLocked: true,
      lmSensorsAvailable: false,
      nvidiaSmiAvailable: false,
      rocmSmiAvailable: false,
      vulkaninfoAvailable: false,
      glxinfoAvailable: true,
    },
  };
}

function dimm(
  locator: string,
  size: string,
  manufacturer: string,
  partNumber: string,
  serial: string,
): DimmInfo {
  return {
    locator,
    bankLocator: "BANK 0",
    size,
    kind: "DDR5",
    speed: "4800 MT/s",
    configuredSpeed: "4800 MT/s",
    manufacturer,
    serial,
    partNumber,
    rank: "1",
    voltage: "1.1 V",
    formFactor: "SODIMM",
    populated: true,
  };
}

export function demoPrivilegedInfo(): PrivilegedInfo {
  return {
    dmi: {
      bios: {
        title: "BIOS Information",
        fields: [
          { key: "Vendor", value: "American Megatrends International, LLC." },
          { key: "Version", value: "K6604JV.310" },
          { key: "Release Date", value: "08/14/2025" },
          { key: "ROM Size", value: "16 MB" },
          { key: "BIOS Revision", value: "5.32" },
          { key: "Firmware Revision", value: "0.0" },
        ],
      },
      system: {
        title: "System Information",
        fields: [
          { key: "Manufacturer", value: "ASUSTeK COMPUTER INC." },
          { key: "Product Name", value: "ASUS Vivobook Pro 16X K6604JV" },
          { key: "Version", value: "1.0" },
          { key: "Serial Number", value: "N8N0CV02X123456" },
          { key: "UUID", value: "4f7db2a1-21c8-4b07-9a42-c0a8d9a6e7f1" },
          { key: "Wake-up Type", value: "Power Switch" },
          { key: "SKU Number", value: "K6604JV-716512G0W" },
          { key: "Family", value: "Vivobook" },
        ],
      },
      board: {
        title: "Base Board Information",
        fields: [
          { key: "Manufacturer", value: "ASUSTeK COMPUTER INC." },
          { key: "Product Name", value: "K6604JV" },
          { key: "Version", value: "1.0" },
          { key: "Serial Number", value: "B8N0CV12D4567" },
          { key: "Asset Tag", value: "ATN1230045" },
          { key: "Features", value: "Board is a hosting board" },
          { key: "Location In Chassis", value: "Default string" },
          { key: "Type", value: "Motherboard" },
        ],
      },
      chassis: {
        title: "Chassis Information",
        fields: [
          { key: "Manufacturer", value: "ASUSTeK COMPUTER INC." },
          { key: "Type", value: "Notebook" },
          { key: "Version", value: "1.0" },
          { key: "Serial Number", value: "C8N0CV34E5678" },
          { key: "Asset Tag", value: "ATN1230045" },
          { key: "SKU Number", value: "K6604JV" },
        ],
      },
      memoryDevices: [
        dimm("DIMM Slot 1", "8 GB", "Samsung", "M425R1GB4BB0-CWMOL", "S1D4N2K8A771"),
        dimm("DIMM Slot 2", "8 GB", "SK hynix", "HMCG66MEBSA095N", "H2K7D9N1B443"),
      ],
      processors: [
        {
          socket: "FCBGA1744",
          version: "Intel(R) Core(TM) i7-13620H",
          maxSpeed: "4900 MHz",
          currentSpeed: "2600 MHz",
          coreCount: "10",
          threadCount: "16",
          l1Cache: "Not Provided",
          l2Cache: "2048 KB",
          l3Cache: "24576 KB",
        },
      ],
    },
    smart: [
      {
        device: "/dev/nvme0n1",
        model: "WD PC SN740 SDDPNQD-512G",
        serial: "2451A8B7C9D2",
        firmware: "73113000",
        healthPassed: true,
        healthText: "PASSED",
        temperatureC: 43.9,
        powerOnHours: 5312,
        powerCycles: 1873,
        percentageUsed: 3,
        dataWrittenBytes: 38.4 * 1000 ** 4,
        mediaErrors: 0,
        reallocatedSectors: null,
        pendingSectors: null,
        uncorrectableSectors: null,
      },
    ],
    warnings: [],
  };
}

function wave(tick: number, base: number, amplitude: number, phase: number): number {
  return (
    base +
    amplitude * Math.sin(tick / 6.2 + phase) +
    amplitude * 0.35 * Math.sin(tick / 2.15 + phase * 2.4)
  );
}

export function demoLiveTick(timestampMs: number, tick: number): LiveSnapshot {
  const perCore = Array.from({ length: 16 }, (_, id) => {
    const base = id < 12 ? 18 : 11;
    const phase = id * 0.63;
    const spike = id === 2 && tick % 23 < 7 ? 34 : 0;
    const usage = Math.min(96, Math.max(1, wave(tick, base, 14, phase) + spike));
    return {
      id,
      usagePercent: usage,
      freqMhz: wave(tick, id < 12 ? 3200 : 2200, 650, phase + 1.4),
      tempC: null,
    };
  });

  const averageLoad = perCore.reduce((sum, core) => sum + core.usagePercent, 0) / perCore.length;
  const packageTemp = wave(tick, 57, 6.5, 0.4) + averageLoad * 0.12;
  const memoryUsed = 7.1 * GIB + wave(tick, 0, 0.32 * GIB, 0.7);
  const gpuFreq = Math.max(300, wave(tick, 850, 420, 1.9));
  const fanRpm = 1900 + averageLoad * 8 + Math.sin(tick / 8) * 60;

  return {
    timestampMs,
    cpu: {
      perCore,
      packageTempC: packageTemp,
      packagePowerW: null,
      powerLocked: true,
      loadAverage: [0.62 + Math.sin(tick / 20) * 0.2, 0.78, 0.91],
      governor: "powersave",
    },
    memory: {
      totalBytes: 16 * GIB,
      usedBytes: memoryUsed,
      availableBytes: 16 * GIB - memoryUsed,
      swapTotalBytes: 8 * GIB,
      swapUsedBytes: 42 * MIB,
    },
    gpus: [
      {
        pciAddress: "0000:00:02.0",
        name: "Intel Graphics",
        freqMhz: gpuFreq,
        tempC: null,
        usagePercent: null,
        vramUsedBytes: null,
        vramTotalBytes: null,
      },
    ],
    temperatures: [
      { source: "coretemp", label: "Package id 0", valueC: packageTemp },
      { source: "coretemp", label: "Core 0", valueC: packageTemp - 4.2 },
      { source: "coretemp", label: "Core 4", valueC: packageTemp - 2.7 },
      { source: "coretemp", label: "Core 8", valueC: packageTemp - 1.4 },
      { source: "coretemp", label: "Core 12", valueC: packageTemp - 3.1 },
      { source: "coretemp", label: "Core 16", valueC: packageTemp - 2.2 },
      { source: "coretemp", label: "Core 20", valueC: packageTemp - 3.8 },
      { source: "coretemp", label: "Core 24", valueC: packageTemp - 5.3 },
      { source: "coretemp", label: "Core 25", valueC: packageTemp - 4.9 },
      { source: "coretemp", label: "Core 26", valueC: packageTemp - 5.6 },
      { source: "coretemp", label: "Core 27", valueC: packageTemp - 5.1 },
      { source: "nvme", label: "Composite", valueC: 43.9 + Math.sin(tick / 14) * 0.7 },
      { source: "acpitz", label: "temp1", valueC: 42.5 + Math.sin(tick / 17) * 0.4 },
    ],
    fans: [{ source: "asus", label: "Fan 1", rpm: fanRpm }],
    battery: {
      name: "BAT1",
      capacityPercent: 86,
      status: "Discharging",
      voltageV: 15.31,
      powerW: null,
      energyNowWh: null,
      energyFullWh: null,
    },
    processCount: 418 + (tick % 5),
  };
}

export function demoLiveHistory(): LiveSnapshot[] {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, index) =>
    demoLiveTick(now - (59 - index) * 1000, index),
  );
}
