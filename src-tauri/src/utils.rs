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

pub fn get_file_extension(file_name: &str) -> Option<String> {
    // Split the file name by the last '.' and get the extension
    file_name.split('.').last().map(|ext| ext.to_string())
}