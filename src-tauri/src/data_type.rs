use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tempfile::TempDir;

#[derive(serde::Serialize)]
pub struct SingleChecksum {
    pub algorithm: String,
    pub hash: String,
}
#[derive(serde::Serialize)]
pub struct FileInfo {
    pub name: String,
    pub is_dir: bool,
    pub last_modified: String,
    pub size: u64,
    pub mimetype: String,
    pub path: String,
}

// Extraction configuration struct
#[derive(Clone)]
pub struct ExtractionConfig {
    pub source: String,
    pub destination: String,
    pub selected_files: Option<Vec<String>>,
    pub cancel: Arc<AtomicBool>,
}

// Extraction progress state
#[derive(Clone)]
pub struct ExtractionProgress {
    current: Arc<Mutex<f64>>,
    total_files: usize,
}

impl ExtractionProgress {
    pub fn new(total_files: usize) -> Self {
        ExtractionProgress {
            current: Arc::new(Mutex::new(0.0)),
            total_files,
        }
    }

    pub fn update(&self, extracted_files: usize) {
        let mut current = self.current.lock().unwrap();
        *current = ((extracted_files as f64 / self.total_files as f64) * 100.0).min(100.0);
    }

    pub fn get(&self) -> f64 {
        *self.current.lock().unwrap()
    }
}

pub struct AppTempDir {
    pub temp_dir: TempDir,
}

// Compression configuration struct
#[derive(Clone, serde::Serialize)]
pub struct CompressionConfig {
    pub files: Vec<String>,
    pub output_path: String,
    pub archive_format: ArchiveFormat,
    pub compression_level: u8,
    pub cancel: Arc<AtomicBool>,
}

// Archive format enum
#[derive(Clone, Copy, serde::Serialize, serde::Deserialize)]
pub enum ArchiveFormat {
    Zip,
    Tar,
    Sevenz,
}

// Compression progress state
#[derive(Clone)]
pub struct CompressionProgress {
    pub current: Arc<Mutex<f64>>,
    pub total_files: usize,
    pub current_file: Arc<Mutex<Option<String>>>,
}

impl CompressionProgress {
    pub fn new(total_files: usize) -> Self {
        CompressionProgress {
            current: Arc::new(Mutex::new(0.0)),
            total_files,
            current_file: Arc::new(Mutex::new(None)),
        }
    }

    pub fn update(&self, files_processed: usize) {
        let mut current = self.current.lock().unwrap();
        *current = ((files_processed as f64 / self.total_files as f64) * 100.0).min(100.0);
    }

    pub fn set_current_file(&self, file: String) {
        *self.current_file.lock().unwrap() = Some(file);
    }
}
