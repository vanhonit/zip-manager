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
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-500 bg-opacity-20 rounded-lg">
            <i className="ri-download-cloud-line text-blue-400 text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xs font-bold text-white">Extracting Archive</h1>
            <p className="text-xs text-slate-400 truncate">{fileName}</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-2 p-2 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
          <p className="text-red-300 text-xs font-medium">Error</p>
          <p className="text-red-200 text-xs mt-0.5">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-300">Progress</span>
          <span className="text-xs font-semibold text-blue-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Files Counter */}
      <div className="text-xs text-slate-400 mb-3">
        <span className="font-medium text-slate-300">{filesExtracted}</span>{" "}
        files extracted
      </div>

      {/* Status Messages */}
      <div className="space-y-2 flex-1">
        {!isComplete && !error && (
          <div className="flex items-start gap-2 p-2 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-20">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-blue-300">Extracting files...</p>
          </div>
        )}

        {isComplete && (
          <div className="flex items-start gap-2 p-2 bg-green-500 bg-opacity-10 rounded-lg border border-green-500 border-opacity-20">
            <i className="ri-check-line text-green-400 text-lg flex-shrink-0"></i>
            <p className="text-xs text-green-300 font-medium">
              Extraction complete!
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-500 bg-opacity-10 rounded-lg border border-red-500 border-opacity-20">
            <i className="ri-close-line text-red-400 text-lg flex-shrink-0"></i>
            <p className="text-xs text-red-300 font-medium">
              Extraction failed
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 text-xs text-slate-500 border-t border-slate-700 pt-2">
        <p>Extracting to your selected destination...</p>
      </div>
    </div>
  );
}

export default ProgressWindow;
