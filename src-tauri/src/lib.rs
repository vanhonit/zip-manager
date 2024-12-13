// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod zip;
mod file_manager;
mod data_type;
mod utils;

use std::path::PathBuf;
use std::fs;
// use zip::ZipArchive;
use tar::Archive;
use flate2::read::GzDecoder;
use file_manager::{open_file, read_directory};
use data_type::FileInfo;
use tauri::{Emitter, AppHandle};
use tauri::WebviewWindowBuilder;
use std::thread;
use tokio::sync::broadcast;
use tokio::runtime::Runtime;

#[tauri::command]
fn unarchive_file(source_path: String, destination_path: String) -> Result<(), String> {
    let source = PathBuf::from(source_path);
    let destination = PathBuf::from(destination_path);

    // Ensure destination directory exists
    fs::create_dir_all(&destination).map_err(|e| e.to_string())?;

    // Determine archive type based on file extension
    match source.extension().and_then(|ext| ext.to_str()) {
        Some("zip") => {
            // let (tx, rx) = mpsc::channel();
            // zip::unarchive_zip_file(source, destination, tx).map_err(|e| e.to_string())?;
        },
        Some("tar") => {
            let file = fs::File::open(&source).map_err(|e| e.to_string())?;
            let mut archive = Archive::new(file);
            archive.unpack(&destination).map_err(|e| e.to_string())?;
        },
        Some("gz") | Some("tgz") => {
            let file = fs::File::open(&source).map_err(|e| e.to_string())?;
            let decoder = GzDecoder::new(file);
            let mut archive = Archive::new(decoder);
            archive.unpack(&destination).map_err(|e| e.to_string())?;
        },
        _ => return Err("Unsupported archive type".to_string()),
    }

    Ok(())
}

#[tauri::command]
fn archive_file_details(source_path: String, file_path: Option<String>) -> Result<Vec<FileInfo>, String> {
    let source = PathBuf::from(source_path);

    match source.extension().and_then(|ext| ext.to_str()) {
        Some("zip") => {
            zip::get_zip_details(source, file_path).map_err(|e| e.to_string())
        },
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
fn extract_files(app_handle: AppHandle, archive_path: String, output_path: String) -> Result<(), String> {
    let webview_url = tauri::WebviewUrl::App("index.html?label=progress".into());
    // Create the progress window dynamically
    let progress_window = WebviewWindowBuilder::new(
        &app_handle,
        "progress",
        webview_url.clone()
         // The window label
    )
    .title("Extraction Progress")
    .resizable(false)
    .inner_size(400.0, 200.0)
    .build()
    .map_err(|e| e.to_string())?;

    // Ensure the window is shown before starting the extraction
    // progress_window.show().unwrap();
    let runtime = Runtime::new().unwrap();
    
    let (progress_tx, _) = broadcast::channel(10);
    let progress_tx_clone = progress_tx.clone();
    runtime.spawn(async move {
        let result = tokio::task::spawn_blocking(move || {
            zip::unarchive_zip_file(PathBuf::from(archive_path), PathBuf::from(output_path), progress_tx_clone)
        })
        .await;

        if let Err(err) = result {
            eprintln!("Extraction failed: {}", err);
        }
    });

    let app_handle_clone = app_handle.clone();
    runtime.block_on(async move {
        let mut progress_rx = progress_tx.subscribe();
        while let Ok(progress) = progress_rx.recv().await {
            app_handle_clone
                .emit_to("progress", "extract-progress", progress)
                .unwrap();
        }
        progress_window.close().unwrap();
    });

    // handle.join().unwrap();
    
    // Simulate file extraction progress (replace this with actual logic)
    // thread::spawn(move || {
    //     for i in 1..=100 {
    //         thread::sleep(Duration::from_millis(200)); // Simulate work
    //         app_handle.emit_to("progress", "extract-progress", i).unwrap();
    //     }

    //     // Close the progress window after completion
    //     progress_window.close().unwrap();
    // });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![read_directory, unarchive_file, open_file, archive_file_details, extract_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
