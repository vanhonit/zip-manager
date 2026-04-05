import React, { useState, useEffect } from "react";
import { listen, emit } from "@tauri-apps/api/event";


function ProgressWindow({ name }) {
  const [progress, setProgress] = useState(0);
  const urlParams = new URLSearchParams(window.location.search);
  const fileName = urlParams.get("fileName");

  useEffect(() => {
    const unlisten = listen("extract-progress", (event) => {
      setProgress(event.payload); // Update progress from the backend
    });
    emit(`${name}://ready`, null); // Notify the backend that the window is ready
    return () => {
      unlisten.then((unsub) => unsub());
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <h1 className="text-m font-bold mb-4 ">{fileName} Extracting...</h1>
      <div className="bg-gray-200 rounded-full h-4">
        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm">{progress}%</p>

    </div>
  );
}

export default ProgressWindow;