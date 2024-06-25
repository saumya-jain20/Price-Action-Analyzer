import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client'; // Import createRoot from react-dom/client
import './index.css';
import { EventType, PublicClientApplication } from '@azure/msal-browser';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import { msalConfig } from './auth-config';
import theme from './theme';

export const msalInstance = new PublicClientApplication(msalConfig);

if (
  !msalInstance.getActiveAccount() &&
  msalInstance.getAllAccounts().length > 0
) {
  msalInstance.setActiveAccount(msalInstance.getActiveAccount()[0]);
}

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
    window.location.href = '/';
  }
});

const Root = () => (
  // <ThemeProvider theme={theme}>
    <div>
      <App instance={msalInstance} />
    </div>
    //  </ThemeProvider>
);

// Get the root element
const container = document.getElementById('root');

// Create a root
const root = createRoot(container);

// Initial render
root.render(<Root />);
