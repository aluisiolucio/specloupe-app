mod collectors;
mod commands;
mod live;
mod models;
mod privileged;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(commands::AppState::default())
        .setup(|app| {
            live::spawn(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::collect_system_info,
            commands::load_privileged_info,
            commands::write_report,
            commands::set_live_paused,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
