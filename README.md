# Rusty Compress

A modern, cross-platform desktop archive manager built with Tauri (Rust backend) and React (frontend). Rusty Compress provides a unified, efficient interface for browsing, extracting, and managing various archive formats including ZIP, TAR, and RAR archives.

![Rusty Compress Logo](src-tauri/icons/icon.png)

## Features

- **Multi-Format Support**: Handle ZIP, JAR, APK, XAPK, IPA, TAR, TAR.GZ, TGZ, TAR.BZ2, TBZ2, and RAR archives
- **Unified Interface**: Browse both filesystem directories and archive contents seamlessly
- **File Extraction**: Extract individual files or entire archives with progress tracking
- **Preview Capabilities**: View images directly from archives without full extraction
- **Checksum Verification**: Compute MD5, SHA1, SHA256, and SHA512 checksums with real-time progress
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **System Integration**: Automatic file associations for supported archive types
- **Efficient Performance**: Rust backend for fast archive operations

## Screenshots

<!-- Add screenshots here when available -->
*Main Interface*
*Archive Browsing*
*Extraction Progress*

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Rust** (latest stable) - [Install via rustup](https://www.rust-lang.org/tools/install)
- **System Dependencies**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: Build essentials and libwebkit2gtk (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))
  - **Windows**: Microsoft C++ Build Tools and WebView2

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/rusty-compress.git
cd rusty-compress
```

### Install Dependencies

```bash
npm install
```

## Development

### Start Development Server

Run the full Tauri development environment (recommended):

```bash
npm run tauri dev
```

This will:
- Build the Rust backend
- Start the Vite development server (port 1420)
- Launch the application window with hot-reload enabled

### Frontend-Only Development

For frontend-only changes:

```bash
npm run dev
```

This starts the Vite dev server on port 1420 with HMR on port 1421.

### Backend Development

Build and test the Rust backend:

```bash
cd src-tauri
cargo build
cargo test
cargo clippy
```

## Building for Production

### Build React Frontend

```bash
npm run build
```

### Build Complete Application

```bash
npm run tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer and `.msi`
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## Project Structure

```
zip-manager/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── Tab.jsx              # Tab component for file/archive views
│   │   └── TabBar.jsx           # Tab bar management
│   ├── modules/                 # Feature modules
│   │   ├── FileManager/         # Main file browsing interface
│   │   ├── Extract/             # Extraction progress window
│   │   └── Checksum/            # Checksum computation modal
│   ├── index.css                # Global styles
│   └── main.jsx                 # React entry point
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── lib.rs              # Main Tauri entry point
│   │   ├── data_type.rs        # Shared data structures
│   │   ├── utils.rs            # Archive type detection
│   │   ├── file_manager.rs     # Filesystem operations
│   │   ├── zip.rs              # ZIP archive handler
│   │   ├── tar.rs              # TAR archive handler
│   │   └── rar.rs              # RAR archive handler
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── package.json                 # Node.js dependencies
└── CLAUDE.md                   # Project documentation
```

## Usage

### Opening Archives

1. **File Association**: Double-click any supported archive file in your file manager
2. **In-App**: Use the file browser to navigate to archives and open them

### Extracting Files

1. Browse to an archive and select files you want to extract
2. Click the "Extract" button in the toolbar
3. Choose destination directory
4. Monitor progress in the extraction window

### Computing Checksums

1. Select a file or multiple files
2. Click the "Checksum" button
3. Choose your preferred algorithm (MD5, SHA1, SHA256, SHA512)
4. View real-time progress and results

### Previewing Images

- Double-click image files within archives to preview them
- Images are extracted temporarily and displayed in your system viewer

## Tauri Commands

The backend exposes these commands to the frontend:

| Command | Description |
|---------|-------------|
| `read_directory(path)` | List files in a filesystem directory |
| `open_file(path)` | Open a file with the system default application |
| `archive_file_details(archive_path, file_path, state)` | Get contents of an archive, optionally filtered by subdirectory |
| `extract_files(app_handle, archive_path, output_path, selected_files)` | Extract files from archive to destination |
| `view_file_in_archive(archive_path, file_name, state)` | View a specific file from archive in system viewer |
| `get_image_preview(archive_path, file_path)` | Get image preview from archive (returns data URL) |
| `compute_checksum(app_handle, file_path, algorithm)` | Compute checksum with progress reporting |

## Development Notes

### Architecture

- **Frontend**: React 18 with Vite, Tailwind CSS for styling
- **Backend**: Rust with Tauri 2.x for native desktop capabilities
- **Communication**: Tauri commands expose Rust functions to React
- **State Management**: React hooks for frontend, Tauri State for backend

### Key Patterns

- **Async Operations**: Long-running tasks use `tauri::async_runtime::spawn_blocking`
- **Progress Reporting**: Events emitted via `app_handle.emit()`
- **Temporary Files**: Managed with `tempfile::TempDir`, auto-cleanup on window close
- **File Associations**: Configured in `tauri.conf.json`

### Testing

```bash
# Frontend tests (if configured)
npm test

# Backend tests
cd src-tauri
cargo test
```

### Code Quality

```bash
# Rust linter
cd src-tauri
cargo clippy

# Frontend linter (if configured)
npm run lint
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## File Type Support

### ZIP-based Formats
- `.zip` - Standard ZIP archives
- `.jar` - Java archives
- `.apk` - Android application packages
- `.xapk` - Android expanded app packages
- `.ipa` - iOS application packages

### TAR-based Formats
- `.tar` - Tar archives
- `.tar.gz`, `.tgz` - Gzipped tar archives
- `.tar.bz2`, `.tbz2` - Bzip2 compressed tar archives

### RAR Format
- `.rar` - RAR archives

## Troubleshooting

### Build Issues

**Rust compilation fails:**
```bash
rustup update
cargo clean
cargo build
```

**Frontend dependencies fail:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

**Archive not opening:**
- Ensure file format is supported
- Check file permissions
- Verify file is not corrupted

**Extraction fails:**
- Check disk space
- Verify write permissions to destination
- Ensure archive is password-free (encrypted archives not yet supported)

## Roadmap

- [ ] Support for encrypted archives (password-protected ZIP, RAR)
- [ ] Archive creation and compression
- [ ] Split archive handling
- [ ] Batch extraction from multiple archives
- [ ] Archive search functionality
- [ ] Custom themes and UI customization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Framework for building desktop apps
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Rust](https://www.rust-lang.org/) - Backend language

## Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/rusty-compress/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/your-username/rusty-compress/discussions)

---

Built with ❤️ using Tauri and React
