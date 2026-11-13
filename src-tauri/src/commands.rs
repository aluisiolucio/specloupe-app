use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use tauri::State;

use crate::collectors;
use crate::models::{PrivilegedInfo, SystemInfo};
use crate::privileged;

#[derive(Default)]
pub struct AppState {
    pub paused: AtomicBool,
    pub privileged: Mutex<Option<PrivilegedInfo>>,
}

#[tauri::command]
pub async fn collect_system_info() -> Result<SystemInfo, String> {
    tauri::async_runtime::spawn_blocking(collectors::collect_system_info)
        .await
        .map_err(|error| format!("Collector task failed: {error}"))
}

#[tauri::command]
pub async fn load_privileged_info(
    state: State<'_, AppState>,
    refresh: bool,
) -> Result<PrivilegedInfo, String> {
    if !refresh {
        if let Ok(cache) = state.privileged.lock() {
            if let Some(info) = cache.as_ref() {
                return Ok(info.clone());
            }
        }
    }

    let info = tauri::async_runtime::spawn_blocking(privileged::load)
        .await
        .map_err(|error| format!("Privileged task failed: {error}"))??;

    if let Ok(mut cache) = state.privileged.lock() {
        *cache = Some(info.clone());
    }

    Ok(info)
}

#[tauri::command]
pub fn write_report(path: String, content: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("No report path was provided.".to_string());
    }
    if let Some(parent) = std::path::Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent)
                .map_err(|error| format!("Could not create the report folder: {error}"))?;
        }
    }
    std::fs::write(&path, content)
        .map_err(|error| format!("Could not write the report: {error}"))
}

#[tauri::command]
pub fn set_live_paused(state: State<'_, AppState>, paused: bool) {
    state.paused.store(paused, Ordering::Relaxed);
}
