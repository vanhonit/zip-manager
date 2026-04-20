import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// import FileManager from "./modules/FileManager";

// import { emit } from "@tauri-apps/api/event";

// window.addEventListener("DOMContentLoaded", async () => {
//   await emit("frontend-ready");
// });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
