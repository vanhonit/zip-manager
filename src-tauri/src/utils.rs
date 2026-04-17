#[allow(dead_code)]
pub fn remove_last_item_from_path_string(path: &str) -> Result<String, String> {
    // Trim any trailing slashes to normalize the path
    let trimmed_path = path.trim_end_matches('/').trim_end_matches('\\');

    // Find the position of the last separator
    if let Some(pos) = trimmed_path.rfind(|c| c == '/' || c == '\\') {
        // Return the substring up to the last separator
        Ok(trimmed_path[..pos].to_string() + "/")
    } else {
        // No separators found, return an error
        Err("The path has no parent or is invalid.".to_string())
    }
}

#[allow(dead_code)]
pub fn get_file_extension(file_name: &str) -> Option<String> {
    // Split the file name by the last '.' and get the extension
    file_name.split('.').last().map(|ext| ext.to_string())
}

/// Archive type enum for detecting and handling different archive formats
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArchiveType {
    // ZIP-based archives
    Zip,
    Jar,
    Apk,
    Xapk,
    Ipa,
    // TAR-based archives
    Tar,
    TarGz,
    Tgz,
    TarBz2,
    Tbz2,
    // RAR archives
    Rar,
    // 7z archives
    SevenZ,
}

/// Detect archive type from filename, handling compound extensions like .tar.gz
#[allow(dead_code)]
pub fn detect_archive_type(file_name: &str) -> Option<ArchiveType> {
    let lower = file_name.to_lowercase();

    // Check compound extensions first (.tar.gz, .tar.bz2)
    if lower.ends_with(".tar.gz") {
        Some(ArchiveType::TarGz)
    } else if lower.ends_with(".tar.bz2") {
        Some(ArchiveType::TarBz2)
    } else if lower.ends_with(".tgz") {
        Some(ArchiveType::Tgz)
    } else if lower.ends_with(".tbz2") {
        Some(ArchiveType::Tbz2)
    } else if lower.ends_with(".tar") {
        Some(ArchiveType::Tar)
    } else if lower.ends_with(".zip") {
        Some(ArchiveType::Zip)
    } else if lower.ends_with(".jar") {
        Some(ArchiveType::Jar)
    } else if lower.ends_with(".apk") {
        Some(ArchiveType::Apk)
    } else if lower.ends_with(".xapk") {
        Some(ArchiveType::Xapk)
    } else if lower.ends_with(".ipa") {
        Some(ArchiveType::Ipa)
    } else if lower.ends_with(".rar") {
        Some(ArchiveType::Rar)
    } else if lower.ends_with(".7z") {
        Some(ArchiveType::SevenZ)
    } else {
        None
    }
}

/// Check if the archive type is ZIP-based (all ZIP-based formats can use ZIP extraction)
#[allow(dead_code)]
pub fn is_zip_based(archive_type: ArchiveType) -> bool {
    matches!(
        archive_type,
        ArchiveType::Zip | ArchiveType::Jar | ArchiveType::Apk | ArchiveType::Xapk | ArchiveType::Ipa
    )
}

/// Check if the archive type is TAR-based (all TAR-based formats can use TAR extraction)
#[allow(dead_code)]
pub fn is_tar_based(archive_type: ArchiveType) -> bool {
    matches!(
        archive_type,
        ArchiveType::Tar | ArchiveType::TarGz | ArchiveType::Tgz | ArchiveType::TarBz2 | ArchiveType::Tbz2
    )
}

/// Check if the archive type is RAR-based
#[allow(dead_code)]
pub fn is_rar_based(archive_type: ArchiveType) -> bool {
    matches!(archive_type, ArchiveType::Rar)
}

/// Check if the archive type is 7z-based
#[allow(dead_code)]
pub fn is_sevenz_based(archive_type: ArchiveType) -> bool {
    matches!(archive_type, ArchiveType::SevenZ)
}
