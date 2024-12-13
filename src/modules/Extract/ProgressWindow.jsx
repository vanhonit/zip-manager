import React, { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

function ProgressWindow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unlisten = listen("extract-progress", (event) => {
      consolelog(event);
      setProgress(event.payload); // Update progress from the backend
    });

    return () => {
      unlisten.then((unsub) => unsub());
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50">
      <h1 className="text-xl font-bold mb-4">Extraction Progress</h1>
      <div className="w-3/4 bg-gray-200 rounded-full h-4">
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