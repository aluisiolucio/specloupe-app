use std::ffi::CString;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn read_trim(path: impl AsRef<Path>) -> Option<String> {
    fs::read_to_string(path)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

pub fn read_clean(path: impl AsRef<Path>) -> Option<String> {
    read_trim(path).and_then(|value| {
        let lower = value.to_ascii_lowercase();
        if lower == "unknown"
            || lower == "none"
            || lower == "not specified"
            || lower == "not available"
            || lower == "to be filled by o.e.m."
            || lower == "default string"
        {
            None
        } else {
            Some(value)
        }
    })
}

pub fn read_u64(path: impl AsRef<Path>) -> Option<u64> {
    read_trim(path)?.parse::<u64>().ok()
}

pub fn read_i64(path: impl AsRef<Path>) -> Option<i64> {
    read_trim(path)?.parse::<i64>().ok()
}

pub fn read_f64(path: impl AsRef<Path>) -> Option<f64> {
    read_trim(path)?.parse::<f64>().ok()
}

pub fn read_link_path(path: impl AsRef<Path>) -> Option<String> {
    fs::read_link(path)
        .ok()
        .map(|target| target.to_string_lossy().into_owned())
}

pub fn command_exists(name: &str) -> bool {
    std::env::var_os("PATH")
        .map(|paths| {
            std::env::split_paths(&paths).any(|path| {
                let candidate = path.join(name);
                candidate.is_file()
            })
        })
        .unwrap_or(false)
}

pub fn run_command(command: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(command).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

pub fn first_line(text: &str) -> Option<String> {
    text.lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(str::to_string)
}

pub fn parse_size_bytes(value: &str) -> Option<u64> {
    let value = value.trim();
    if value.is_empty() {
        return None;
    }
    let split_at = value
        .find(|ch: char| !ch.is_ascii_digit() && ch != '.')
        .unwrap_or(value.len());
    let (number, suffix) = value.split_at(split_at);
    let number = number.parse::<f64>().ok()?;
    let multiplier = match suffix.trim().to_ascii_uppercase().as_str() {
        "" | "B" => 1.0,
        "K" | "KB" | "KIB" => 1024.0,
        "M" | "MB" | "MIB" => 1024.0 * 1024.0,
        "G" | "GB" | "GIB" => 1024.0 * 1024.0 * 1024.0,
        "T" | "TB" | "TIB" => 1024.0 * 1024.0 * 1024.0 * 1024.0,
        _ => return None,
    };
    Some((number * multiplier).round() as u64)
}

pub fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

pub fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

pub fn uptime_seconds() -> u64 {
    read_trim("/proc/uptime")
        .and_then(|value| value.split_whitespace().next()?.parse::<f64>().ok())
        .map(|value| value as u64)
        .unwrap_or(0)
}

pub fn is_root() -> bool {
    unsafe { libc::geteuid() == 0 }
}

#[derive(Debug, Clone, Default)]
pub struct FsUsage {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub use_percent: f64,
}

pub fn filesystem_usage(path: &str) -> Option<FsUsage> {
    let path = CString::new(path).ok()?;
    let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
    let result = unsafe { libc::statvfs(path.as_ptr(), &mut stat) };
    if result != 0 {
        return None;
    }
    let fragment = if stat.f_frsize > 0 {
        stat.f_frsize as u64
    } else {
        stat.f_bsize as u64
    };
    let total = stat.f_blocks as u64 * fragment;
    let free = stat.f_bfree as u64 * fragment;
    let available = stat.f_bavail as u64 * fragment;
    let used = total.saturating_sub(free);
    let denominator = used + available;
    let use_percent = if denominator > 0 {
        used as f64 / denominator as f64 * 100.0
    } else {
        0.0
    };
    Some(FsUsage {
        total_bytes: total,
        used_bytes: used,
        available_bytes: available,
        use_percent,
    })
}

pub fn sorted_dir_names(path: impl AsRef<Path>) -> Vec<String> {
    let mut names = fs::read_dir(path)
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect::<Vec<_>>();
    names.sort();
    names
}
