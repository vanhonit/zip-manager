---
layout: page
title: Features
subtitle: Powerful archive management capabilities
---

## Archive Format Support

Rusty Compress supports a wide range of archive formats, making it your one-stop solution for all archive management needs.

### ZIP-based Formats

| Format | Description | Extensions |
|--------|-------------|------------|
| **ZIP** | Standard ZIP archive format | `.zip` |
| **JAR** | Java Archive files | `.jar` |
| **APK** | Android application packages | `.apk` |
| **XAPK** | Android expanded app packages | `.xapk` |
| **IPA** | iOS application packages | `.ipa` |

### TAR-based Formats

| Format | Description | Extensions |
|--------|-------------|------------|
| **TAR** | Unix tar archive format | `.tar` |
| **TAR.GZ** | Gzip-compressed tar archive | `.tar.gz` |
| **TGZ** | Alternative gzip-compressed tar | `.tgz` |
| **TAR.BZ2** | Bzip2-compressed tar archive | `.tar.bz2` |
| **TBZ2** | Alternative bzip2-compressed tar | `.tbz2` |

### RAR Format

| Format | Description | Extensions |
|--------|-------------|------------|
| **RAR** | Roshal Archive format | `.rar` |

## Core Features

### 🗂️ Unified File System Interface

- **Dual-State Browsing**: Seamlessly switch between filesystem directories and archive contents
- **Breadcrumb Navigation**: Easy navigation with clear path indicators
- **Quick File Selection**: Click to select, Ctrl/Cmd+Click for multiple selection
- **File Preview**: View file details and metadata before extraction

### 📤 Smart Extraction

- **Selective Extraction**: Extract specific files or entire archives
- **Progress Tracking**: Real-time updates with detailed progress information
- **Destination Management**: Choose any location for extracted files
- **Error Handling**: Comprehensive error reporting with recovery suggestions

### 🔍 File Preview

- **Image Preview**: View images directly from archives without extraction
- **Metadata Display**: See file sizes, types, and modification dates
- **Quick View**: Open files in your system default viewer
- **Data URL Support**: Efficient image handling for thumbnails

### 🔐 Checksum Verification

- **Multiple Algorithms**: Support for MD5, SHA1, SHA256, and SHA512
- **Batch Processing**: Compute checksums for multiple files simultaneously
- **Progress Updates**: Real-time progress reporting for large files
- **Result Comparison**: Easy comparison of computed checksums

### 🚀 Performance Optimization

- **Native Rust Backend**: Lightning-fast archive operations
- **Async Processing**: Non-blocking interface for large file operations
- **Memory Efficient**: Optimized memory usage for large archives
- **Caching**: Intelligent caching for improved responsiveness

## User Interface Features

### Intuitive Navigation

- **Tab System**: Multiple tabs for different files/archives
- **Keyboard Shortcuts**: Power-user support with customizable hotkeys
- **Drag and Drop**: Easy file and archive handling
- **Context Menus**: Right-click options for common actions

### Visual Feedback

- **Progress Indicators**: Clear progress bars and status updates
- **Status Messages**: Informative notifications for all operations
- **Error Alerts**: User-friendly error messages with solutions
- **Success Confirmations**: Clear completion notifications

### Accessibility

- **High Contrast**: Clear, readable interface elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Compatible with assistive technologies
- **Adjustable Sizing**: Responsive design for different screen sizes

## System Integration

### File Associations

- **Automatic Registration**: Handle supported file types automatically
- **System Integration**: Works with your operating system's file manager
- **Double-Click Support**: Open archives directly from file browser
- **Context Menu Integration**: Quick access from right-click menus

### Cross-Platform Compatibility

- **Windows**: Full Windows integration with native look and feel
- **macOS**: macOS-specific features and optimizations
- **Linux**: Comprehensive Linux distribution support
- **Consistent Behavior**: Same functionality across all platforms

## Advanced Features

### Archive Browsing

- **Hierarchical View**: See nested directory structures clearly
- **File Sorting**: Sort by name, size, type, or date
- **Filter Options**: Show/hide hidden files and system files
- **Search Functionality**: Find files within archives quickly

### File Management

- **Extraction Options**: Maintain permissions, timestamps, and attributes
- **Path Preservation**: Keep original directory structures
- **Conflict Resolution**: Smart handling of existing files
- **Batch Operations**: Process multiple files at once

### Customization

- **Theme Support**: Light and dark mode options
- **Preference Settings**: Configurable behavior and appearance
- **Window Management**: Remember window size and position
- **Recent Files**: Quick access to recently opened archives

## Upcoming Features

Our roadmap includes exciting new capabilities:

- **Encrypted Archives**: Support for password-protected archives
- **Archive Creation**: Create new archives with various formats
- **Split Archives**: Handle multi-part archive files
- **Batch Extraction**: Extract from multiple archives at once
- **Archive Search**: Advanced search across multiple archives
- **Custom Themes**: User-defined interface themes
- **Plugin System**: Extend functionality with plugins

<div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
    <div class="card-header">
        <h3 class="card-title" style="color: white;">🚀 Help Shape the Future</h3>
    </div>
    <p style="color: rgba(255,255,255,0.9);">Have a feature idea or enhancement suggestion? We'd love to hear from you! Your feedback helps us prioritize and improve Rusty Compress.</p>
    <a href="https://github.com/vanhonit/zip-manager/issues" class="btn" style="background: white; color: #667eea;">Suggest a Feature</a>
</div>