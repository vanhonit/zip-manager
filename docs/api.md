---
layout: page
title: API Reference
subtitle: Tauri commands and backend functions
---

## Overview

Rusty Compress exposes a set of Tauri commands that allow the React frontend to communicate with the Rust backend. These commands handle file operations, archive management, and system integration.

## Command Structure

All commands follow the Tauri pattern:

```javascript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('command_name', { 
  param1: 'value1', 
  param2: 'value2' 
});
```

## File System Commands

### read_directory

List contents of a filesystem directory.

**Parameters**:
- `path` (string): Absolute path to directory

**Returns**:
```typescript
Array<{
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  modified: string;
  file_type: string;
}>
```

**Example**:
```javascript
const files = await invoke('read_directory', { 
  path: '/home/user/Documents' 
});

console.log(files);
// [
//   { name: 'Documents', path: '/home/user/Documents', size: 0, is_directory: true, ... },
//   { name: 'file.txt', path: '/home/user/file.txt', size: 1024, is_directory: false, ... }
// ]
```

**Error Cases**:
- Directory doesn't exist
- Insufficient permissions
- Path is not a directory

### open_file

Open a file with the system's default application.

**Parameters**:
- `path` (string): Absolute path to file

**Returns**: `void`

**Example**:
```javascript
await invoke('open_file', { 
  path: '/home/user/document.pdf' 
});
// Opens PDF in default PDF viewer
```

**Supported Operations**:
- Opens file in system default application
- Works for both local files and extracted archive files
- Cross-platform compatibility

## Archive Management Commands

### archive_file_details

Get contents of an archive, optionally filtered by subdirectory.

**Parameters**:
- `archive_path` (string): Path to archive file
- `file_path` (string, optional): Path within archive (default: "" for root)
- `state` (string): Current navigation state

**Returns**:
```typescript
Array<{
  name: string;
  path: string;
  size: number;
  compressed_size: number;
  is_directory: boolean;
  modified: string;
  file_type: string;
  compression_method: string;
}>
```

**Example**:
```javascript
// Get root contents
const rootFiles = await invoke('archive_file_details', { 
  archive_path: '/home/user/archive.zip',
  file_path: '',
  state: 'browsing'
});

// Get specific subdirectory
const subDirFiles = await invoke('archive_file_details', { 
  archive_path: '/home/user/archive.zip',
  file_path: 'subfolder/documents',
  state: 'browsing'
});
```

**Archive Format Support**:
- ZIP, JAR, APK, XAPK, IPA
- TAR, TAR.GZ, TGZ, TAR.BZ2, TBZ2
- RAR

**Performance Notes**:
- Large archives may take time to read
- Results are cached for subsequent calls
- Memory usage scales with archive size

### extract_files

Extract files from an archive to destination directory.

**Parameters**:
- `app_handle`: Tauri app handle for emitting events
- `archive_path` (string): Path to archive file
- `output_path` (string): Destination directory
- `selected_files` (Array<string>): Files to extract (empty = all)

**Returns**: `Promise<void>`

**Events Emitted**:
- `extract-progress`: Progress updates
  ```typescript
  { current: number, total: number, filename: string }
  ```
- `extract-complete`: Extraction finished
  ```typescript
  { success: boolean, message: string, files_extracted: number }
  ```
- `extract-error`: Error occurred
  ```typescript
  { error: string, details: string }
  ```

**Example**:
```javascript
import { listen } from '@tauri-apps/api/event';

// Listen for progress updates
const unlisten = await listen('extract-progress', (event) => {
  const { current, total, filename } = event.payload;
  console.log(`Extracting ${current}/${total}: ${filename}`);
  updateProgressBar(current / total * 100);
});

// Extract files
await invoke('extract_files', { 
  app_handle: getCurrentWindow(),
  archive_path: '/home/user/archive.zip',
  output_path: '/home/user/extracted',
  selected_files: ['folder/file1.txt', 'folder/file2.pdf']
});

// Clean up listener
unlisten();
```

**Extraction Options**:
- Preserve directory structure
- Maintain file permissions
- Handle existing files
- Progress reporting

### view_file_in_archive

View a specific file from archive in system viewer.

**Parameters**:
- `archive_path` (string): Path to archive file
- `file_name` (string): Path to file within archive
- `state` (string): Current navigation state

**Returns**: `Promise<void>`

**Example**:
```javascript
await invoke('view_file_in_archive', { 
  archive_path: '/home/user/archive.zip',
  file_name: 'documents/report.pdf',
  state: 'viewing'
});
// Opens PDF in default viewer
```

**Process**:
1. Extracts file to temporary location
2. Opens in system default viewer
3. Cleans up temporary file when viewer closes

### get_image_preview

Get image preview from archive as data URL.

**Parameters**:
- `archive_path` (string): Path to archive file
- `file_path` (string): Path to image file within archive

**Returns**: `Promise<string>` (Data URL)

**Example**:
```javascript
const imageUrl = await invoke('get_image_preview', { 
  archive_path: '/home/user/archive.zip',
  file_path: 'images/photo.jpg'
});

// Display in React component
<img src={imageUrl} alt="Preview" />
```

**Supported Image Formats**:
- JPEG, PNG, GIF, BMP, WEBP
- TIFF (depending on system support)

**Performance Considerations**:
- Large images may take time to extract
- Consider implementing caching
- Use thumbnails for preview lists

## Checksum Commands

### compute_checksum

Compute file checksum with progress reporting.

**Parameters**:
- `app_handle`: Tauri app handle for emitting events
- `file_path` (string): Path to file
- `algorithm` (string): Checksum algorithm ('MD5', 'SHA1', 'SHA256', 'SHA512')

**Returns**: `Promise<string>` (Checksum value)

**Events Emitted**:
- `checksum-progress-{algorithm}`: Progress updates
  ```typescript
  { progress: number, current_block: number, total_blocks: number }
  ```
- `checksum-complete-{algorithm}`: Computation finished
  ```typescript
  { checksum: string, file_path: string, algorithm: string }
  ```
- `checksum-error-{algorithm}`: Error occurred
  ```typescript
  { error: string, file_path: string }
  ```

**Example**:
```javascript
import { listen } from '@tauri-apps/api/event';

// Listen for progress updates
const algorithm = 'SHA256';
const unlisten = await listen(`checksum-progress-${algorithm}`, (event) => {
  const { progress, current_block, total_blocks } = event.payload;
  console.log(`Computing checksum: ${progress.toFixed(1)}%`);
  updateProgressBar(progress);
});

// Compute checksum
const checksum = await invoke('compute_checksum', { 
  app_handle: getCurrentWindow(),
  file_path: '/home/user/document.pdf',
  algorithm: algorithm
});

console.log('SHA256:', checksum);
// "a3b2c1d4e5f6..."

// Clean up listener
unlisten();
```

**Algorithm Comparison**:

| Algorithm | Speed | Security | Common Use |
|-----------|-------|----------|------------|
| MD5 | Fastest | Low | Quick verification |
| SHA1 | Fast | Medium | Legacy compatibility |
| SHA256 | Medium | High | General purpose |
| SHA512 | Slower | Highest | Security-sensitive |

**Performance Notes**:
- Progress reported in 5% increments
- Large files may take considerable time
- Memory usage is optimized for large files

## Event System

### Available Events

```typescript
// Extraction events
'extract-progress'     // Progress during extraction
'extract-complete'     // Extraction finished
'extract-error'        // Extraction error

// Checksum events
'checksum-progress-MD5'
'checksum-complete-MD5'
'checksum-error-MD5'
'checksum-progress-SHA1'
// ... (other algorithms)

// File events
'file-open'            // File opened in viewer
```

### Event Listener Pattern

```javascript
import { listen } from '@tauri-apps/api/event';

// General pattern
const unlisten = await listen('event-name', (event) => {
  const payload = event.payload;
  // Handle event
});

// Clean up when component unmounts
useEffect(() => {
  return () => unlisten();
}, []);
```

## Error Handling

### Common Error Responses

```typescript
// File not found
{
  error: "File not found",
  details: "The specified file does not exist",
  code: "ENOENT"
}

// Permission denied
{
  error: "Permission denied",
  details: "Insufficient permissions to access file",
  code: "EACCES"
}

// Corrupted archive
{
  error: "Archive corrupted",
  details: "Unable to read archive structure",
  code: "EARCHIVE"
}
```

### Error Handling Pattern

```javascript
try {
  const result = await invoke('command_name', { param: 'value' });
  // Handle success
} catch (error) {
  console.error('Command failed:', error);
  // Parse error if available
  if (error.message) {
    showErrorNotification(error.message);
  }
}
```

## Performance Considerations

### Async Operations

All commands are asynchronous and non-blocking:

```javascript
// This won't block the UI
const files = await invoke('read_directory', { path: '/large/directory' });
```

### Memory Management

- Large files are processed in chunks
- Temporary files are cleaned up automatically
- Archive contents are cached for performance

### Optimized Workflows

```javascript
// Bad: Multiple sequential operations
const files1 = await invoke('read_directory', { path: '/dir1' });
const files2 = await invoke('read_directory', { path: '/dir2' });

// Good: Parallel operations
const [files1, files2] = await Promise.all([
  invoke('read_directory', { path: '/dir1' }),
  invoke('read_directory', { path: '/dir2' })
]);
```

## Type Definitions

For TypeScript support, create type definitions:

```typescript
// types/tauri-commands.ts
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  is_directory: boolean;
  modified: string;
  file_type: string;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  filename: string;
}

export interface ChecksumProgress {
  progress: number;
  current_block: number;
  total_blocks: number;
}
```

## Testing Commands

```javascript
// Test file system operations
const testFiles = async () => {
  const files = await invoke('read_directory', { path: '/tmp' });
  console.log('Files in /tmp:', files.length);
};

// Test archive operations
const testArchive = async () => {
  const contents = await invoke('archive_file_details', {
    archive_path: '/test/archive.zip',
    file_path: '',
    state: 'test'
  });
  console.log('Archive contents:', contents);
};
```

<div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; margin-top: 2rem;">
    <div class="card-header">
        <h3 class="card-title" style="color: white;">🔧 Advanced Usage</h3>
    </div>
    <p style="color: rgba(255,255,255,0.9);">For more advanced usage patterns and integration examples, check out our development guide.</p>
    <a href="/development.html" class="btn" style="background: white; color: #667eea;">Development Guide</a>
</div>