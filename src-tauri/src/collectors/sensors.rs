use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::Instant;

use crate::collectors::gpu;
use crate::models::{
    BatteryLive, CoreLive, CpuLive, FanReading, GpuLive, LiveSnapshot, MemoryLive, TempReading,
};
use crate::util::{
    command_exists, now_millis, read_i64, read_trim, read_u64, run_command, sorted_dir_names,
};

#[derive(Default)]
pub struct LiveSampler {
    previous_cpu: Option<Vec<CpuTimes>>,
    previous_rapl: Option<(u64, Instant, u64)>,
}

#[derive(Clone, Copy, Default)]
struct CpuTimes {
    id: u32,
    total: u64,
    idle: u64,
}

pub fn new_sampler() -> LiveSampler {
    LiveSampler::default()
}

impl LiveSampler {
    pub fn sample(&mut self) -> LiveSnapshot {
        let cpu_times = read_cpu_times();
        let frequencies = read_core_frequencies();
        let temperatures = read_temperatures();
        let package_temp = temperatures
            .iter()
            .find(|reading| {
                reading.source == "coretemp" && reading.label.eq_ignore_ascii_case("Package id 0")
            })
            .map(|reading| reading.value_c)
            .or_else(|| {
                temperatures
                    .iter()
                    .filter(|reading| {
                        reading.source == "coretemp" || reading.source == "k10temp"
                    })
                    .map(|reading| reading.value_c)
                    .reduce(f64::max)
            });

        let mut per_core = Vec::new();
        for current in &cpu_times {
            let usage = self
                .previous_cpu
                .as_ref()
                .and_then(|previous| previous.iter().find(|item| item.id == current.id))
                .map(|previous| {
                    let total = current.total.saturating_sub(previous.total);
                    let idle = current.idle.saturating_sub(previous.idle);
                    if total == 0 {
                        0.0
                    } else {
                        ((total.saturating_sub(idle)) as f64 / total as f64 * 100.0)
                            .clamp(0.0, 100.0)
                    }
                })
                .unwrap_or(0.0);
            per_core.push(CoreLive {
                id: current.id,
                usage_percent: usage,
                freq_mhz: frequencies.get(&current.id).copied(),
                temp_c: None,
            });
        }
        self.previous_cpu = Some(cpu_times);

        let (package_power_w, power_locked) = self.read_rapl_power();
        let memory = read_memory();
        let battery = read_battery();
        let fans = read_fans();
        let gpus = read_gpus();
        let load_average = read_load_average();
        let governor = read_trim("/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor");

        LiveSnapshot {
            timestamp_ms: now_millis(),
            cpu: CpuLive {
                per_core,
                package_temp_c: package_temp,
                package_power_w,
                power_locked,
                load_average,
                governor,
            },
            memory,
            gpus,
            temperatures,
            fans,
            battery,
            process_count: count_processes(),
        }
    }

    fn read_rapl_power(&mut self) -> (Option<f64>, bool) {
        let energy_path = "/sys/class/powercap/intel-rapl:0/energy_uj";
        let Ok(text) = fs::read_to_string(energy_path) else {
            return (None, Path::new(energy_path).exists());
        };
        let Ok(energy) = text.trim().parse::<u64>() else {
            return (None, false);
        };
        let now = Instant::now();
        let max_range = read_u64("/sys/class/powercap/intel-rapl:0/max_energy_range_uj")
            .unwrap_or(u64::MAX);
        let watts = if let Some((previous, previous_time, previous_max)) = self.previous_rapl {
            let elapsed = now.duration_since(previous_time).as_secs_f64();
            if elapsed < 0.2 {
                None
            } else {
                let delta = if energy >= previous {
                    energy - previous
                } else {
                    previous_max.saturating_sub(previous) + energy
                };
                Some(delta as f64 / 1_000_000.0 / elapsed)
            }
        } else {
            None
        };
        self.previous_rapl = Some((energy, now, max_range));
        (watts, false)
    }
}

fn read_cpu_times() -> Vec<CpuTimes> {
    let Ok(text) = fs::read_to_string("/proc/stat") else {
        return Vec::new();
    };
    let mut values = Vec::new();
    for line in text.lines() {
        let Some(rest) = line.strip_prefix("cpu") else {
            continue;
        };
        let mut parts = rest.split_whitespace();
        let Some(id_text) = parts.next() else {
            continue;
        };
        let Ok(id) = id_text.parse::<u32>() else {
            continue;
        };
        let numbers = parts
            .filter_map(|value| value.parse::<u64>().ok())
            .collect::<Vec<_>>();
        if numbers.len() < 4 {
            continue;
        }
        let idle = numbers.get(3).copied().unwrap_or(0) + numbers.get(4).copied().unwrap_or(0);
        let total = numbers.iter().sum();
        values.push(CpuTimes { id, total, idle });
    }
    values
}

fn read_core_frequencies() -> HashMap<u32, f64> {
    let mut values = HashMap::new();
    for name in sorted_dir_names("/sys/devices/system/cpu") {
        let Some(id_text) = name.strip_prefix("cpu") else {
            continue;
        };
        let Ok(id) = id_text.parse::<u32>() else {
            continue;
        };
        if let Some(khz) = read_u64(format!(
            "/sys/devices/system/cpu/{name}/cpufreq/scaling_cur_freq"
        )) {
            values.insert(id, khz as f64 / 1000.0);
        }
    }
    values
}

fn read_temperatures() -> Vec<TempReading> {
    let mut readings = Vec::new();
    for hwmon in sorted_dir_names("/sys/class/hwmon") {
        let base = format!("/sys/class/hwmon/{hwmon}");
        let source = read_trim(format!("{base}/name")).unwrap_or_else(|| hwmon.clone());
        for entry in sorted_dir_names(&base) {
            let Some(index) = entry
                .strip_prefix("temp")
                .and_then(|value| value.strip_suffix("_input"))
            else {
                continue;
            };
            let Some(raw) = read_i64(format!("{base}/{entry}")) else {
                continue;
            };
            if !(1_000..150_000).contains(&raw) {
                continue;
            }
            let label = read_trim(format!("{base}/temp{index}_label"))
                .unwrap_or_else(|| format!("Temp {index}"));
            readings.push(TempReading {
                source: source.clone(),
                label,
                value_c: raw as f64 / 1000.0,
            });
        }
    }
    readings.sort_by(|left, right| {
        left.source
            .cmp(&right.source)
            .then_with(|| left.label.cmp(&right.label))
    });
    readings
}

fn read_fans() -> Vec<FanReading> {
    let mut readings = Vec::new();
    for hwmon in sorted_dir_names("/sys/class/hwmon") {
        let base = format!("/sys/class/hwmon/{hwmon}");
        let source = read_trim(format!("{base}/name")).unwrap_or_else(|| hwmon.clone());
        for entry in sorted_dir_names(&base) {
            let Some(index) = entry
                .strip_prefix("fan")
                .and_then(|value| value.strip_suffix("_input"))
            else {
                continue;
            };
            let Some(rpm) = read_u64(format!("{base}/{entry}")) else {
                continue;
            };
            if rpm == 0 {
                continue;
            }
            let label = read_trim(format!("{base}/fan{index}_label"))
                .unwrap_or_else(|| format!("Fan {index}"));
            readings.push(FanReading {
                source: source.clone(),
                label,
                rpm,
            });
        }
    }
    readings
}

fn read_memory() -> MemoryLive {
    let values = read_meminfo();
    let get = |key: &str| values.get(key).copied().unwrap_or(0) * 1024;
    let total = get("MemTotal");
    let available = if values.contains_key("MemAvailable") {
        get("MemAvailable")
    } else {
        get("MemFree") + get("Buffers") + get("Cached")
    };
    let swap_total = get("SwapTotal");
    let swap_free = get("SwapFree");
    MemoryLive {
        total_bytes: total,
        used_bytes: total.saturating_sub(available),
        available_bytes: available,
        swap_total_bytes: swap_total,
        swap_used_bytes: swap_total.saturating_sub(swap_free),
    }
}

fn read_meminfo() -> HashMap<String, u64> {
    let mut values = HashMap::new();
    let Ok(text) = fs::read_to_string("/proc/meminfo") else {
        return values;
    };
    for line in text.lines() {
        let Some((key, rest)) = line.split_once(':') else {
            continue;
        };
        let Some(value) = rest.split_whitespace().next() else {
            continue;
        };
        if let Ok(value) = value.parse::<u64>() {
            values.insert(key.to_string(), value);
        }
    }
    values
}

fn read_load_average() -> Vec<f64> {
    read_trim("/proc/loadavg")
        .map(|value| {
            value
                .split_whitespace()
                .take(3)
                .filter_map(|part| part.parse::<f64>().ok())
                .collect()
        })
        .unwrap_or_default()
}

fn count_processes() -> Option<u64> {
    fs::read_dir("/proc").ok().map(|entries| {
        entries
            .flatten()
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .chars()
                    .all(|ch| ch.is_ascii_digit())
            })
            .count() as u64
    })
}

fn read_battery() -> Option<BatteryLive> {
    for name in sorted_dir_names("/sys/class/power_supply") {
        if !name.starts_with("BAT") {
            continue;
        }
        let base = format!("/sys/class/power_supply/{name}");
        let capacity = read_f64_opt(format!("{base}/capacity"));
        if capacity.is_none() {
            continue;
        }
        return Some(BatteryLive {
            name,
            capacity_percent: capacity,
            status: read_trim(format!("{base}/status")),
            voltage_v: read_f64_opt(format!("{base}/voltage_now")).map(|value| value / 1_000_000.0),
            power_w: read_f64_opt(format!("{base}/power_now")).map(|value| value / 1_000_000.0),
            energy_now_wh: read_f64_opt(format!("{base}/energy_now")).map(|value| value / 1_000_000.0),
        });
    }
    None
}

fn read_f64_opt(path: impl AsRef<Path>) -> Option<f64> {
    read_trim(path)?.parse::<f64>().ok()
}

fn read_gpus() -> Vec<GpuLive> {
    let mut values = Vec::new();
    for (pci_address, card) in gpu::drm_card_paths() {
        let base = format!("/sys/class/drm/{card}");
        let freq_mhz = read_u64(format!("{base}/gt_cur_freq_mhz")).map(|value| value as f64);
        let freq_mhz = freq_mhz.or_else(|| read_amdgpu_frequency(&base));
        let usage = read_u64(format!("{base}/device/gpu_busy_percent")).map(|value| value as f64);
        let temp = read_gpu_temperature(&base);
        values.push(GpuLive {
            pci_address,
            freq_mhz,
            temp_c: temp,
            usage_percent: usage,
        });
    }

    if command_exists("nvidia-smi") {
        if let Some(output) = run_command(
            "nvidia-smi",
            &[
                "--query-gpu=pci.bus_id,clocks.current.graphics,temperature.gpu,utilization.gpu",
                "--format=csv,noheader,nounits",
            ],
        ) {
            for line in output.lines() {
                let parts = line.split(',').map(str::trim).collect::<Vec<_>>();
                if parts.len() < 4 {
                    continue;
                }
                let bus = parts[0].split(':').skip(1).collect::<Vec<_>>().join(":");
                let pci_address = format!("0000:{bus}");
                values.push(GpuLive {
                    pci_address,
                    freq_mhz: parts[1].parse::<f64>().ok(),
                    temp_c: parts[2].parse::<f64>().ok(),
                    usage_percent: parts[3].parse::<f64>().ok(),
                });
            }
        }
    }
    values
}

fn read_gpu_temperature(card_base: &str) -> Option<f64> {
    let mut best: Option<(u8, f64)> = None;

    // Temperature sensors registered directly below this DRM card.
    let hwmon_dir = format!("{card_base}/device/hwmon");
    for hwmon in sorted_dir_names(&hwmon_dir) {
        if let Some((priority, value)) = hwmon_gpu_temp(&format!("{hwmon_dir}/{hwmon}")) {
            if best
                .map(|(current, _)| priority < current)
                .unwrap_or(true)
            {
                best = Some((priority, value));
            }
        }
    }
    if best.is_some() {
        return best.map(|(_, value)| value);
    }

    // Fallback: a GPU hwmon instance whose parent is this card's PCI device.
    let card_device = fs::canonicalize(format!("{card_base}/device")).ok()?;
    for hwmon in sorted_dir_names("/sys/class/hwmon") {
        let base = format!("/sys/class/hwmon/{hwmon}");
        let source = read_trim(format!("{base}/name")).unwrap_or_default();
        if !matches!(source.as_str(), "amdgpu" | "nouveau" | "i915" | "xe") {
            continue;
        }
        let Ok(device) = fs::canonicalize(format!("{base}/device")) else {
            continue;
        };
        if device != card_device {
            continue;
        }
        if let Some((priority, value)) = hwmon_gpu_temp(&base) {
            if best
                .map(|(current, _)| priority < current)
                .unwrap_or(true)
            {
                best = Some((priority, value));
            }
        }
    }

    best.map(|(_, value)| value)
}

fn hwmon_gpu_temp(base: &str) -> Option<(u8, f64)> {
    let mut best: Option<(u8, f64)> = None;
    for entry in sorted_dir_names(base) {
        let Some(index) = entry
            .strip_prefix("temp")
            .and_then(|value| value.strip_suffix("_input"))
        else {
            continue;
        };
        let Some(raw) = read_i64(format!("{base}/{entry}")) else {
            continue;
        };
        if !(1_000..150_000).contains(&raw) {
            continue;
        }
        let label = read_trim(format!("{base}/temp{index}_label")).unwrap_or_default();
        let priority = match label.to_ascii_lowercase().as_str() {
            "edge" | "composite" | "junction" | "gpu" => 0,
            _ => 1,
        };
        let value = raw as f64 / 1000.0;
        if best
            .map(|(current, _)| priority < current)
            .unwrap_or(true)
        {
            best = Some((priority, value));
        }
    }
    best
}

fn read_amdgpu_frequency(base: &str) -> Option<f64> {
    let text = fs::read_to_string(format!("{base}/device/pp_dpm_sclk")).ok()?;
    let line = text.lines().find(|line| line.contains('*'))?;
    let value = line.split_whitespace().find(|part| part.ends_with("Mhz"))?;
    value.trim_end_matches("Mhz").parse::<f64>().ok()
}
