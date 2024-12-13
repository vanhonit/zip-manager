
use std::fs::{File, create_dir_all};
use std::io::{BufReader, copy};
use std::path::{PathBuf, Path, MAIN_SEPARATOR};
use zip::{ZipArchive, DateTime};

use crate::data_type::FileInfo;
use crate::utils::{get_file_extension, remove_last_item_from_path_string};
use tokio::sync::broadcast;
use tokio::task;

pub fn get_zip_details(source_path: PathBuf, file_path: Option<String>) -> Result<Vec<FileInfo>, String> {
    let file = File::open(source_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;
    let mut file_details: Vec<FileInfo> = Vec::new();
    let file_path = file_path.unwrap();

    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| e.to_string())?;
        let file_name = file.name();
        if file_name.starts_with(&file_path) {
            let relative_path = file_name.strip_prefix(&file_path).unwrap_or(file_name).trim_end_matches(MAIN_SEPARATOR);
            let count_child = relative_path.split(MAIN_SEPARATOR).collect::<Vec<&str>>();
            if count_child.len() == 1 {
                let size = file.size();
                let is_dir = file.is_dir();
                let path = file.enclosed_name().unwrap().to_string_lossy().to_string();
                let last_modified = file.last_modified().map(|dt: DateTime| {
                    let dt = chrono::NaiveDateTime::try_from(dt).unwrap();
                    dt.format("%Y-%m-%d %H:%M:%S").to_string()
                }).unwrap_or("N/A".to_string());
                if relative_path.is_empty() {
                    file_details.push(FileInfo {
                        name: "..".to_string(),
                        is_dir,
                        last_modified,
                        size,
                        mimetype: "".to_string(),
                        path: remove_last_item_from_path_string(file_path.as_str()).unwrap_or_else(|_| "".to_string())
                    });
                } else {
                    file_details.push(FileInfo {
                        name: relative_path.trim_end_matches('/').to_string(),
                        is_dir,
                        last_modified,
                        size,
                        mimetype: mime_guess::from_ext(get_file_extension(relative_path).unwrap().as_str()).first_raw().unwrap_or("").to_string(),
                        path
                    });
                }
            }
        }
    } 

    Ok(file_details)
}

/// Extracts a ZIP file and sends progress updates via a broadcast channel.
///
/// - `zip_path`: Path to the ZIP file to extract.
/// - `output_dir`: Directory where the files will be extracted.
/// - `progress_tx`: Broadcast sender for progress updates.
pub fn unarchive_zip_file(source: PathBuf, destination: PathBuf, progress_tx: broadcast::Sender<u32>) -> Result<(), String> {
        // Open the ZIP file
        let zip_file = File::open(&source).map_err(|e| e.to_string()).unwrap();
        let reader = BufReader::new(zip_file);
        let mut archive = ZipArchive::new(reader).map_err(|e| e.to_string()).unwrap();

        let total_files = archive.len();
        for i in 0..total_files {
            let mut file = archive.by_index(i).map_err(|e| e.to_string()).unwrap();
            let file_name = file.name().to_string();

            // Create the output file path
            let output_path = Path::new(&destination).join(&file_name);

            if file.is_dir() {
                // Create the directory
                create_dir_all(&output_path).unwrap();
            } else {
                // Create the parent directory if it doesn't exist
                if let Some(parent) = output_path.parent() {
                    create_dir_all(parent).unwrap();
                }
                // Write the file
                let mut output_file = File::create(&output_path).unwrap();
                copy(&mut file, &mut output_file).unwrap();
            }

            // Send progress update
            let progress = ((i + 1) as f64 / total_files as f64 * 100.0).round() as u32;
            let _ = progress_tx.send(progress);
        }
        Ok(())// Handle spawn_blocking errors

}