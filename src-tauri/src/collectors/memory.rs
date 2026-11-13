use std::collections::HashMap;

use crate::models::MemoryInfo;

pub fn collect() -> MemoryInfo {
    let values = read_meminfo();
    let get = |key: &str| values.get(key).copied().unwrap_or(0) * 1024;
    let total = get("MemTotal");
    let free = get("MemFree");
    let buffers = get("Buffers");
    let cached = get("Cached") + get("SReclaimable");
    let available = if values.contains_key("MemAvailable") {
        get("MemAvailable")
    } else {
        free + buffers + cached
    };
    let used = total.saturating_sub(available);

    MemoryInfo {
        total_bytes: total,
        available_bytes: available,
        used_bytes: used,
        free_bytes: free,
        cached_bytes: cached,
        buffers_bytes: buffers,
        shared_bytes: get("Shmem"),
        swap_total_bytes: get("SwapTotal"),
        swap_free_bytes: get("SwapFree"),
    }
}

fn read_meminfo() -> HashMap<String, u64> {
    let mut values = HashMap::new();
    let Ok(text) = std::fs::read_to_string("/proc/meminfo") else {
        return values;
    };
    for line in text.lines() {
        let Some((key, remainder)) = line.split_once(':') else {
            continue;
        };
        let Some(number) = remainder.split_whitespace().next() else {
            continue;
        };
        if let Ok(value) = number.parse::<u64>() {
            values.insert(key.to_string(), value);
        }
    }
    values
}
