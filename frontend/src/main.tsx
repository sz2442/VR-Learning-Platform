import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme from store
const theme = JSON.parse(localStorage.getItem('vr-meta-ui') || '{}')?.state?.theme || 'system';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = theme === 'dark' || (theme === 'system' && systemDark);
document.documentElement.classList.toggle('dark', isDark);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
