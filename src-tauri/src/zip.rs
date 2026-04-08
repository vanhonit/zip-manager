use open::that_detached;
use std::collections::HashSet;
use std::fs::File;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::Emitter;
use tauri::State;
use zip::ZipArchive;

use crate::data_type::{AppTempDir, ExtractionConfig, ExtractionProgress, FileInfo};
use rand::Rng;

pub fn get_zip_details(
    source_path: PathBuf,
    file_path: Option<String>,
    _state: State<'_, Arc<AppTempDir>>,
) -> Result<Vec<FileInfo>, String> {
    let file_path = file_path.unwrap_or_default();

    // Normalize current_dir to always end with '/' if non-empty
    let current_dir = if file_path.is_empty() {
        String::new()
    } else if file_path.ends_with('/') {
        file_path.clone()
    } else {
        format!("{}/", file_path)
    };

    // Open the archive
    let file = File::open(&source_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let mut archive = ZipArchive::new(reader).map_err(|e| e.to_string())?;

    // First pass: collect all entry names
    let mut all_names: Vec<String> = Vec::new();
    for i in 0..archive.len() {
        let entry = archive.by_index(i).map_err(|e| e.to_string())?;
        all_names.push(entry.name().to_string());
    }

    // Build a deduplicated set of immediate children of current_dir
    let mut seen: HashSet<String> = HashSet::new();
    let mut child_paths: Vec<String> = Vec::new();

    for name in &all_names {
        // Skip if this entry IS the current directory itself
        if name == &current_dir {
            continue;
        }
        // Skip entries outside the current directory
        if !current_dir.is_empty() && !name.starts_with(&current_dir) {
            continue;
        }

        // Strip the current_dir prefix to get the relative path
        let relative = &name[current_dir.len()..];

        let child_path = match relative.find('/') {
            Some(pos) => {
                // Entry lives inside a subdirectory — immediate child is the dir
                let dir_part = &relative[..pos];
                if dir_part.is_empty() {
                    continue;
                }
                format!("{}{}/", current_dir, dir_part)
            }
            None => {
                // Direct file child of current_dir
                name.clone()
            }
        };

        if seen.insert(child_path.clone()) {
            child_paths.push(child_path);
        }
    }

    // Second pass: fetch metadata for each immediate child
    let mut file_details: Vec<FileInfo> = Vec::new();

    for child_path in &child_paths {
        let is_dir = child_path.ends_with('/');
        let display_name = child_path
            .trim_end_matches('/')
            .rsplit('/')
            .next()
            .unwrap_or(child_path.as_str())
            .to_string();

        let (size, last_modified) = match archive.by_name(child_path.as_str()) {
            Ok(entry) => {
                let size = entry.size();
                let last_modified = entry
                    .last_modified()
                    .map(|dt| {
                        chrono::NaiveDateTime::try_from(dt)
                            .map(|ndt| ndt.format("%Y-%m-%d %H:%M:%S").to_string())
                            .unwrap_or_else(|_| "N/A".to_string())
                    })
                    .unwrap_or_else(|| "N/A".to_string());
                (size, last_modified)
            }
            // No explicit record for this entry (e.g. an inferred directory)
            Err(_) => (0, "N/A".to_string()),
        };

        let mimetype = if is_dir {
            String::new()
        } else {
            let ext = child_path.rsplit('.').next().unwrap_or("");
            mime_guess::from_ext(ext)
                .first_raw()
                .unwrap_or("")
                .to_string()
        };

        file_details.push(FileInfo {
            name: display_name,
            is_dir,
            last_modified,
            size,
            mimetype,
            path: child_path.clone(),
        });
    }

    // Sort: directories first, then alphabetical by lowercase name
    file_details.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(file_details)
}

pub fn unarchive_zip_file(
    app_handle: tauri::AppHandle,
    config: ExtractionConfig,
) -> Result<(), String> {
    // Open the ZIP file
    let mut archive = ZipArchive::new(File::open(&config.source).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    let selected_files = config.selected_files.unwrap_or_default();
    // Total number of files in the archive
    let total_files = if !selected_files.is_empty() {
        selected_files.len()
    } else {
        archive.len()
    };

    // Create progress tracker
    let progress = ExtractionProgress::new(total_files);

    // Create extraction directory if it doesn't exist
    std::fs::create_dir_all(&config.destination)
        .map_err(|e| format!("Failed to create extraction directory: {}", e))?;

    // Extract files with progress tracking and cancellation support
    for i in 0..archive.len() {
        // Check for cancellation
        if config.cancel.load(Ordering::Relaxed) {
            return Err("Extraction cancelled".to_string());
        }

        let mut file = match archive.by_index(i) {
            Ok(file) => file,
            Err(e) => {
                // Log and continue with next file
                eprintln!("Failed to extract file {}: {}", i, e);
                continue;
            }
        };

        // Check if the file path is in the selected files
        if !selected_files.is_empty() {
            let file_path = file.enclosed_name().unwrap().to_string_lossy().to_string();
            if !selected_files
                .iter()
                .any(|selected| file_path.starts_with(selected))
            {
                println!("Skipping file: {}", file_path);
                continue;
            }
        }

        // Construct full file path
        let outpath = match file.enclosed_name() {
            Some(path) => Path::new(&config.destination).join(path),
            None => continue,
        };

        // Create parent directories if they don't exist
        if let Some(p) = outpath.parent() {
            std::fs::create_dir_all(p).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        // Skip if it's a directory
        if file.is_dir() {
            std::fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
            continue;
        }

        // Write file
        let mut outfile = match File::create(&outpath) {
            Ok(file) => file,
            Err(e) => {
                eprintln!("Failed to create output file: {}", e);
                continue;
            }
        };

        // Copy file contents
        match io::copy(&mut file, &mut outfile) {
            Ok(_) => {
                // Update and emit progress
                progress.update(i + 1);
                eprint!("Extracted {}/{} files\n", i + 1, total_files);
                // Emit progress event
                let _ = app_handle.emit("extract-progress", progress.get());
            }
            Err(e) => {
                eprintln!("Failed to write file: {}", e);
            }
        }
    }

    Ok(())
}

pub fn view_file_in_zip(
    source: String,
    file_name: String,
    state: State<'_, Arc<AppTempDir>>,
) -> Result<String, String> {
    if file_name.contains("..") {
        return Err(format!("Invalid file name (path traversal): {}", file_name));
    }

    let file_name_clean = file_name.trim();
    if file_name_clean.is_empty() {
        return Err("Empty file name provided".to_string());
    }

    // Open the archive
    let file = File::open(&source).map_err(|e| format!("Failed to open archive: {}", e))?;
    let reader = BufReader::new(file);
    let mut archive =
        ZipArchive::new(reader).map_err(|e| format!("Failed to read archive: {}", e))?;

    // Try to find the file
    let mut file_in_zip = match archive.by_name(file_name_clean) {
        Ok(file) => {
            eprintln!("[DEBUG] File found successfully: {}", file.name());
            file
        }
        Err(e) => {
            eprintln!("[ERROR] File not found: {}", e);
            return Err(format!("File not found in archive: {}", e));
        }
    };

    // Create a temporary file
    let temp_dir = &state.temp_dir;
    let mut rng = rand::thread_rng();

    // Extract file extension from the actual found path
    let actual_file_path = file_in_zip.name();
    let extension = Path::new(actual_file_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");

    let random_name: String = (0..10)
        .map(|_| rng.gen_range(b'a'..=b'z') as char)
        .collect();

    let random_file_name: String = if extension.is_empty() {
        random_name
    } else {
        format!("{}.{}", random_name, extension)
    };

    let temp_file_path = temp_dir.path().join(&random_file_name);

    // Write the file to the temporary directory
    let mut temp_file =
        File::create(&temp_file_path).map_err(|e| format!("Failed to create temp file: {}", e))?;
    let bytes_copied = std::io::copy(&mut file_in_zip, &mut temp_file)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    eprintln!("[DEBUG] Extracted {} bytes to temp file", bytes_copied);

    // Clean up the temp file after opening with that_detached
    let _ = std::fs::remove_file(&temp_file_path);

    // Open the file with the default application
    that_detached(&temp_file_path).map_err(|e| format!("Failed to open file: {}", e))?;

    // Return the path of the temporary file
    Ok(temp_file_path.to_string_lossy().to_string())
}
