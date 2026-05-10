import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handling for module load issues or unhandled rejections
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: black; color: #ef4444; padding: 40px; font-family: monospace; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 20px;">Kritická chyba při startu :(</h1>
        <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #ef444433; max-width: 80%; text-align: left;">
          <p style="color: white; margin-bottom: 10px;">${message}</p>
          <p style="font-size: 10px; color: #6b7280;">Zdroj: ${source}:${lineno}:${colno}</p>
        </div>
        <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Zkusit znovu</button>
      </div>
    `;
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);