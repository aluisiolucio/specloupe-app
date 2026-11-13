use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::{DisplayOutput, GpuInfo, GraphicsApiInfo, PcieLink};
use crate::util::{
    command_exists, parse_size_bytes, read_link_path, read_trim, run_command, sorted_dir_names,
};

#[derive(Debug, Default, Clone)]
struct PciDevice {
    address: String,
    class: String,
    description: String,
    vendor_id: Option<String>,
    device_id: Option<String>,
    subsystem: Option<String>,
    driver: Option<String>,
    modules: Vec<String>,
}

pub fn collect() -> Vec<GpuInfo> {
    let devices = pci_devices();
    let gpu_devices = devices
        .into_iter()
        .filter(|device| {
            let class = device.class.to_ascii_lowercase();
            class.contains("vga")
                || class.contains("3d controller")
                || class.contains("display controller")
        })
        .collect::<Vec<_>>();

    let opengl = collect_opengl();
    let vulkan = collect_vulkan();
    let mut result = Vec::new();

    for device in &gpu_devices {
        let base = format!("/sys/bus/pci/devices/{}", device.address);
        let (vendor_name, device_name) =
            split_pci_names(&device.description, device.vendor_id.as_deref());

        let pcie = PcieLink {
            current_speed: read_trim(format!("{base}/current_link_speed")),
            current_width: read_trim(format!("{base}/current_link_width")),
            max_speed: read_trim(format!("{base}/max_link_speed")),
            max_width: read_trim(format!("{base}/max_link_width")),
        };
        // Integrated GPUs report placeholder links (Unknown / width 0 / width 255).
        let pcie = pcie
            .current_speed
            .as_deref()
            .is_some_and(|speed| !speed.eq_ignore_ascii_case("unknown"))
            .then_some(pcie)
            .filter(|link| {
                link.current_width
                    .as_deref()
                    .and_then(|width| width.parse::<u32>().ok())
                    .is_some_and(|width| (1..=64).contains(&width))
            });

        let mut gpu = GpuInfo {
            pci_address: device.address.clone(),
            vendor: vendor_name,
            device: device_name,
            vendor_id: device.vendor_id.clone(),
            device_id: device.device_id.clone(),
            subsystem: device.subsystem.as_deref().map(clean_device_name),
            class: Some(device.class.clone()),
            driver: device.driver.clone(),
            modules: device.modules.clone(),
            vram_bytes: None,
            vram_shared: false,
            pcie,
            displays: Vec::new(),
            opengl: None,
            vulkan: None,
            drm_card: None,
        };

        if let Some(card) = find_drm_card(&device.address) {
            let card_path = format!("/sys/class/drm/{card}");
            gpu.drm_card = Some(card);
            gpu.displays = collect_displays(&card_path);
            gpu.vram_bytes = read_trim(format!("{card_path}/device/mem_info_vram_total"))
                .and_then(|value| value.parse::<u64>().ok())
                .or_else(|| {
                    read_trim(format!("{card_path}/device/hwmon/hwmon0/memory_total"))
                        .and_then(|value| value.parse::<u64>().ok())
                });
        }

        let vendor_lower = gpu.vendor.as_deref().unwrap_or_default().to_ascii_lowercase();
        let renderer_lower = opengl
            .as_ref()
            .and_then(|api| api.renderer.as_deref())
            .unwrap_or_default()
            .to_ascii_lowercase();
        let is_intel = vendor_lower.contains("intel") || renderer_lower.contains("intel");
        let is_amd = vendor_lower.contains("amd")
            || vendor_lower.contains("ati")
            || renderer_lower.contains("amd")
            || renderer_lower.contains("radeon");
        let is_nvidia = vendor_lower.contains("nvidia") || renderer_lower.contains("nvidia");

        if is_intel {
            gpu.vram_shared = true;
            if gpu.vram_bytes.is_none() {
                gpu.vram_bytes = opengl.as_ref().and_then(|api| api.memory_bytes);
            }
        }
        if is_amd && gpu.vram_bytes.is_none() {
            if let Some(card) = gpu.drm_card.as_ref() {
                gpu.vram_bytes = read_trim(format!(
                    "/sys/class/drm/{card}/device/mem_info_vram_total"
                ))
                .and_then(|value| value.parse::<u64>().ok());
            }
        }
        if is_nvidia && gpu.vram_bytes.is_none() {
            gpu.vram_bytes = nvidia_memory_bytes();
        }

        let api_vendor = if is_intel {
            "Intel"
        } else if is_amd {
            "AMD"
        } else if is_nvidia {
            "NVIDIA"
        } else {
            ""
        };
        if gpu.opengl.is_none() && !api_vendor.is_empty() {
            gpu.opengl = opengl.clone();
        }
        if gpu.vulkan.is_none() && !api_vendor.is_empty() {
            gpu.vulkan = vulkan.clone();
        }

        result.push(gpu);
    }

    result
}

fn pci_devices() -> Vec<PciDevice> {
    let Some(output) = run_command("lspci", &["-Dnnk"]) else {
        return Vec::new();
    };
    let mut devices: Vec<PciDevice> = Vec::new();
    for line in output.lines() {
        if line.starts_with(char::is_whitespace) {
            let trimmed = line.trim();
            if let Some(device) = devices.last_mut() {
                if let Some(value) = trimmed.strip_prefix("Subsystem:") {
                    device.subsystem = Some(value.trim().to_string());
                } else if let Some(value) = trimmed.strip_prefix("Kernel driver in use:") {
                    device.driver = Some(value.trim().to_string());
                } else if let Some(value) = trimmed.strip_prefix("Kernel modules:") {
                    device.modules = value
                        .split(',')
                        .map(|module| module.trim().to_string())
                        .filter(|module| !module.is_empty())
                        .collect();
                }
            }
            continue;
        }
        if line.trim().is_empty() {
            continue;
        }
        let Some((address, rest)) = line.split_once(' ') else {
            continue;
        };
        if !address.contains(':') {
            continue;
        }
        let Some((class, description)) = rest.split_once(": ") else {
            continue;
        };
        let class = class
            .split(" [")
            .next()
            .unwrap_or(class)
            .trim()
            .to_string();
        let ids = extract_pci_ids(description);
        let (vendor_id, device_id) = ids
            .map(|(vendor, device)| (Some(vendor), Some(device)))
            .unwrap_or((None, None));
        devices.push(PciDevice {
            address: address.to_string(),
            class,
            description: description.to_string(),
            vendor_id,
            device_id,
            subsystem: None,
            driver: None,
            modules: Vec::new(),
        });
    }
    devices
}

fn extract_pci_ids(description: &str) -> Option<(String, String)> {
    let start = description.rfind('[')?;
    let end = description[start..].find(']')? + start;
    let ids = &description[start + 1..end];
    let (vendor, device) = ids.split_once(':')?;
    if vendor.len() == 4 && device.len() == 4 {
        Some((vendor.to_ascii_lowercase(), device.to_ascii_lowercase()))
    } else {
        None
    }
}

fn split_pci_names(description: &str, vendor_id: Option<&str>) -> (Option<String>, Option<String>) {
    let known_vendor = vendor_id.and_then(|id| match id {
        "8086" => Some("Intel"),
        "1002" => Some("AMD"),
        "10de" => Some("NVIDIA"),
        "1af4" => Some("Red Hat"),
        "1b36" => Some("QEMU"),
        "15ad" => Some("VMware"),
        "80ee" => Some("VirtualBox"),
        "1234" => Some("Bochs"),
        _ => None,
    });
    if let Some(vendor) = known_vendor {
        let device = match vendor {
            "Intel" => description.strip_prefix("Intel Corporation "),
            "NVIDIA" => description.strip_prefix("NVIDIA Corporation "),
            "AMD" => description
                .strip_prefix("Advanced Micro Devices, Inc. [AMD/ATI] ")
                .or_else(|| description.strip_prefix("Advanced Micro Devices, Inc. [AMD] ")),
            _ => None,
        };
        return (
            Some(vendor.to_string()),
            Some(clean_device_name(device.unwrap_or(description))),
        );
    }
    (None, Some(clean_device_name(description)))
}

fn clean_device_name(description: &str) -> String {
    let mut name = description.trim();
    if let Some(start) = name.rfind(" (rev ") {
        if name[start..].ends_with(')') {
            name = name[..start].trim();
        }
    }
    if let Some(start) = name.rfind(" [") {
        if name[start..].ends_with(']') {
            name = name[..start].trim();
        }
    }
    name.to_string()
}

fn find_drm_card(pci_address: &str) -> Option<String> {
    for name in sorted_dir_names("/sys/class/drm") {
        if !name.starts_with("card") || name.contains('-') {
            continue;
        }
        let device_path = format!("/sys/class/drm/{name}/device");
        if let Some(target) = read_link_path(&device_path) {
            if target.ends_with(pci_address) || target.contains(pci_address) {
                return Some(name);
            }
        }
    }
    None
}

fn collect_displays(card_path: &str) -> Vec<DisplayOutput> {
    let card_name = Path::new(card_path)
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_default();
    let mut displays = Vec::new();
    let parent = format!("/sys/class/drm");
    for name in sorted_dir_names(&parent) {
        if !name.starts_with(&format!("{card_name}-")) {
            continue;
        }
        let base = format!("{parent}/{name}");
        let Some(status) = read_trim(format!("{base}/status")) else {
            continue;
        };
        let enabled = read_trim(format!("{base}/enabled"))
            .map(|value| value.eq_ignore_ascii_case("enabled"))
            .unwrap_or(false);
        let current_mode = read_trim(format!("{base}/mode"))
            .or_else(|| read_trim(format!("{base}/modes")).and_then(|modes| {
                modes.lines().next().map(str::trim).map(str::to_string)
            }));
        let modes = read_trim(format!("{base}/modes"))
            .map(|modes| {
                modes
                    .lines()
                    .map(str::trim)
                    .filter(|line| !line.is_empty())
                    .map(str::to_string)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let (monitor_name, size_cm) = read_edid(&format!("{base}/edid"));
        displays.push(DisplayOutput {
            connector: name
                .strip_prefix(&format!("{card_name}-"))
                .unwrap_or(&name)
                .to_string(),
            status,
            enabled,
            current_mode,
            modes,
            monitor_name,
            size_cm,
        });
    }
    displays
}

fn read_edid(path: &str) -> (Option<String>, Option<String>) {
    let Ok(bytes) = fs::read(path) else {
        return (None, None);
    };
    if bytes.len() < 128 || &bytes[0..8] != b"\x00\xff\xff\xff\xff\xff\xff\x00" {
        return (None, None);
    }
    let mut name = None;
    for offset in [54usize, 72, 90, 108] {
        if bytes.len() < offset + 18 {
            continue;
        }
        let block = &bytes[offset..offset + 18];
        if block[0] != 0 || block[1] != 0 || block[2] != 0 {
            continue;
        }
        if block[3] == 0xfc {
            let raw = &block[5..18];
            let text = String::from_utf8_lossy(raw)
                .trim_matches(|ch: char| ch == '\n' || ch == '\r' || ch == '\0' || ch == ' ')
                .to_string();
            if !text.is_empty() {
                name = Some(text);
            }
        }
    }
    let size = if bytes[21] > 0 && bytes[22] > 0 {
        Some(format!("{} × {} cm", bytes[21], bytes[22]))
    } else {
        None
    };
    (name, size)
}

fn collect_opengl() -> Option<GraphicsApiInfo> {
    if std::env::var_os("DISPLAY").is_none() && std::env::var_os("WAYLAND_DISPLAY").is_none() {
        return None;
    }
    if !command_exists("glxinfo") {
        return None;
    }
    let output = run_command("glxinfo", &["-B"])?;
    let mut values: HashMap<String, String> = HashMap::new();
    for line in output.lines() {
        if let Some((key, value)) = line.split_once(':') {
            values.insert(key.trim().to_string(), value.trim().to_string());
        }
    }
    let vendor = values
        .get("OpenGL vendor string")
        .or_else(|| values.get("Vendor"))
        .cloned();
    let renderer = values
        .get("OpenGL renderer string")
        .or_else(|| values.get("Device"))
        .cloned();
    let api_version = values
        .get("OpenGL version string")
        .or_else(|| values.get("Max core profile version"))
        .cloned();
    let version = values.get("Version").cloned();
    let memory_bytes = values
        .get("Video memory")
        .and_then(|value| parse_size_bytes(value));
    let unified_memory = values
        .get("Unified memory")
        .map(|value| value.eq_ignore_ascii_case("yes"));
    Some(GraphicsApiInfo {
        name: "OpenGL".to_string(),
        vendor,
        renderer,
        version,
        api_version,
        memory_bytes,
        unified_memory,
    })
}

fn collect_vulkan() -> Option<GraphicsApiInfo> {
    if !command_exists("vulkaninfo") {
        return None;
    }
    let output = run_command("vulkaninfo", &["--summary"])?;
    let mut device_name = None;
    let mut driver_name = None;
    let mut api_version = None;
    for line in output.lines() {
        let line = line.trim();
        if let Some(value) = line.strip_prefix("deviceName") {
            device_name = Some(value.trim_start_matches([' ', '=', ':']).to_string());
        } else if let Some(value) = line.strip_prefix("driverName") {
            driver_name = Some(value.trim_start_matches([' ', '=', ':']).to_string());
        } else if let Some(value) = line.strip_prefix("apiVersion") {
            api_version = Some(value.trim_start_matches([' ', '=', ':']).to_string());
        }
    }
    Some(GraphicsApiInfo {
        name: "Vulkan".to_string(),
        vendor: None,
        renderer: device_name,
        version: driver_name,
        api_version,
        memory_bytes: None,
        unified_memory: None,
    })
}

fn nvidia_memory_bytes() -> Option<u64> {
    if !command_exists("nvidia-smi") {
        return None;
    }
    let output = run_command(
        "nvidia-smi",
        &[
            "--query-gpu=memory.total",
            "--format=csv,noheader,nounits",
        ],
    )?;
    let megabytes = output.lines().next()?.trim().parse::<u64>().ok()?;
    Some(megabytes * 1024 * 1024)
}

pub fn drm_card_paths() -> Vec<(String, String)> {
    let mut values = Vec::new();
    for name in sorted_dir_names("/sys/class/drm") {
        if !name.starts_with("card") || name.contains('-') {
            continue;
        }
        let device = format!("/sys/class/drm/{name}/device");
        if let Some(target) = read_link_path(&device) {
            let address = PathBuf::from(target)
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_default();
            values.push((address, name));
        }
    }
    values
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_pci_ids_and_revisions_from_names() {
        let (vendor, device) = split_pci_names(
            "Intel Corporation Raptor Lake-P [UHD Graphics] [8086:a7a8] (rev 04)",
            Some("8086"),
        );
        assert_eq!(vendor.as_deref(), Some("Intel"));
        assert_eq!(device.as_deref(), Some("Raptor Lake-P [UHD Graphics]"));

        let (vendor, device) = split_pci_names(
            "Advanced Micro Devices, Inc. [AMD/ATI] Navi 23 [Radeon RX 6600/6600 XT/6600M] [1002:73ff] (rev c7)",
            Some("1002"),
        );
        assert_eq!(vendor.as_deref(), Some("AMD"));
        assert_eq!(
            device.as_deref(),
            Some("Navi 23 [Radeon RX 6600/6600 XT/6600M]")
        );
    }
}
