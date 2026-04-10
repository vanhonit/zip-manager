import React from "react";
import FileItem from "./FileItem";

const FileList = ({
  files,
  selectedFiles,
  onOpenFile,
  onSelect,
  isLoading,
  currentArchive,
}) => {
  const selectedCount = selectedFiles?.length || 0;
  const totalCount = files?.length || 0;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="flex items-center px-6 py-4 border-b border-gray-100"
        >
          <div className="w-5 h-5 bg-gray-200 rounded mr-4"></div>
          <div className="w-6 h-6 bg-gray-200 rounded mr-4"></div>
          <div className="flex-1 flex gap-4">
            <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 text-gray-300">
        <i className="ri-folder-open-line text-6xl"></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        No Files Found
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        This directory is empty. Navigate to a different location or open an
        archive to view its contents.
      </p>
    </div>
  );

  return (
    <div className="bg-white">
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-gray-100 border-b-2 border-gray-300 shadow-sm">
        <div className="flex items-center px-6 py-3">
          {/* Checkbox Column */}
          <div className="w-5 mr-4">
            <div className="w-5 h-5"></div>
          </div>

          {/* Icon Column */}
          <div className="w-6 mr-4"></div>

          {/* Name Column */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Name
            </span>
            <i className="ri-arrow-up-down-line text-gray-400 text-sm"></i>
          </div>

          {/* Date Modified Column */}
          <div className="w-40 hidden md:block">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Date Modified
            </span>
          </div>

          {/* Type Column */}
          <div className="w-32 hidden lg:block">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Type
            </span>
          </div>

          {/* Size Column */}
          <div className="w-28 text-right">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Size
            </span>
          </div>
        </div>
      </div>

      {/* File List Container with Custom Scrollbar */}
      <div
        className="max-h-[calc(100vh-270px)] min-h-[300px] overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e0 #f7fafc",
        }}
      >
        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* File Items */}
        {!isLoading && totalCount > 0 && (
          <div>
            {files.map((file, index) => (
              <FileItem
                key={`${file.path}-${index}`}
                file={file}
                index={index}
                selected={selectedFiles.some(
                  (selectedFile) => selectedFile.path === file.path,
                )}
                onOpenFile={onOpenFile}
                onSelect={onSelect}
                currentArchive={currentArchive}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalCount === 0 && <EmptyState />}
      </div>

      {/* Footer with file count */}
      {totalCount > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-semibold text-gray-700">
                  {totalCount}
                </span>{" "}
                {totalCount === 1 ? "item" : "items"}
              </span>
              {selectedCount > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>
                    <span className="font-semibold text-blue-600">
                      {selectedCount}
                    </span>{" "}
                    selected
                  </span>
                </>
              )}
            </div>
            <div className="text-gray-500">
              Double-click to open • Click to select
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles for webkit browsers */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default FileList;
