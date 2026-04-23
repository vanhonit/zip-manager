---
layout: page
title: Usage
subtitle: Learn how to use Rusty Compress effectively
---

## Getting Started with Rusty Compress

This guide covers the essential features and workflows of Rusty Compress to help you become productive quickly.

## Interface Overview

### Main Window Components

```
┌─────────────────────────────────────────┐
│ [🔄] Rusty Compress          [Tabs]    │  ← Tab Bar
├─────────────────────────────────────────┤
│ 📂 /home/user/Documents                │  ← Breadcrumb Navigation
├─────────────────────────────────────────┤
│ [Toolbar: ← → ↑ ↓ ⬇️ 🗑️ 🔍 📋]       │  ← Toolbar
├─────────────────────────────────────────┤
│ 📁 Documents    2024-01-15  4.2 GB     │
│ 📁 Pictures     2024-01-10  1.8 GB     │
│ 📄 archive.zip  2024-01-20  256 MB     │  ← File List
│ 📄 notes.txt    2024-01-18   12 KB     │
├─────────────────────────────────────────┤
│ Selected: 1 item  Total: 4 items       │  ← Status Bar
└─────────────────────────────────────────┘
```

### Navigation Elements

- **Tab Bar**: Open multiple files/archives in tabs
- **Breadcrumbs**: Clear path navigation
- **Toolbar**: Quick access to common actions
- **File List**: Browse files and folders
- **Status Bar**: Selection and total item count

## Opening Archives

### Method 1: File Association

1. Locate your archive file in Finder/Explorer/File Manager
2. Double-click the file
3. Rusty Compress automatically opens the archive

### Method 2: In-App Browser

1. Click the folder icon in the toolbar
2. Navigate to the folder containing your archive
3. Click on the archive file to open it

### Method 3: Drag and Drop

1. Drag an archive file from your file manager
2. Drop it onto the Rusty Compress window

### Supported Archive Formats

**ZIP-based**: `.zip`, `.jar`, `.apk`, `.xapk`, `.ipa`
**TAR-based**: `.tar`, `.tar.gz`, `.tgz`, `.tar.bz2`, `.tbz2`
**RAR-based**: `.rar`

## Browsing Archives

### Navigation Within Archives

- **Up Arrow / Up Button**: Navigate to parent directory
- **Down Arrow**: Enter selected directory
- **Back/Forward**: Navigate through browsing history
- **Breadcrumbs**: Click any part of the path to jump

### File Selection

- **Single Selection**: Click on a file
- **Multiple Selection**: 
  - Windows/Linux: `Ctrl + Click`
  - macOS: `Cmd + Click`
- **Range Selection**: `Shift + Click` to select consecutive files
- **Select All**: `Ctrl/Cmd + A`

### Sorting Files

Right-click in the file list to sort by:
- **Name**: Alphabetical order
- **Size**: File size (smallest to largest)
- **Type**: File extension
- **Date Modified**: Most recent first

## Extracting Files

### Extract Single Files

1. Browse to the archive
2. Select the files you want to extract
3. Click the "Extract" button in the toolbar (or press `Ctrl/Cmd + E`)
4. Choose destination directory
5. Monitor progress in the extraction window

### Extract Entire Archive

1. Open the archive
2. Click "Extract All" in the toolbar (or press `Ctrl/Cmd + Shift + E`)
3. Choose destination directory
4. Monitor progress

### Extraction Options

- **Preserve Structure**: Maintain original directory hierarchy
- **Overwrite Files**: Choose how to handle existing files
- **Permissions**: Preserve file permissions and attributes
- **Timestamps**: Keep original modification dates

## File Preview

### Previewing Images

1. Navigate to an image file within an archive
2. Double-click the image file
3. Image opens in your system default image viewer

### Viewing File Details

**Right-click** on any file to see:
- File name and extension
- File size
- Modification date
- File type
- Compression ratio (for archives)

### Opening Files in Default Applications

1. Select the file
2. Press `Enter` or double-click
3. File opens in your system's default application

## Computing Checksums

### Single File Checksum

1. Select a file (either in filesystem or within archive)
2. Click the "Checksum" button in the toolbar
3. Choose your preferred algorithm:
   - **MD5**: Fast, basic verification
   - **SHA1**: More secure than MD5
   - **SHA256**: Recommended for most use cases
   - **SHA512**: Highest security

### Batch Checksum Computation

1. Select multiple files using `Ctrl/Cmd + Click`
2. Click "Checksum" button
3. Choose algorithm
4. View progress and results for each file

### Understanding Checksum Results

```
File: documents/report.pdf
Algorithm: SHA256
Checksum: a3b2c1d4e5f6...
Status: ✅ Complete
```

**Use Cases**:
- **Verify Downloads**: Ensure downloaded files aren't corrupted
- **File Integrity**: Check if files have been modified
- **Backup Verification**: Confirm backup copies match originals

## Advanced Features

### Working with Multiple Archives

1. **Open Multiple Tabs**: 
   - `Ctrl/Cmd + T` for new tab
   - Drag archive to tab bar
   - Right-click archive → "Open in New Tab"

2. **Switch Between Tabs**:
   - Click tab headers
   - `Ctrl/Cmd + Tab` to cycle through tabs
   - `Ctrl/Cmd + 1-9` to jump to specific tab

3. **Compare Archives**: 
   - Open archives in separate tabs
   - Compare contents side by side

### File Management Within Archives

1. **Search Files**:
   - Press `Ctrl/Cmd + F` to open search
   - Type file name or pattern
   - Results shown in real-time

2. **Filter Files**:
   - Use the filter dropdown in toolbar
   - Filter by file type (images, documents, etc.)
   - Toggle hidden files

3. **File Operations**:
   - Delete files from archive (not yet implemented)
   - Rename files within archive (not yet implemented)
   - Add files to archive (not yet implemented)

## Keyboard Shortcuts

### File Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + O` | Open file |
| `Ctrl/Cmd + E` | Extract selected |
| `Ctrl/Cmd + Shift + E` | Extract all |
| `Ctrl/Cmd + C` | Copy file |
| `Ctrl/Cmd + V` | Paste file |
| `Delete` | Delete selected |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Alt + ←` | Back |
| `Alt + →` | Forward |
| `Alt + ↑` | Parent directory |
| `Ctrl/Cmd + F` | Search |
| `Ctrl/Cmd + A` | Select all |

### Window Management

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + T` | New tab |
| `Ctrl/Cmd + W` | Close tab |
| `Ctrl/Cmd + Tab` | Next tab |
| `Ctrl/Cmd + Shift + Tab` | Previous tab |

### Application

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Q` | Quit application |
| `Ctrl/Cmd + ,` | Preferences |
| `F1` | Help/Documentation |
| `Ctrl/Cmd + H` | Show in Finder/Explorer |

## Common Workflows

### Workflow 1: Download Verification

1. Download an archive file from the internet
2. Right-click the downloaded file
3. Select "Compute Checksum"
4. Choose SHA256 algorithm
5. Compare result with provided checksum
6. ✅ If matches: File is authentic
7. ❌ If differs: File may be corrupted

### Workflow 2: Archive Exploration

1. Download a large archive (e.g., dataset)
2. Open archive in Rusty Compress
3. Browse through directory structure
4. Preview specific files of interest
5. Extract only what you need
6. Delete temporary extracted files when done

### Workflow 3: System Backup Verification

1. Locate backup archive
2. Open in Rusty Compress
3. Extract small test file
4. Compute checksum of extracted file
5. Compare with original file's checksum
6. Verify backup integrity

### Workflow 4: Android App Inspection

1. Locate `.apk` or `.xapk` file
2. Open in Rusty Compress
3. Browse application structure
4. Preview app icon and resources
5. Extract specific assets if needed
6. Verify app integrity before installation

## Tips and Tricks

### Performance Optimization

- **Large Archives**: Use the "Extract Selected" feature for partial extraction
- **Many Small Files**: Consider extracting to SSD for better performance
- **Network Storage**: Extract to local drive first, then move to network location

### Security Best Practices

- **Unknown Archives**: Extract to quarantine directory first
- **Executable Files**: Don't run executables from untrusted archives
- **Password Archives**: Use external tools for password-protected archives

### Workflow Efficiency

- **Recent Files**: Use recent files menu for quick access
- **Bookmarks**: Add frequently accessed folders to bookmarks (coming soon)
- **Default Destination**: Set default extraction location in preferences

## Troubleshooting

### Archive Won't Open

**Possible causes**:
- File is corrupted
- Unsupported archive format
- File is password-protected

**Solutions**:
- Verify file integrity with checksum
- Check supported formats
- Use specialized tools for encrypted archives

### Extraction Fails

**Common issues**:
- Insufficient disk space
- Permission denied
- Corrupted archive

**Fixes**:
- Free up disk space
- Run with admin privileges
- Verify archive integrity first

### Checksum Computation Stuck

**Troubleshoot**:
- Cancel and restart the operation
- Try a different algorithm
- Check system resources
- Verify file is accessible

<div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; margin-top: 2rem;">
    <div class="card-header">
        <h3 class="card-title" style="color: white;">🎓 Want to Learn More?</h3>
    </div>
    <p style="color: rgba(255,255,255,0.9);">Explore our advanced guides and API documentation to unlock the full potential of Rusty Compress.</p>
    <a href="/api.html" class="btn" style="background: white; color: #667eea;">API Reference</a>
    <a href="/development.html" class="btn" style="background: white; color: #667eea; margin-left: 0.5rem;">Development Guide</a>
</div>