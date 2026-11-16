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
    if content.len() > 16 * 1024 * 1024 {
        return Err("The report is too large to write.".to_string());
    }
    let report_path = std::path::Path::new(&path);
    let extension = report_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());
    match extension.as_deref() {
        Some("md") | Some("json") => {}
        _ => return Err("Reports must be saved as .md or .json files.".to_string()),
    }
    std::fs::write(report_path, content)
        .map_err(|error| format!("Could not write the report: {error}"))
}

#[cfg(test)]
mod tests {
    use super::write_report;
    use std::path::PathBuf;

    fn temp_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("specloupe-report-{}-{name}", std::process::id()))
    }

    #[test]
    fn rejects_unknown_extensions() {
        let path = temp_path("note.txt");
        let result = write_report(path.to_string_lossy().into_owned(), "hello".into());
        assert!(result.is_err());
        assert!(!path.exists());
    }

    #[test]
    fn rejects_missing_extensions() {
        let path = temp_path("report");
        let result = write_report(path.to_string_lossy().into_owned(), "hello".into());
        assert!(result.is_err());
        assert!(!path.exists());
    }

    #[test]
    fn writes_markdown_and_json_reports() {
        for extension in ["md", "json"] {
            let path = temp_path(&format!("report.{extension}"));
            write_report(path.to_string_lossy().into_owned(), "content".into()).unwrap();
            assert_eq!(std::fs::read_to_string(&path).unwrap(), "content");
            std::fs::remove_file(path).unwrap();
        }
    }

    #[test]
    fn rejects_oversized_reports() {
        let path = temp_path("large.md");
        let content = "x".repeat(16 * 1024 * 1024 + 1);
        let result = write_report(path.to_string_lossy().into_owned(), content);
        assert!(result.is_err());
        assert!(!path.exists());
    }
}

#[tauri::command]
pub fn set_live_paused(state: State<'_, AppState>, paused: bool) {
    state.paused.store(paused, Ordering::Relaxed);
}
