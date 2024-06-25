import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Header from './components/header';
import ProductList from './components/productList';
import Login from './components/login';
import { useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './index';
import CustomScreeners from './components/customScreener';
import ErrorBoundary from './errorBoundary'

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [inputData, setInputData] = useState([]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const handleDataSelect = (data) => {
    setInputData(data);
  };

  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainContent />} />
          <Route path="/custom-screeners" element={<CustomScreeners />} />
        </Routes>
      </BrowserRouter>
    </MsalProvider>
  );
};

const MainContent = ({ toggleDarkMode }) => (
  <ErrorBoundary>
  <div>
    <Header toggleDarkMode={toggleDarkMode} />
    <div>
      <ProductList />
    </div>
  </div>
  </ErrorBoundary>
);

export default App;
