import React, { useState, useEffect, useRef } from "react";

const PasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  error: initialError = null,
  isLoading = false
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset password when modal opens/closes
    if (!isOpen) {
      setPassword("");
      setError(null);
    }
  }, [isOpen]);

  // Update error when initialError changes
  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password.trim());
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <i className="ri-lock-2-line text-xl text-white"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Archive Password</h2>
                <p className="text-xs text-blue-100">Enter password to extract files</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              title="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2 animate-pulse">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-error-warning-line text-sm text-red-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-800 font-medium">Password Error</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null); // Clear error when user starts typing
                }}
                placeholder="Enter archive password"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`text-xl ${showPassword ? "ri-eye-off-line" : "ri-eye-line"}`}></i>
              </button>
            </div>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="ri-information-line text-sm text-blue-600"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-800">
                This archive is password-protected. Please enter the correct password to extract the files.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed border-2 border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 border-2 border-transparent"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-refresh-line animate-spin"></i>
                  <span>Verifying...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-unlock-line"></i>
                  <span>Extract</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;