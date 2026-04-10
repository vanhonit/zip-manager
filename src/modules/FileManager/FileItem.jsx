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
          flex items-center px-6 py-3 border-b border-gray-100
          cursor-pointer transition-all duration-200 ease-in-out
          ${bgClass}
          ${
            selected
              ? "border-l-4 border-l-blue-500 shadow-sm"
              : "border-l-4 border-l-transparent"
          }
          ${isOpening ? "opacity-60 pointer-events-none" : ""}
          hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
          hover:shadow-md hover:z-10
        `}
        onClick={handleRowClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Checkbox Column */}
        <div className="w-5 mr-4 flex items-center justify-center">
          <div
            onClick={handleCheckboxClick}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              transition-all duration-200 cursor-pointer
              ${
                selected
                  ? "bg-blue-500 border-blue-500 shadow-sm"
                  : "bg-white border-gray-300 hover:border-blue-400"
              }
            `}
          >
            {selected && <i className="ri-check-line text-white"></i>}
          </div>
        </div>

        {/* File Icon and Name */}
        <div className="flex-1 flex items-center min-w-0 group">
          <div className="w-6 h-6 mr-3 flex items-center justify-center flex-shrink-0">
            <FileIcon
              extension={fileExtension}
              width={24}
              height={24}
              isDir={file.is_dir}
            />
          </div>

          <div className="relative flex-1 min-w-0">
            <p
              ref={fileNameRef}
              className={`
                text-sm font-medium truncate
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
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {fileExtension.toUpperCase()}
            </span>
          )}
        </div>

        {/* Date Modified Column */}
        <div className="w-40 hidden md:block">
          <p
            className={`text-xs ${selected ? "text-blue-800" : "text-gray-500"}`}
          >
            {file.last_modified}
          </p>
        </div>

        {/* Type Column */}
        <div className="w-32 hidden lg:block">
          <p
            className={`text-xs truncate ${selected ? "text-blue-800" : "text-gray-500"}`}
            title={applicationName}
          >
            {applicationName}
          </p>
        </div>

        {/* Size Column */}
        <div className="w-28 text-right">
          <span
            className={`text-sm font-medium ${selected ? "text-blue-900" : "text-gray-600"}`}
          >
            {file.is_dir ? (
              <span className="text-gray-400 text-xs">—</span>
            ) : (
              formatFileSize(file.size)
            )}
          </span>
        </div>

        {/* Loading or Selection indicator */}
        {isOpening && (
          <div className="ml-3 flex-shrink-0">
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {!isOpening && selected && (
          <div className="ml-3 flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Image Preview on Hover */}
      {showPreview && isImage && !file.is_dir && (
        <div className="fixed z-50 pointer-events-none transform -translate-x-1/2 left-1/2 top-20">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-300 p-2 max-w-md">
            <div className="text-xs text-gray-600 mb-2 px-2 font-medium">
              Preview: {file.name}
            </div>
            <div className="bg-gray-100 rounded flex items-center justify-center p-4 max-h-64">
              {previewLoading ? (
                <div className="text-gray-400 text-sm flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-xs mt-2">Loading...</p>
                </div>
              ) : previewImage ? (
                <img
                  src={previewImage}
                  alt={file.name}
                  className="max-w-full max-h-64 rounded object-contain"
                />
              ) : (
                <div className="text-gray-400 text-sm">
                  <i className="ri-image-line text-4xl mx-auto"></i>
                  <p className="text-xs mt-2">Image preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu Placeholder */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
            <i className="ri-eye-line"></i>
            Open
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
            <i className="ri-file-line"></i>
            Properties
          </button>
          <hr className="my-1 border-gray-200" />
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors">
            <i className="ri-delete-bin-line"></i>
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default FileItem;
