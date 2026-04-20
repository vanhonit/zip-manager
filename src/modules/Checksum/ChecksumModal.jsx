import React, { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const ALGORITHMS = [
  { key: "md5", label: "MD5" },
  { key: "sha1", label: "SHA-1" },
  { key: "sha256", label: "SHA-256" },
  { key: "sha512", label: "SHA-512" },
];

function HashRow({ algo, filePath, onCopy, copiedField }) {
  const [hash, setHash] = useState(null);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const unlistenRef = useRef(null);

  const compute = useCallback(async () => {
    setComputing(true);
    setProgress(0);
    setError(null);
    setHash(null);

    const eventName = `checksum-progress-${algo.key}`;
    const unlisten = listen(eventName, (event) => {
      setProgress(event.payload);
    });
    unlistenRef.current = unlisten;

    try {
      const result = await invoke("compute_checksum", {
        filePath,
        algorithm: algo.key,
      });
      setHash(result.hash);
    } catch (err) {
      setError(err || "Failed to compute checksum");
    } finally {
      setComputing(false);
      const fn = await unlistenRef.current;
      if (fn) fn();
      unlistenRef.current = null;
    }
  }, [algo.key, filePath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current.then((fn) => fn());
      }
    };
  }, []);

  return (
    <div
      className={`
        border-2 rounded-xl p-3 sm:p-4 transition-all duration-300
        ${hash ? "bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200 hover:border-indigo-300" : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"}
        ${computing ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md shadow-blue-100" : "hover:shadow-lg"}
        ${error ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`p-1 sm:p-1.5 rounded-lg ${hash ? 'bg-indigo-100' : 'bg-gray-100'} transition-colors`}>
            <i className={`ri-shield-check-line ${hash ? 'text-indigo-600' : 'text-gray-500'} text-base sm:text-lg`}></i>
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
            {algo.label}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {hash && !computing && (
            <button
              onClick={() => onCopy(hash, algo.key)}
              className={`
                flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold
                transition-all duration-300 border-2
                ${
                  copiedField === algo.key
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-white text-gray-600 border-gray-200 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                }
              `}
              title="Copy to clipboard"
            >
              {copiedField === algo.key ? (
                <>
                  <i className="ri-check-line text-sm sm:text-base"></i>
                  <span className="hidden sm:inline">Copied</span>
                  <span className="sm:hidden">Copied</span>
                </>
              ) : (
                <>
                  <i className="ri-file-copy-line text-sm sm:text-base"></i>
                  <span className="hidden sm:inline">Copy</span>
                  <span className="sm:hidden">Copy</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={compute}
            disabled={computing}
            className={`
              flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold border-2
              transition-all duration-300
              ${
                computing
                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 border-blue-300 cursor-wait"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 hover:from-indigo-600 hover:to-purple-700 hover:shadow-md active:scale-95"
              }
            `}
            title={`Compute ${algo.label} checksum`}
          >
            {computing ? (
              <>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="font-semibold text-xs sm:text-xs">{progress}%</span>
              </>
            ) : (
              <>
                <i className="ri-play-fill text-sm sm:text-base"></i>
                <span className="hidden sm:inline">{hash ? "Recompute" : "Compute"}</span>
                <span className="sm:hidden">{hash ? "Re" : "Go"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar while computing */}
      {computing && (
        <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden mb-2 sm:mb-3">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-md shadow-indigo-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Hash value or placeholder */}
      {hash && !computing && (
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm overflow-hidden">
          <p
            className="text-xs sm:text-sm font-mono text-gray-800 break-all leading-tight sm:leading-relaxed select-all"
            title={hash}
          >
            {hash}
          </p>
        </div>
      )}
      {error && !computing && (
        <div className="bg-red-50 rounded-lg p-2 sm:p-3 border border-red-200">
          <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
      {!hash && !computing && !error && (
        <div className="text-center py-3 sm:py-4 bg-white rounded-lg border border-dashed border-gray-300">
          <i className="ri-cursor-line text-xl sm:text-2xl text-gray-300 mb-1 sm:mb-2"></i>
          <p className="text-xs sm:text-sm text-gray-400">
            Click Compute to generate {algo.label} hash
          </p>
        </div>
      )}
    </div>
  );
}

function ChecksumModal({ filePath, onClose }) {
  const [copiedField, setCopiedField] = useState(null);
  const fileName = filePath.split("/").filter(Boolean).pop() || filePath;

  const copyToClipboard = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-md sm:max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 border-b border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-shield-check-line text-lg sm:text-2xl text-white"></i>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-white">Checksum</h2>
                <p
                  className="text-xs sm:text-sm text-blue-100 truncate max-w-[150px] sm:max-w-[300px]"
                  title={filePath}
                >
                  {fileName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <i className="ri-close-line text-base sm:text-xl"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-5 space-y-2 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {ALGORITHMS.map((algo) => (
            <HashRow
              key={algo.key}
              algo={algo}
              filePath={filePath}
              onCopy={copyToClipboard}
              copiedField={copiedField}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-200">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-600 flex-1">
              <i className="ri-information-line mr-1 sm:mr-1.5 text-indigo-500"></i>
              <span className="hidden sm:inline">Click Compute on the algorithm you need</span>
              <span className="sm:hidden">Click Compute on algorithm</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:from-gray-300 hover:to-gray-400 transition-all duration-300 shadow-md hover:shadow-lg shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChecksumModal;
