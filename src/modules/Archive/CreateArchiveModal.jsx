import React, { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

// Validation utilities
const validateArchiveName = (name) => {
  if (!name || name.trim() === "") {
    return { valid: false, error: "Archive name is required" };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: "Archive name contains invalid characters: <>:\"|?*" };
  }

  // Check for reserved names
  const reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3"];
  const baseName = name.split('.')[0].toUpperCase();
  if (reservedNames.includes(baseName)) {
    return { valid: false, error: `"${baseName}" is a reserved name in Windows` };
  }

  // Check for reasonable length
  if (name.length > 255) {
    return { valid: false, error: "Archive name is too long (max 255 characters)" };
  }

  return { valid: true, error: null };
};

const CreateArchiveModal = ({
  selectedFiles,
  currentPath,
  onClose,
  onSuccess
}) => {
  const [archiveName, setArchiveName] = useState("");
  const [destinationFolder, setDestinationFolder] = useState(currentPath || "");
  const [archiveFormat, setArchiveFormat] = useState("zip");
  const [compressionLevel, setCompressionLevel] = useState(6);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  // Format descriptions
  const formatOptions = [
    {
      value: "zip",
      label: "ZIP",
      description: "Universal format, good compression, widely supported",
      extension: ".zip"
    },
    {
      value: "tar",
      label: "TAR",
      description: "Unix format, no compression, preserves permissions",
      extension: ".tar"
    },
    {
      value: "tar.gz",
      label: "TAR.GZ",
      description: "Gzipped TAR, good compression, Linux standard",
      extension: ".tar.gz"
    },
    {
      value: "tar.bz2",
      label: "TAR.BZ2",
      description: "Bzip2-compressed TAR, better compression than gzip",
      extension: ".tar.bz2"
    },
    {
      value: "7z",
      label: "7-Zip",
      description: "High compression, multiple algorithms, Windows/Linux",
      extension: ".7z"
    }
  ];

  // Compression level presets
  const compressionPresets = [
    { value: 0, label: "None", description: "No compression, fastest" },
    { value: 1, label: "Fast", description: "Best speed, good compression" },
    { value: 6, label: "Normal", description: "Balanced speed and compression" },
    { value: 9, label: "Maximum", description: "Best compression, slowest" }
  ];

  // Set default archive name when modal opens
  useEffect(() => {
    if (selectedFiles.length === 1) {
      // Use selected file/folder name as default
      const name = selectedFiles[0].split('/').pop().replace(/\.[^.]+$/, '');
      setArchiveName(name);
    } else {
      // Use timestamp for multiple files
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      setArchiveName(`archive-${timestamp}`);
    }
  }, [selectedFiles]);

  // Auto-update archive name when format changes
  useEffect(() => {
    const currentFormat = formatOptions.find(f => f.value === archiveFormat);
    if (currentFormat && archiveName && !archiveName.endsWith(currentFormat.extension)) {
      // Remove any existing extension and add the correct one
      const baseName = archiveName.replace(/\.(zip|tar|tar\.gz|tar\.bz2|7z)$/i, '');
      setArchiveName(baseName + currentFormat.extension);
    }
  }, [archiveFormat]);

  const handleBrowseDestination = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Destination Folder"
    });

    if (selected) {
      setDestinationFolder(selected);
    }
  };

  const handleCreateArchive = async () => {
    // Validate archive name
    const nameValidation = validateArchiveName(archiveName);
    if (!nameValidation.valid) {
      setError(nameValidation.error);
      return;
    }

    // Validate destination folder
    if (!destinationFolder.trim()) {
      setError("Destination folder is required");
      return;
    }

    // Validate file selection
    if (selectedFiles.length === 0) {
      setError("No files selected for archiving");
      return;
    }

    // Check if files exist
    try {
      for (const file of selectedFiles) {
        const exists = await invoke("path_exists", { path: file });
        if (!exists) {
          setError(`File not found: ${file.split('/').pop()}`);
          return;
        }
      }
    } catch (err) {
      setError(`Failed to validate files: ${err.message || err}`);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Map format to backend ArchiveFormat enum
      const formatMap = {
        "zip": "zip",
        "tar": "tar",
        "tar.gz": "tar",
        "tar.bz2": "tar",
        "7z": "7z"
      };

      const backendFormat = formatMap[archiveFormat] || "zip";
      const outputPath = `${destinationFolder}/${archiveName}`;

      // Check for overwriting existing file
      const archiveExists = await invoke("path_exists", { path: outputPath });
      if (archiveExists) {
        setError(`Archive "${archiveName}" already exists in the destination folder. Please choose a different name or delete the existing file.`);
        return;
      }

      await invoke("create_archive", {
        files: selectedFiles,
        outputPath,
        archiveFormat: backendFormat,
        compressionLevel
      });

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error("Archive creation error:", err);
      // Provide user-friendly error messages
      let userMessage = "Failed to create archive";
      if (err.message) {
        if (err.message.includes("not found")) {
          userMessage = "One or more files could not be found. Please check file paths and try again.";
        } else if (err.message.includes("permission") || err.message.includes("access")) {
          userMessage = "Permission denied. You may not have the required permissions to access some files.";
        } else if (err.message.includes("disk") || err.message.includes("space")) {
          userMessage = "Not enough disk space available. Please free up disk space and try again.";
        } else if (err.message.includes("7z")) {
          userMessage = "7-Zip tool is not installed. Please install 7-Zip (p7zip) to use this feature.";
        }
      } else if (typeof err === 'string' && err.includes("Failed to create archive")) {
        userMessage = err; // Use the backend error message directly
      }

      setError(userMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isCreating) {
      onClose();
    }
  };

  const currentFormat = formatOptions.find(f => f.value === archiveFormat);
  const currentPreset = compressionPresets.find(p => p.value === compressionLevel);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-100 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <i className="ri-archive-add-line text-2xl text-white"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Archive</h2>
                <p className="text-xs text-purple-100">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isCreating}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-alert-line text-base text-red-600"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded"
              >
                <i className="ri-close-line text-base"></i>
              </button>
            </div>
          )}

          {/* Archive Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Archive Name
            </label>
            <input
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              disabled={isCreating}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter archive name"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Archive Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formatOptions.map((format) => (
                <button
                  key={format.value}
                  onClick={() => !isCreating && setArchiveFormat(format.value)}
                  disabled={isCreating}
                  className={`
                    relative group p-4 rounded-xl border-2 transition-all duration-300
                    ${archiveFormat === format.value
                      ? 'border-purple-400 bg-purple-50 shadow-md hover:border-purple-500 hover:shadow-lg'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className={`ri-file-${format.value === '7z' ? 'zip' : format.value.replace('.', '-')}-line text-xl text-purple-600`}></i>
                      <span className="font-semibold text-gray-800">{format.label}</span>
                    </div>
                    {archiveFormat === format.value && (
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-xs"></i>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {format.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Compression Level */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Compression Level
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                  disabled={isCreating}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-700">{compressionLevel}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {compressionPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => !isCreating && setCompressionLevel(preset.value)}
                    disabled={isCreating}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-300
                      ${compressionLevel === preset.value
                        ? 'border-purple-400 bg-purple-600 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {currentPreset && (
                <p className="text-xs text-gray-500 text-center">
                  {currentPreset.description}
                </p>
              )}
            </div>
          </div>

          {/* Destination Folder */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Destination Folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destinationFolder}
                onChange={(e) => setDestinationFolder(e.target.value)}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Select destination folder"
              />
              <button
                onClick={handleBrowseDestination}
                disabled={isCreating}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-2 border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Browse"
              >
                <i className="ri-folder-open-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* File List Preview */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Files to Archive ({selectedFiles.length})
            </label>
            <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-xl border-2 border-gray-200 p-3 space-y-1">
              {selectedFiles.slice(0, 10).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700 truncate">
                  <i className="ri-file-line text-gray-400 flex-shrink-0"></i>
                  <span className="truncate">{file}</span>
                </div>
              ))}
              {selectedFiles.length > 10 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  ... and {selectedFiles.length - 10} more files
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateArchive}
              disabled={isCreating}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium text-sm hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="ri-archive-add-line"></i>
                  Create Archive
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateArchiveModal;