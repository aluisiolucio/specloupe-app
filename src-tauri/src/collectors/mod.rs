pub mod board;
pub mod cpu;
pub mod gpu;
pub mod memory;
pub mod network;
pub mod sensors;
pub mod software;
pub mod storage;

use std::path::Path;

use crate::models::{Capabilities, Overview, SystemInfo};
use crate::util::{
    command_exists, is_root, now_unix, read_clean, read_trim, read_u64, uptime_seconds,
};

pub fn collect_system_info() -> SystemInfo {
    let board = board::collect();
    let capabilities = collect_capabilities();
    let overview = Overview {
        hostname: read_clean("/proc/sys/kernel/hostname"),
        os_name: os_name(),
        kernel: read_trim("/proc/sys/kernel/osrelease"),
        architecture: Some(std::env::consts::ARCH.to_string()),
        desktop: env_value(&["XDG_CURRENT_DESKTOP", "XDG_SESSION_DESKTOP", "DESKTOP_SESSION"]),
        session_type: env_value(&["XDG_SESSION_TYPE"]),
        uptime_seconds: uptime_seconds(),
        boot_time_unix: now_unix().saturating_sub(uptime_seconds()),
        vendor: board.system_vendor.clone(),
        product: board.product_name.clone(),
        product_version: board.product_version.clone(),
        chassis_type: board.chassis_type.clone(),
        is_laptop: board::is_laptop(&board),
    };

    SystemInfo {
        overview,
        cpu: cpu::collect(),
        board,
        memory: memory::collect(),
        gpus: gpu::collect(),
        storage: storage::collect(),
        network: network::collect(),
        software: software::collect(),
        capabilities,
    }
}

pub fn collect_capabilities() -> Capabilities {
    let rapl_path = "/sys/class/powercap/intel-rapl:0/energy_uj";
    Capabilities {
        privileged_available: is_root() || command_exists("pkexec"),
        smart_available: command_exists("smartctl"),
        rapl_locked: Path::new(rapl_path).exists() && read_u64(rapl_path).is_none(),
        lm_sensors_available: command_exists("sensors"),
        nvidia_smi_available: command_exists("nvidia-smi"),
        rocm_smi_available: command_exists("rocm-smi"),
        vulkaninfo_available: command_exists("vulkaninfo"),
        glxinfo_available: command_exists("glxinfo"),
    }
}

fn os_name() -> Option<String> {
    let text = std::fs::read_to_string("/etc/os-release").ok()?;
    for line in text.lines() {
        if let Some(value) = line.strip_prefix("PRETTY_NAME=") {
            let value = value.trim().trim_matches('"');
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

fn env_value(keys: &[&str]) -> Option<String> {
    keys.iter()
        .filter_map(|key| std::env::var(key).ok())
        .find(|value| !value.trim().is_empty())
        .map(|value| value.trim().replace(':', " / "))
}
