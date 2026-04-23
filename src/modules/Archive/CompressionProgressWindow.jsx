import React, { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const CompressionProgressWindow = () => {
  const [progress, setProgress] = useState({
    percentage: 0,
    files_processed: 0,
    current_file: "",
    compression_ratio: 0.0
  });
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);

  useEffect(() => {
    // Listen for compression progress events
    const unlistenProgress = window.__TAURI__.event.listen(
      "compress-progress",
      (event) => {
        const data = event.payload;
        setProgress({
          percentage: data.percentage || 0,
          files_processed: data.files_processed || 0,
          current_file: data.current_file || "",
          compression_ratio: data.compression_ratio || 0.0
        });
      }
    );

    // Listen for completion event
    const unlistenComplete = window.__TAURI__.event.listen(
      "compress-complete",
      () => {
        setIsComplete(true);
        // Auto-close after 2 seconds
        setTimeout(() => {
          getCurrentWindow().close();
        }, 2000);
      }
    );

    // Listen for error event
    const unlistenError = window.__TAURI__.event.listen(
      "compress-error",
      (event) => {
        const errorMsg = event.payload || "Compression failed";
        let userMessage = "An error occurred during compression";

        // Provide user-friendly error messages
        if (typeof errorMsg === 'string') {
          if (errorMsg.includes("not found") || errorMsg.includes("File not found")) {
            userMessage = "One or more source files could not be found. Please check file paths.";
          } else if (errorMsg.includes("permission") || errorMsg.includes("access")) {
            userMessage = "Permission denied. Please check file permissions.";
          } else if (errorMsg.includes("disk") || errorMsg.includes("space")) {
            userMessage = "Insufficient disk space. Please free up disk space.";
          } else if (errorMsg.includes("7z")) {
            userMessage = "7-Zip tool is not available. Please install 7-Zip (p7zip) to continue.";
          } else if (errorMsg.includes("cancel")) {
            userMessage = "Compression was cancelled by the user.";
          } else {
            userMessage = errorMsg; // Use the error message directly
          }
        }

        setError(userMessage);
      }
    );

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-100 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <i className="ri-archive-add-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Creating Archive</h1>
              <p className="text-xs text-purple-100">Compressing files</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error ? (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-close-circle-line text-xl text-red-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : isComplete ? (
            /* Success State */
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-check-line text-xl text-green-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800 mb-1">Complete</h3>
                  <p className="text-sm text-green-700">Archive created successfully!</p>
                </div>
              </div>
            </div>
          ) : (
            /* Progress State */
            <>
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-purple-600">
                    {Math.round(progress.percentage)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current File */}
              {progress.current_file && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2">
                    <i className="ri-file-line text-purple-600"></i>
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">
                      {progress.current_file}
                    </span>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ri-file-list-3-line text-blue-600"></i>
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      Files Processed
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {progress.files_processed}
                  </p>
                </div>

                <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ri-shrink-line text-pink-600"></i>
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      Compression Ratio
                    </span>
                  </div>
                  <p className="text-lg font-bold text-pink-700">
                    {progress.compression_ratio > 0
                      ? `${progress.compression_ratio.toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Loading Animation */}
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <i className="ri-refresh-line text-xl text-white animate-spin"></i>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-center">
            {!isComplete && !error && (
              <p className="text-xs text-gray-500 text-center">
                Compressing files... Please wait
              </p>
            )}
            {isComplete && (
              <p className="text-xs text-gray-500 text-center">
                Closing automatically...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionProgressWindow;