import React from "react";
import FileItem from "./FileItem";

const FileList = ({
  files,
  selectedFiles,
  onOpenFile,
  onSelect,
  isLoading,
  currentArchive,
  onShowProperties,
  onCreateArchive,
}) => {
  const selectedCount = selectedFiles?.length || 0;
  const totalCount = files?.length || 0;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse bg-gradient-to-b from-gray-50 to-white">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="flex items-center px-4 sm:px-6 py-2 sm:py-4 border-b border-gray-100"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded mr-3 sm:mr-4"></div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded mr-3 sm:mr-4"></div>
          <div className="flex-1 flex gap-2 sm:gap-4">
            <div className="w-1/3 h-3 sm:h-4 bg-gray-200 rounded"></div>
            <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded"></div>
            <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-200 rounded"></div>
            <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="mb-4 sm:mb-6 relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
          <i className="ri-folder-open-line text-3xl sm:text-4xl text-blue-500"></i>
        </div>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
        No Files Found
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 text-center max-w-sm sm:max-w-md leading-relaxed">
        This directory is empty. Navigate to a different location or open an
        archive to view its contents.
      </p>
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm">
          <i className="ri-folder-5-line text-sm sm:text-base"></i>
          <span>Browse directories</span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs sm:text-sm">
          <i className="ri-archive-2-line text-sm sm:text-base"></i>
          <span>Open archive</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="shrink-0 sticky top-0 z-10 bg-gradient-to-b from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-md">
        <div className="flex items-center px-4 sm:px-6 py-2 sm:py-4">
          {/* Checkbox Column */}
          <div className="w-5 mr-3 sm:mr-4">
            <div className="w-5 h-5"></div>
          </div>

          {/* Icon Column */}
          <div className="w-5 sm:w-6 mr-3 sm:mr-4"></div>

          {/* Name Column */}
          <div className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Name
            </span>
            <i className="ri-arrow-up-down-line text-blue-400 text-sm cursor-pointer hover:text-blue-600 transition-colors"></i>
          </div>

          {/* Date Modified Column */}
          <div className="w-28 sm:w-40 hidden md:block">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Date Modified
            </span>
          </div>

          {/* Type Column */}
          <div className="w-24 sm:w-32 hidden lg:block">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Type
            </span>
          </div>

          {/* Size Column */}
          <div className="w-20 sm:w-28 text-right">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Size
            </span>
          </div>
        </div>
      </div>

      {/* File List Container with Custom Scrollbar */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#93c5fd #f0f9ff",
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
                onShowProperties={onShowProperties}
                onCreateArchive={onCreateArchive}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalCount === 0 && <EmptyState />}
      </div>

      {/* Custom scrollbar styles for webkit browsers */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f0f9ff;
          border-radius: 6px;
        }
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%);
          border-radius: 6px;
          border: 2px solid #f0f9ff;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
        }
      `}</style>
    </div>
  );
};

export default FileList;
