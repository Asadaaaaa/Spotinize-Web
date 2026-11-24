import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { DialogProvider } from './hooks/useDialog.jsx';
import { LanguageProvider } from './hooks/useLanguage.jsx';
import './styles/globals.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
