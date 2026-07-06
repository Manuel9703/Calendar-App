import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const shouldRegisterSW = typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol !== 'file:';

if (shouldRegisterSW) {
  try {
    registerSW({
      immediate: true,
      onOfflineReady() {},
      onNeedRefresh() {},
    });
  } catch (error) {
    console.warn('Service worker registration skipped:', error);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
