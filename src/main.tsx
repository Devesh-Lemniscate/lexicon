import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initializeTheme } from './store/themeStore';
import { registerServiceWorker } from './utils/serviceWorker';

// Initialize theme before render to prevent flash
initializeTheme();

// Register service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/lexicon">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
