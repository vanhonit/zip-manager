# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rusty Compress is a desktop archive manager built with Tauri (Rust backend) and React (frontend). It provides a unified interface for browsing, extracting, and managing various archive formats including ZIP, TAR, and RAR archives.

## Common Development Commands

### Running the Application
- `npm run dev` - Start development server (runs Vite dev server on port 1420)
- `npm run tauri dev` - Run full Tauri development mode (builds Rust backend and React frontend)
- `npm run build` - Build React frontend for production
- `npm run tauri build` - Build complete application for distribution

### Backend Development
- `cd src-tauri && cargo build` - Build Rust backend
- `cd src-tauri && cargo test` - Run Rust tests
- `cd src-tauri && cargo clippy` - Run linter on Rust code

### Frontend Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build production React bundle
- `npm run preview` - Preview production build

## Architecture

### High-Level Structure
- **Frontend**: React 18 with Vite, located in `/src`
- **Backend**: Rust with Tauri 2.x, located in `/src-tauri/src`
- **Communication**: Tauri commands expose Rust functions to React via `@tauri-apps/api/core/invoke`

### Frontend Architecture
The React frontend is modular with three main components:

1. **FileManager** (`/src/modules/FileManager/`)
   - Main interface for browsing filesystem and archives
   - Handles file selection, navigation breadcrumbs, and toolbar actions
   - Manages dual state: filesystem paths and archive paths

2. **Extract** (`/src/modules/Extract/`)
   - ProgressWindow.jsx: Displays extraction progress in a separate window
   - Handles real-time progress updates from backend events

3. **Checksum** (`/src/modules/Checksum/`)
   - ChecksumModal.jsx: Modal interface for computing file checksums
   - Supports MD5, SHA1, SHA256, and SHA512 algorithms

### Backend Architecture
The Rust backend uses a modular design with separate modules for each archive type:

1. **Core Modules**:
   - `lib.rs`: Main Tauri entry point, command handlers, and app state management
   - `data_type.rs`: Shared data structures (FileInfo, ExtractionConfig, SingleChecksum)
   - `utils.rs`: Archive type detection and utility functions
   - `file_manager.rs`: Filesystem operations (read_directory, open_file)

2. **Archive Handlers**:
   - `zip.rs`: ZIP-based archive handling (zip, jar, apk, xapk, ipa)
   - `tar.rs`: TAR-based archive handling (tar, tar.gz, tgz, tar.bz2, tbz2)
   - `rar.rs`: RAR archive handling via unrar library

### Archive Type Detection
The system uses an `ArchiveType` enum in `utils.rs` to identify formats:
- **ZIP-based**: zip, jar, apk, xapk, ipa (handled by zip.rs)
- **TAR-based**: tar, tar.gz, tgz, tar.bz2, tbz2 (handled by tar.rs)
- **RAR-based**: rar (handled by rar.rs)

Detection checks compound extensions first (.tar.gz, .tar.bz2) then simple extensions.

## Key Tauri Commands

The backend exposes these commands to the frontend:

1. **`read_directory(path)`** - List files in a filesystem directory
2. **`open_file(path)`** - Open a file with the system default application
3. **`archive_file_details(archive_path, file_path, state)`** - Get contents of an archive, optionally filtered by subdirectory
4. **`extract_files(app_handle, archive_path, output_path, selected_files)`** - Extract files from archive to destination
5. **`view_file_in_archive(archive_path, file_name, state)`** - View a specific file from archive in system viewer
6. **`get_image_preview(archive_path, file_path)`** - Get image preview from archive (returns data URL)
7. **`compute_checksum(app_handle, file_path, algorithm)`** - Compute checksum with progress reporting

## Important Patterns

### Async File Operations
Long-running operations (extraction, checksum) use:
- `tauri::async_runtime::spawn_blocking` for CPU-bound work
- Progress events emitted via `app_handle.emit()`
- Separate progress windows for extraction tasks

### Temporary File Management
- App uses `tempfile::TempDir` for managing temporary files
- Temp directory stored in `AppTempDir` state
- Cleanup happens on window close event

### Event Communication
- Backend emits events: `extract-complete`, `extract-error`, `checksum-progress-{algorithm}`
- Frontend listens via `@tauri-apps/api/event` module
- File opening on all platforms: `file-open` event emitted when user double-clicks files

### State Management
- Frontend: React hooks (useState, useEffect) for local component state
- Backend: Tauri State for shared state (temp directory)
- Archive paths: Dual state tracking (filesystem vs archive internal paths)

## File Associations

The app is configured to handle these file types via system file managers:
- **ZIP archives**: zip, jar, apk, xapk, ipa
- **TAR archives**: tar, tgz, tar.gz, tbz2, tar.bz2
- **RAR archives**: rar

## Build Configuration

- **Development**: Runs Vite dev server on port 1420, HMR on port 1421
- **Production**: Builds React bundle to `/dist`, Tauri expects frontend dist at `../dist`
- **Window Config**: 800x650 fixed-size window, not resizable
- **Single Instance**: Uses `tauri-plugin-single-instance` to prevent multiple app instances

## Development Notes

- The app uses Vite with React and Tailwind CSS
- All archive operations go through unified interface with type detection
- Progress reporting is chunked (5% increments) for checksum operations
- Image previews extracted from archives return data URLs for frontend display
- Temporary files are automatically cleaned up when windows close