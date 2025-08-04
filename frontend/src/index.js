import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './main/App.jsx';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

registerServiceWorker();
