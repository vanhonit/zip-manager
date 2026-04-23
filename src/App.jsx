import React, { useState } from 'react';
import ProgressWindow from './modules/Extract/ProgressWindow';
import FileManager from './modules/FileManager';
import { TabProvider } from './contexts/TabContext';
// import './App.css';

function RustyCompress() {
  const urlParams = new URLSearchParams(window.location.search);
  const windowLabel = urlParams.get("label");
  const windowName = urlParams.get("name");

  if (windowLabel === "progress") {
    return <ProgressWindow name={windowName} />;
  }

  return (
    <TabProvider>
      <FileManager />
    </TabProvider>
  );
}

export default RustyCompress;