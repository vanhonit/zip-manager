import React, { useState, useEffect } from "react";
import { listen, emit } from "@tauri-apps/api/event";

function ProgressWindow({ name }) {
  const [progress, setProgress] = useState(0);
  const [filesExtracted, setFilesExtracted] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const fileName = urlParams.get("fileName");

  useEffect(() => {
    const unlistenProgress = listen("extract-progress", (event) => {
      const progressData = event.payload;
      if (
        typeof progressData === "object" &&
        progressData.files !== undefined
      ) {
        setProgress(progressData.percentage || 0);
        setFilesExtracted(progressData.files || 0);
      } else {
        setProgress(progressData || 0);
      }
    });

    const unlistenComplete = listen("extract-complete", () => {
      setIsComplete(true);
      setProgress(100);
      setTimeout(() => {
        window.close();
      }, 1200);
    });

    const unlistenError = listen("extract-error", (event) => {
      setError(event.payload);
    });

    emit(`${name}://ready`, null);

    return () => {
      Promise.all([unlistenProgress, unlistenComplete, unlistenError]).then(
        (unsubs) => {
          unsubs.forEach((unsub) => unsub?.());
        },
      );
    };
  }, [name]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-3 sm:p-4 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
            <i className="ri-download-cloud-line text-white text-xl sm:text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white mb-0.5 sm:mb-1">Extracting Archive</h1>
            <p className="text-xs text-slate-400 truncate">{fileName}</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="shrink-0 mb-3 sm:mb-4 p-2 sm:p-3 bg-red-500 bg-opacity-10 border-2 border-red-500 border-opacity-30 rounded-xl animate-pulse">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="ri-error-warning-line text-sm text-white"></i>
            </div>
            <div className="flex-1">
              <p className="text-red-300 text-xs sm:text-sm font-bold mb-1">Extraction Failed</p>
              <p className="text-red-200 text-xs sm:text-sm">{error}</p>
              {error.toLowerCase().includes("password") && (
                <p className="text-red-300 text-xs sm:text-sm mt-2">
                  Please try again with the correct password.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="shrink-0 mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-xs sm:text-sm font-bold text-slate-300">Progress</span>
          <span className="text-xs sm:text-sm font-bold text-blue-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 sm:h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 h-full transition-all duration-500 ease-out rounded-full shadow-lg shadow-blue-500/50"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Files Counter */}
      <div className="shrink-0 text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
        <i className="ri-file-zip-line text-blue-400 text-sm sm:text-base"></i>
        <span className="font-bold text-slate-300">{filesExtracted}</span>
        <span>files extracted</span>
      </div>

      {/* Status Messages */}
      <div className="flex-1 space-y-2 sm:space-y-3 overflow-y-auto">
        {!isComplete && !error && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-500 bg-opacity-10 rounded-xl border-2 border-blue-500 border-opacity-20">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-blue-300 font-medium">Extracting files...</p>
              <p className="text-xs text-blue-400 mt-1">Please wait while we process your files</p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500 bg-opacity-10 rounded-xl border-2 border-green-500 border-opacity-20">
            <i className="ri-checkbox-circle-line text-green-400 text-xl sm:text-2xl flex-shrink-0"></i>
            <div>
              <p className="text-xs sm:text-sm text-green-300 font-bold">Extraction complete!</p>
              <p className="text-xs text-green-400 mt-1">All files have been extracted successfully</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-500 bg-opacity-10 rounded-xl border-2 border-red-500 border-opacity-20">
            <i className="ri-error-warning-line text-red-400 text-xl sm:text-2xl flex-shrink-0"></i>
            <div>
              <p className="text-xs sm:text-sm text-red-300 font-bold">Extraction failed</p>
              <p className="text-xs text-red-400 mt-1">Please check the error message above</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="shrink-0 mt-2 sm:mt-4 text-xs text-slate-500 border-t border-slate-700 pt-2 sm:pt-3">
        <p>Extracting to your selected destination...</p>
      </div>
    </div>
  );
}

export default ProgressWindow;
