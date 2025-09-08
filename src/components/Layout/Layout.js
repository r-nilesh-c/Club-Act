import React from 'react';
import Header from '../Header/Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
