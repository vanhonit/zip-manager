import React, { useState } from 'react';
import ProgressWindow from './modules/Extract/ProgressWindow';
import FileManager from './modules/FileManager';
// import './App.css';

function RustyCompress() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowLabel = urlParams.get("label");
  console.log(windowLabel);
  if (windowLabel === "progress") {
    return <ProgressWindow />;
  }

  return <FileManager />;
}

export default RustyCompress;