import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MerchantProvider } from './context/MerchantContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MerchantProvider>
      <App />
    </MerchantProvider>
  </React.StrictMode>
);
