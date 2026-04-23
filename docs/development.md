---
layout: page
title: Development
subtitle: Contribute to Rusty Compress development
---

## Development Environment

This guide will help you set up a development environment and contribute to Rusty Compress.

## Prerequisites

Before starting development, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Rust** (latest stable)
- **Git**
- **Code Editor** (VS Code recommended)

### Recommended Tools

- **VS Code** with extensions:
  - Tauri Extension Pack
  - Rust Analyzer
  - ESLint
  - Prettier

## Setting Up Development Environment

### Step 1: Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/rusty-compress.git
cd rusty-compress

# Add upstream repository
git remote add upstream https://github.com/vanhonit/rusty-compress.git
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust tools (if not already installed)
rustup update
rustup component add rustfmt clippy
```

### Step 3: Configure Development

```bash
# Install VS Code extensions (optional)
code --install-extension tauri-apps.tauri-vscode
code --install-extension rust-lang.rust-analyzer
```

## Project Structure

```
rusty-compress/
├── src/                      # React Frontend
│   ├── components/           # Reusable components
│   ├── modules/              # Feature modules
│   └── main.jsx              # Entry point
├── src-tauri/                # Rust Backend
│   ├── src/
│   │   ├── lib.rs           # Main Tauri commands
│   │   ├── data_type.rs     # Shared types
│   │   ├── utils.rs         # Utilities
│   │   ├── file_manager.rs  # File operations
│   │   ├── zip.rs           # ZIP handler
│   │   ├── tar.rs           # TAR handler
│   │   └── rar.rs           # RAR handler
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
└── docs/                    # Jekyll documentation
    ├── _layouts/
    ├── _includes/
    └── assets/
```

## Development Workflow

### Running Development Server

```bash
# Full Tauri development mode
npm run tauri dev

# Frontend only (faster for UI changes)
npm run dev
```

### Building for Testing

```bash
# Build React frontend
npm run build

# Build Rust backend
cd src-tauri
cargo build
```

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd src-tauri
cargo test

# Run specific test
cargo test test_read_directory
```

## Frontend Development

### React Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const MyComponent = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const result = await invoke('read_directory', { path: '/tmp' });
      setFiles(result);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? <div>Loading...</div> : (
        <ul>
          {files.map(file => (
            <li key={file.path}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyComponent;
```

### State Management Patterns

```jsx
// Local component state
const [currentPath, setCurrentPath] = useState('/');
const [selectedFiles, setSelectedFiles] = useState([]);

// Derived state
const selectedCount = selectedFiles.length;
const isDirectoryEmpty = files.length === 0;
```

### Event Handling

```jsx
import { listen } from '@tauri-apps/api/event';

const useProgressListener = (eventName, callback) => {
  useEffect(() => {
    let unlisten;

    const setupListener = async () => {
      unlisten = await listen(eventName, (event) => {
        callback(event.payload);
      });
    };

    setupListener();
    return () => unlisten?.();
  }, [eventName, callback]);
};

// Usage in component
const MyComponent = () => {
  const [progress, setProgress] = useState(0);

  useProgressListener('extract-progress', (data) => {
    const percentage = (data.current / data.total) * 100;
    setProgress(percentage);
  });

  return <progress value={progress} max={100} />;
};
```

## Backend Development

### Adding New Tauri Commands

```rust
// src-tauri/src/lib.rs

use tauri::State;

#[tauri::command]
async fn my_new_command(param: String) -> Result<String, String> {
    // Your logic here
    Ok(format!("Processed: {}", param))
}

// Register the command
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            my_new_command,
            read_directory,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Data Types

```rust
// src-tauri/src/data_type.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_directory: bool,
    pub modified: String,
    pub file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionProgress {
    pub current: u64,
    pub total: u64,
    pub filename: String,
}
```

### Error Handling

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ArchiveError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Archive corrupted: {0}")]
    ArchiveCorrupted(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

// Convert to Tauri-compatible error
impl From<ArchiveError> for String {
    fn from(error: ArchiveError) -> Self {
        error.to_string()
    }
}
```

## Testing

### Frontend Testing

```javascript
// src/components/__tests__/Tab.test.jsx
import { render, screen } from '@testing-library/react';
import Tab from '../Tab';

describe('Tab Component', () => {
  test('renders tab content', () => {
    render(<Tab title="Test Tab" />);
    expect(screen.getByText('Test Tab')).toBeInTheDocument();
  });
});
```

### Backend Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_read_directory() {
        let result = read_directory("/tmp").await;
        assert!(result.is_ok());
        let files = result.unwrap();
        assert!(!files.is_empty());
    }

    #[tokio::test]
    async fn test_extract_files() {
        let archive_path = "test_data/test.zip";
        let output_path = "/tmp/test_extraction";
        let result = extract_files(
            &app_handle(),
            archive_path,
            output_path,
            vec![]
        ).await;
        assert!(result.is_ok());
    }
}
```

## Code Quality

### Linting

```bash
# Frontend linting
npm run lint

# Backend linting
cd src-tauri
cargo clippy

# Fix issues automatically
cargo clippy --fix
```

### Formatting

```bash
# Format Rust code
cd src-tauri
cargo fmt

# Format JavaScript/JSX
npm run format
```

## Performance Optimization

### Rust Performance

```rust
// Use async for blocking operations
#[tauri::command]
async fn heavy_computation() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        // CPU-intensive work here
        heavy_operation()
    }).await.map_err(|e| e.to_string())?
}

// Use efficient data structures
use std::collections::HashMap;

// Avoid unnecessary clones
fn process_data(data: &Vec<String>) -> String {
    data.iter()
        .map(|s| s.len())
        .sum::<usize>()
        .to_string()
}
```

### React Performance

```jsx
// Memoize expensive calculations
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

## Debugging

### Frontend Debugging

```jsx
// Add console logging
useEffect(() => {
  console.log('Component mounted', { files, path });
}, [files, path]);

// Debug Tauri commands
const result = await invoke('my_command', { param: 'test' });
console.log('Command result:', result);
```

### Backend Debugging

```rust
// Use logging
use log::{info, debug, error};

#[tauri::command]
async fn my_function() -> Result<String, String> {
    info!("Starting my_function");
    debug!("Processing data");
    
    let result = process_data();
    
    info!("Function completed successfully");
    Ok(result)
}

// Add logging to Cargo.toml
[dependencies]
log = "0.4"
env_logger = "0.10"
```

### Tauri DevTools

```bash
# Enable detailed logging
RUST_LOG=debug npm run tauri dev

# View logs in terminal
# Inspect React DevTools in browser
# Use Tauri API for native debugging
```

## Building for Distribution

```bash
# Build for production
npm run tauri build

# Build for specific platform
npm run tauri build -- --target x86_64-pc-windows-msvc
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## Contributing Guidelines

### Before You Start

1. Check existing issues and pull requests
2. Discuss major changes in an issue first
3. Follow the existing code style
4. Write tests for new features

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for 7z archives
fix: resolve extraction progress issue
docs: update installation guide
refactor: simplify file manager component
test: add integration tests for checksum computation
```

### Pull Request Process

1. Create a feature branch
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes
   ```bash
   # Make changes
   npm test
   cargo test
   cargo clippy
   ```

3. Commit your changes
   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```

4. Push to your fork
   ```bash
   git push origin feature/my-feature
   ```

5. Create pull request
   - Describe your changes
   - Link related issues
   - Add screenshots for UI changes

## Documentation

### Code Comments

```rust
/// Reads the contents of a directory
///
/// # Arguments
/// * `path` - The absolute path to the directory
///
/// # Returns
/// A vector of `FileInfo` structs representing directory contents
///
/// # Errors
/// Returns an error if the directory doesn't exist or lacks permissions
#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
    // Implementation
}
```

### API Documentation

Keep the API documentation up to date:
- Add examples for new commands
- Document parameter types
- Describe error cases
- Update type definitions

## Getting Help

### Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Project Issues](https://github.com/vanhonit/rusty-compress/issues)

### Community

- GitHub Discussions
- Stack Overflow (tauri tag)
- Discord server (if available)

<div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; margin-top: 2rem;">
    <div class="card-header">
        <h3 class="card-title" style="color: white;">🚀 Ready to Contribute?</h3>
    </div>
    <p style="color: rgba(255,255,255,0.9);">We welcome contributions from developers of all skill levels. Check out our open issues and start making a difference!</p>
    <a href="https://github.com/vanhonit/rusty-compress/issues" class="btn" style="background: white; color: #667eea;">Find Issues to Work On</a>
    <a href="/contributing.html" class="btn" style="background: white; color: #667eea; margin-left: 0.5rem;">Contributing Guide</a>
</div>