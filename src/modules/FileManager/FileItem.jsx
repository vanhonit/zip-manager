import React, { useState, useRef, useEffect } from "react";
import { resolveMime } from "friendly-mimes";
import { Tooltip } from "react-tooltip";
import { invoke } from "@tauri-apps/api/core";

// Map file extensions to Remix Icon
const getFileIcon = (extension, isDir) => {
  const ext = extension.toLowerCase();
  const iconClassName = "text-xl";

  if (isDir) {
    return <i className={`ri-folder-fill ${iconClassName} text-blue-600`}></i>;
  }

  // Archive files
  if (
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz", "tbz2"].includes(ext)
  ) {
    return <i className={`ri-file-zip-line ${iconClassName} text-red-600`}></i>;
  }

  // PDF
  if (ext === "pdf") {
    return <i className={`ri-file-pdf-line ${iconClassName} text-red-700`}></i>;
  }

  // Word documents
  if (["doc", "docx", "odt"].includes(ext)) {
    return (
      <i className={`ri-file-word-line ${iconClassName} text-blue-700`}></i>
    );
  }

  // Spreadsheets
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
    return (
      <i className={`ri-file-excel-line ${iconClassName} text-green-700`}></i>
    );
  }

  // Presentations
  if (["ppt", "pptx", "odp"].includes(ext)) {
    return (
      <i
        className={`ri-presentation-2-line ${iconClassName} text-orange-700`}
      ></i>
    );
  }

  // Text files
  if (["txt", "md", "log", "cfg", "conf", "ini"].includes(ext)) {
    return (
      <i className={`ri-file-text-line ${iconClassName} text-gray-700`}></i>
    );
  }

  // Code files
  if (
    [
      "js",
      "py",
      "html",
      "css",
      "jsx",
      "tsx",
      "ts",
      "java",
      "cpp",
      "c",
      "sh",
      "json",
      "xml",
    ].includes(ext)
  ) {
    return <i className={`ri-code-line ${iconClassName} text-purple-700`}></i>;
  }

  // Image files
  if (
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "svg",
      "ico",
      "tiff",
      "raw",
      "webp",
    ].includes(ext)
  ) {
    return <i className={`ri-image-line ${iconClassName} text-yellow-600`}></i>;
  }

  // Audio files
  if (
    ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "mid"].includes(
      ext,
    )
  ) {
    return (
      <i className={`ri-music-2-line ${iconClassName} text-indigo-600`}></i>
    );
  }

  // Video files
  if (
    [
      "mp4",
      "mov",
      "avi",
      "mkv",
      "wmv",
      "flv",
      "webm",
      "mpeg",
      "mpg",
      "mov",
    ].includes(ext)
  ) {
    return <i className={`ri-movie-2-line ${iconClassName} text-pink-600`}></i>;
  }

  // Binary/Executable files
  if (["exe", "dll", "bin", "app", "dmg", "apk"].includes(ext)) {
    return (
      <i className={`ri-terminal-box-line ${iconClassName} text-gray-800`}></i>
    );
  }

  // Default file icon
  return <i className={`ri-file-line ${iconClassName} text-gray-600`}></i>;
};

// A utility function to get the icon for a file type
const FileIcon = ({ extension, isDir, ...rest }) => {
  return getFileIcon(extension, isDir);
};

// Extract the file extension
const getFileExtension = (fileName) => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
};

// Utility to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 bytes";

  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// Check if file is an image
const isImageFile = (mimeType) => {
  return mimeType?.startsWith("image/");
};

const FileItem = ({
  file,
  index,
  selected = false,
  onSelect,
  onOpenFile,
  currentArchive,
  onShowProperties,
  onCreateArchive,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileNameRef = useRef(null);

  const fileExtension = getFileExtension(file.name);
  let applicationName = "";
  let isImage = false;

  try {
    applicationName = file.is_dir ? "Folder" : resolveMime(file.mimetype).name;
    isImage = isImageFile(file.mimetype);
  } catch (error) {
    applicationName = "Unknown";
  }

  // Check if filename is overflowing
  useEffect(() => {
    if (fileNameRef.current) {
      const isOverflow =
        fileNameRef.current.scrollWidth > fileNameRef.current.clientWidth;
      setIsOverflowing(isOverflow);
    }
  }, [file.name]);

  // Fetch image preview when hovering
  useEffect(() => {
    if (showPreview && isImage && currentArchive && !file.is_dir) {
      setPreviewLoading(true);
      invoke("get_image_preview", {
        archivePath: currentArchive,
        filePath: file.path.replace(/\/$/, ""),
      })
        .then((data) => {
          setPreviewImage(data);
          setPreviewLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load image preview:", err);
          setPreviewLoading(false);
        });
    } else {
      setPreviewImage(null);
    }
  }, [showPreview, file, currentArchive, isImage]);

  // Handle checkbox click
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelect(file);
  };

  // Handle row click
  const handleRowClick = () => {
    onSelect(file);
  };

  // Handle double click
  const handleDoubleClick = async () => {
    setIsOpening(true);
    try {
      await onOpenFile(file);
    } finally {
      setIsOpening(false);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  // Alternating row colors
  const isEven = index % 2 === 0;
  const bgClass = selected
    ? "bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50"
    : isEven
      ? "bg-white"
      : "bg-gray-50";

  return (
    <>
      <div
        className={`
          flex items-center px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-100
          cursor-pointer transition-all duration-300 ease-in-out
          ${bgClass}
          ${
            selected
              ? "border-l-3 sm:border-l-4 border-l-blue-500 shadow-md"
              : "border-l-3 sm:border-l-4 border-l-transparent hover:border-l-blue-200"
          }
          ${isOpening ? "opacity-60 pointer-events-none" : ""}
          hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
          hover:shadow-lg hover:z-10 hover:-translate-y-px
        `}
        onClick={handleRowClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Checkbox Column */}
        <div className="w-4 sm:w-5 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0">
          <div
            onClick={handleCheckboxClick}
            className={`
              relative w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 flex items-center justify-center
              transition-all duration-300 cursor-pointer
              ${
                selected
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-md"
                  : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm"
              }
            `}
          >
            {selected && (
              <i className="ri-check-line text-white text-xs sm:text-sm relative z-10"></i>
            )}
          </div>
        </div>

        {/* File Icon and Name */}
        <div className="flex-1 flex items-center min-w-0 group">
          <div className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
            <FileIcon
              extension={fileExtension}
              width={20}
              height={20}
              isDir={file.is_dir}
            />
          </div>

          <div className="relative flex-1 min-w-0">
            <p
              ref={fileNameRef}
              className={`
                text-xs sm:text-sm font-medium truncate
                ${selected ? "text-blue-900" : "text-gray-800"}
                group-hover:text-blue-700
              `}
              data-tooltip-content={file.name}
              data-tooltip-id={`tooltip-${file.path}-${index}`}
            >
              {file.name}
            </p>
            {isOverflowing && (
              <Tooltip
                id={`tooltip-${file.path}-${index}`}
                place="top"
                type="dark"
                delayShow={500}
              />
            )}
          </div>

          {/* File type badge for selected items */}
          {selected && !file.is_dir && (
            <span className="ml-1 sm:ml-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold rounded-full shadow-sm border border-blue-200">
              {fileExtension.toUpperCase()}
            </span>
          )}
        </div>

        {/* Date Modified Column */}
        <div className="w-24 sm:w-40 hidden md:block">
          <p
            className={`text-xs font-medium ${selected ? "text-blue-800" : "text-gray-500"}`}
          >
            {file.last_modified}
          </p>
        </div>

        {/* Type Column */}
        <div className="w-20 sm:w-32 hidden lg:block">
          <p
            className={`text-xs font-medium truncate ${selected ? "text-blue-800" : "text-gray-500"}`}
            title={applicationName}
          >
            {applicationName}
          </p>
        </div>

        {/* Size Column */}
        <div className="w-16 sm:w-28 text-right">
          <span
            className={`text-xs sm:text-sm font-bold ${selected ? "text-blue-900" : "text-gray-600"}`}
          >
            {file.is_dir ? (
              <span className="text-gray-400 text-xs font-medium">—</span>
            ) : (
              formatFileSize(file.size)
            )}
          </span>
        </div>

        {/* Loading or Selection indicator */}
        {isOpening && (
          <div className="ml-2 sm:ml-3 flex-shrink-0">
            <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {!isOpening && selected && (
          <div className="ml-2 sm:ml-3 flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse shadow-md"></div>
          </div>
        )}
      </div>

      {/* Image Preview on Hover */}
      {showPreview && isImage && !file.is_dir && (
        <div className="fixed z-50 pointer-events-none transform -translate-x-1/2 left-1/2 top-24">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-3 max-w-md backdrop-blur-sm bg-white/95">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <i className="ri-image-line text-blue-500"></i>
                <span className="text-xs font-bold text-gray-800">Preview</span>
              </div>
              <span className="text-xs text-gray-500 truncate max-w-[200px]" title={file.name}>
                {file.name}
              </span>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl flex items-center justify-center p-6 max-h-72 min-h-[200px]">
              {previewLoading ? (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-medium text-gray-600">Loading preview...</p>
                </div>
              ) : previewImage ? (
                <img
                  src={previewImage}
                  alt={file.name}
                  className="max-w-full max-h-72 rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <i className="ri-image-line text-5xl mx-auto text-gray-300 mb-2"></i>
                  <p className="text-xs text-gray-500">Unable to load preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 py-2 min-w-[220px] overflow-hidden"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onOpenFile(file);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 flex items-center gap-3 transition-all duration-200"
          >
            <i className="ri-eye-line text-blue-500"></i>
            <span className="font-medium">Open</span>
          </button>
          <button
            onClick={() => {
              onShowProperties(file);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 flex items-center gap-3 transition-all duration-200"
          >
            <i className="ri-file-info-line text-indigo-500"></i>
            <span className="font-medium">Properties</span>
          </button>
          {onCreateArchive && (
            <button
              onClick={() => {
                onCreateArchive(file);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 flex items-center gap-3 transition-all duration-200"
            >
              <i className="ri-archive-add-line text-purple-500"></i>
              <span className="font-medium">Create Archive</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default FileItem;
