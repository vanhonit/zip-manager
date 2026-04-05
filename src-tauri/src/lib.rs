// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod data_type;
mod file_manager;
mod utils;
mod zip;
mod tar;

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
// use zip::ZipArchive;
use data_type::{ExtractionConfig, FileInfo, AppTempDir};
use file_manager::{open_file, read_directory};
use zip::view_file_in_zip;
use tar::view_file_in_tar;
use std::thread;
use tempfile::TempDir;
use tauri::{Manager, WebviewWindowBuilder};
use tauri::{AppHandle, Emitter, Listener};


#[tauri::command]
fn archive_file_details(
    source_path: String,
    file_path: Option<String>,
    state: tauri::State<'_, Arc<AppTempDir>>,
) -> Result<Vec<FileInfo>, String> {
    let source = PathBuf::from(source_path);

    match source.extension().and_then(|ext| ext.to_str()) {
        Some("zip") => zip::get_zip_details(source, file_path, state).map_err(|e| e.to_string()),
        Some("tar") => tar::get_tar_details(source, file_path, state).map_err(|e| e.to_string()),
        // Some("tar") => {
        //     let file = fs::File::open(&source).map_err(|e| e.to_string())?;
        //     let mut archive = Archive::new(file);
        //     let mut file_infos = Vec::new();
        //     for entry in archive.entries().map_err(|e| e.to_string())? {
        //         let entry = entry.map_err(|e| e.to_string())?;
        //         let path = entry.path().map_err(|e| e.to_string())?.into_owned();
        //         let file_info = FileInfo {
        //             path: path.to_string_lossy().into_owned(),
        //             is_dir: entry.header().entry_type().is_dir(),
        //         };
        //         file_infos.push(file_info);
        //     }
        //     Ok(file_infos)
        // },
        // Some("gz") | Some("tgz") => {
        //     let file = fs::File::open(&source).map_err(|e| e.to_string())?;
        //     let decoder = GzDecoder::new(file);
        //     let mut archive = Archive::new(decoder);
        //     let mut file_infos = Vec::new();
        //     for entry in archive.entries().map_err(|e| e.to_string())? {
        //         let entry = entry.map_err(|e| e.to_string())?;
        //         let path = entry.path().map_err(|e| e.to_string())?.into_owned();
        //         let file_info = FileInfo {
        //             path: path.to_string_lossy().into_owned(),
        //             is_dir: entry.header().entry_type().is_dir(),
        //         };
        //         file_infos.push(file_info);
        //     }
        // Ok(file_infos)
        // },
        _ => Err("Unsupported archive type".to_string()),
    }
}

#[tauri::command]
async fn extract_files(
    app_handle: AppHandle,
    archive_path: String,
    output_path: String,
    selected_files: Option<Vec<String>>,
) -> Result<(), String> {
    // Generate a unique label using the current timestamp
    let label = format!(
        "extract-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let webview_url = tauri::WebviewUrl::App(
        format!(
            "index.html?label=progress&name={}&fileName={}",
            label, archive_path
        )
        .into(),
    );

    // // Create the progress window dynamically
    let _progress_window = WebviewWindowBuilder::new(
        &app_handle,
        &label,
        webview_url.clone(), // The window label
    )
    .title("Extraction Progress")
    .resizable(false)
    .inner_size(400.0, 100.0)
    .build()
    .map_err(|e| e.to_string())?;

    // Prepare extraction configuration
    let config = ExtractionConfig {
        source: archive_path,
        destination: output_path,
        selected_files,
        cancel: Arc::new(AtomicBool::new(false)),
    };

    // Clone handles for thread communication
    let app_handle_clone = app_handle.clone();
    let config_clone = config.clone();
    let window_label = label.clone();
    thread::spawn(move || {
        app_handle_clone.listen(format!("{}://ready", label), {
            let app_handle_clone = app_handle_clone.clone();
            move |_| {
                println!("Window is ready: {}", window_label);
                let app_handle_clone = app_handle_clone.clone();
                let config_clone = config_clone.clone();
                let source = PathBuf::from(&config_clone.source);
                match source.extension().and_then(|ext| ext.to_str()) {
                    Some("zip") => {
                        match zip::unarchive_zip_file(app_handle_clone, config_clone) {
                            Ok(_) => {
                                // Emit completion event
                                let _ = app_handle.emit("extract-complete", ());
                            }
                            Err(e) => {
                                // Emit error event
                                let _ = app_handle.emit("extract-error", e);
                            }
                        }
                    }
                    Some("tar") => {
                        match tar::unarchive_tar_file(app_handle_clone, config_clone) {
                            Ok(_) => {
                                // Emit completion event
                                let _ = app_handle.emit("extract-complete", ());
                            }
                            Err(e) => {
                                // Emit error event
                                let _ = app_handle.emit("extract-error", e);
                            }
                        }
                    }
                    _ => {
                        // Emit error event for unsupported archive type
                        let _ = app_handle.emit("extract-error", "Unsupported archive type".to_string());
                    }
                }
            }
        });
    })
    .join()
    .unwrap();

    Ok(())
}

#[tauri::command]
fn view_file_in_archive(archive_path: String, file_name: String, state: tauri::State<'_, Arc<AppTempDir>>) -> Result<(), String> {
    let source = PathBuf::from(archive_path.clone());
    match source.extension().and_then(|ext| ext.to_str()) {
        Some("zip") => {
            let _ = view_file_in_zip(archive_path.clone(), file_name, state);
        }
        Some("tar") => {
            let _ = view_file_in_tar(archive_path.clone(), file_name, state);
        }
        _ => {}
    }
    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .setup(|app| {
            // Access command-line arguments
            // Create a temporary directory
            let temp_dir = TempDir::new().map_err(|e| {
                eprintln!("Failed to create temp dir: {}", e);
                e
            })?;

            // Log the temp directory path for debugging
            println!("Temporary directory created at: {}", temp_dir.path().display());

            // Store the TempDir in the app state
            app.manage(Arc::new(AppTempDir { temp_dir }));

            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Cleanup when the last window is closed
            tauri::WindowEvent::CloseRequested {  .. } => {
                let state = window.state::<Arc<AppTempDir>>();
                let app_handle = window.app_handle();
                let windows = app_handle.windows();
                if windows.len() == 1 {
                    println!("Cleaning up temporary directory: {}", state.temp_dir.path().display());
                    let temp_dir = &state.temp_dir.path().to_path_buf();
                    // Delete the directory manually
                    if let Err(e) = fs::remove_dir_all(&temp_dir) {
                        eprintln!("Failed to delete temp directory: {}", e);
                    }                }
                },
            _ => {}
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_directory,
            open_file,
            archive_file_details,
            extract_files,
            view_file_in_archive
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
