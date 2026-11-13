use std::collections::{BTreeMap, HashSet};

use crate::models::{CacheInfo, CoreTopology, CpuInfo, Vulnerability};
use crate::util::{read_f64, read_trim, read_u64, sorted_dir_names};

pub fn collect() -> CpuInfo {
    let cpuinfo = read_cpuinfo();
    let model = cpuinfo
        .get("model name")
        .or_else(|| cpuinfo.get("Model"))
        .or_else(|| cpuinfo.get("Hardware"))
        .cloned();
    let vendor = cpuinfo
        .get("vendor_id")
        .or_else(|| cpuinfo.get("CPU implementer"))
        .cloned();

    let topology = collect_topology();
    let threads = topology.iter().map(|core| core.threads.len() as u32).sum();
    let sockets = topology
        .iter()
        .map(|core| core.package_id)
        .collect::<HashSet<_>>()
        .len() as u32;

    let current_mhz = {
        let values = topology
            .iter()
            .filter_map(|core| core.current_mhz)
            .collect::<Vec<_>>();
        if values.is_empty() {
            None
        } else {
            Some(values.iter().sum::<f64>() / values.len() as f64)
        }
    };

    let base_mhz = read_f64("/sys/devices/system/cpu/cpu0/cpufreq/base_frequency")
        .map(|value| value / 1000.0);
    let max_mhz = read_f64("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq")
        .map(|value| value / 1000.0);
    let min_mhz = read_f64("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_min_freq")
        .map(|value| value / 1000.0);

    let flags = cpuinfo
        .get("flags")
        .or_else(|| cpuinfo.get("Features"))
        .map(|value| {
            let mut values = value
                .split_whitespace()
                .map(str::to_string)
                .collect::<Vec<_>>();
            values.sort();
            values.dedup();
            values
        })
        .unwrap_or_default();

    let mut virtualizations = Vec::new();
    if flags.iter().any(|flag| flag == "vmx") {
        virtualizations.push("Intel VT-x".to_string());
    }
    if flags.iter().any(|flag| flag == "svm") {
        virtualizations.push("AMD-V".to_string());
    }

    CpuInfo {
        model,
        vendor,
        family: cpuinfo.get("cpu family").cloned(),
        model_id: cpuinfo.get("model").cloned(),
        stepping: cpuinfo.get("stepping").cloned(),
        microcode: read_trim("/sys/devices/system/cpu/cpu0/microcode/version")
            .or_else(|| cpuinfo.get("microcode").cloned()),
        architecture: Some(std::env::consts::ARCH.to_string()),
        sockets,
        cores: topology.len() as u32,
        threads,
        base_mhz,
        max_mhz,
        min_mhz,
        current_mhz,
        governor: read_trim("/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"),
        driver: read_trim("/sys/devices/system/cpu/cpu0/cpufreq/scaling_driver"),
        energy_preference: read_trim(
            "/sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference",
        ),
        virtualizations,
        flags,
        caches: collect_caches(),
        topology,
        vulnerabilities: collect_vulnerabilities(),
    }
}

fn read_cpuinfo() -> BTreeMap<String, String> {
    let mut values = BTreeMap::new();
    let Ok(text) = std::fs::read_to_string("/proc/cpuinfo") else {
        return values;
    };
    for line in text.lines() {
        if line.trim().is_empty() {
            break;
        }
        if let Some((key, value)) = line.split_once(':') {
            values
                .entry(key.trim().to_string())
                .or_insert_with(|| value.trim().to_string());
        }
    }
    values
}

fn collect_topology() -> Vec<CoreTopology> {
    #[derive(Default)]
    struct Group {
        core_id: u32,
        package_id: u32,
        threads: Vec<u32>,
        max_khz: Option<u64>,
        current_khz_sum: u64,
        current_khz_count: u64,
    }

    let mut groups: BTreeMap<(u32, u32), Group> = BTreeMap::new();

    for name in sorted_dir_names("/sys/devices/system/cpu") {
        let Some(id_text) = name.strip_prefix("cpu") else {
            continue;
        };
        let Ok(id) = id_text.parse::<u32>() else {
            continue;
        };
        let base = format!("/sys/devices/system/cpu/{name}");
        if read_trim(format!("{base}/online")).as_deref() == Some("0") {
            continue;
        }
        let Some(core_id) = read_u64(format!("{base}/topology/core_id")).map(|v| v as u32) else {
            continue;
        };
        let Some(package_id) =
            read_u64(format!("{base}/topology/physical_package_id")).map(|v| v as u32)
        else {
            continue;
        };
        let group = groups
            .entry((package_id, core_id))
            .or_insert_with(|| Group {
                core_id,
                package_id,
                ..Default::default()
            });
        group.threads.push(id);
        if let Some(max_khz) = read_u64(format!("{base}/cpufreq/cpuinfo_max_freq")) {
            group.max_khz = Some(group.max_khz.map_or(max_khz, |current| current.max(max_khz)));
        }
        if let Some(current_khz) = read_u64(format!("{base}/cpufreq/scaling_cur_freq")) {
            group.current_khz_sum += current_khz;
            group.current_khz_count += 1;
        }
    }

    groups
        .into_values()
        .map(|mut group| {
            group.threads.sort_unstable();
            CoreTopology {
                core_id: group.core_id,
                package_id: group.package_id,
                threads: group.threads,
                max_mhz: group.max_khz.map(|value| value as f64 / 1000.0),
                current_mhz: if group.current_khz_count > 0 {
                    Some(group.current_khz_sum as f64 / group.current_khz_count as f64 / 1000.0)
                } else {
                    None
                },
            }
        })
        .collect()
}

fn collect_caches() -> Vec<CacheInfo> {
    let mut caches = Vec::new();
    for name in sorted_dir_names("/sys/devices/system/cpu/cpu0/cache") {
        if !name.starts_with("index") {
            continue;
        }
        let base = format!("/sys/devices/system/cpu/cpu0/cache/{name}");
        let Some(level) = read_u64(format!("{base}/level")).map(|value| value as u32) else {
            continue;
        };
        let Some(kind) = read_trim(format!("{base}/type")) else {
            continue;
        };
        let Some(size) = read_trim(format!("{base}/size"))
            .and_then(|value| crate::util::parse_size_bytes(&value))
        else {
            continue;
        };
        caches.push(CacheInfo {
            level,
            kind,
            size_bytes: size,
            ways: read_u64(format!("{base}/ways_of_associativity")).map(|value| value as u32),
            line_size: read_u64(format!("{base}/coherency_line_size")).map(|value| value as u32),
            shared_by: read_trim(format!("{base}/shared_cpu_list")),
        });
    }
    caches.sort_by(|left, right| {
        left.level
            .cmp(&right.level)
            .then_with(|| left.kind.cmp(&right.kind))
    });
    caches.dedup_by(|left, right| {
        left.level == right.level && left.kind == right.kind && left.size_bytes == right.size_bytes
    });
    caches
}

fn collect_vulnerabilities() -> Vec<Vulnerability> {
    let mut values = Vec::new();
    for name in sorted_dir_names("/sys/devices/system/cpu/vulnerabilities") {
        let Some(status) = read_trim(format!("/sys/devices/system/cpu/vulnerabilities/{name}"))
        else {
            continue;
        };
        let lower = status.to_ascii_lowercase();
        let level = if lower.contains("not affected") {
            "safe"
        } else if lower.starts_with("vulnerable") {
            "vulnerable"
        } else if lower.contains("mitigation") {
            "mitigated"
        } else {
            "unknown"
        };
        values.push(Vulnerability {
            name,
            status,
            level: level.to_string(),
        });
    }
    values
}
