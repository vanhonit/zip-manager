import React from "react";

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

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

const PropertiesModal = ({ file, currentArchive, onClose }) => {
  const fileExtension = file.name.split(".").pop().toLowerCase();
  const isArchive = currentArchive && !file.is_dir;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                {file.is_dir ? (
                  <i className="ri-folder-fill text-2xl text-white"></i>
                ) : (
                  <i className="ri-file-line text-2xl text-white"></i>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">File Properties</h2>
                <p className="text-xs text-blue-100">View file details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
              title="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File Name */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
              Name
            </label>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
              <p className="text-sm font-medium text-gray-800 break-words">
                {file.name}
              </p>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                Type
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-800">
                  {file.is_dir ? "Folder" : fileExtension.toUpperCase() + " File"}
                </p>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                Size
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-800">
                  {file.is_dir ? "—" : formatFileSize(file.size)}
                </p>
              </div>
            </div>

            {/* Last Modified */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                Last Modified
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(file.last_modified)}
                </p>
              </div>
            </div>

            {/* Path */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                Path
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-800 break-all">
                  {file.path}
                </p>
              </div>
            </div>

            {/* MIME Type (if available) */}
            {file.mimetype && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  MIME Type
                </label>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-800 break-all">
                    {file.mimetype}
                  </p>
                </div>
              </div>
            )}

            {/* Archive Source (if in archive) */}
            {isArchive && (
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  Archive Source
                </label>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-medium text-gray-800 break-all">
                    {currentArchive}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {file.is_dir && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-2">
                <i className="ri-information-line text-indigo-600 text-lg mt-0.5"></i>
                <div>
                  <p className="text-sm font-medium text-indigo-900">
                    Directory
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    This is a folder containing other files and subdirectories.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesModal;