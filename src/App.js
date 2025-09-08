import React from 'react';
import AppRouter from './components/Router/AppRouter';
import { UserProvider } from './contexts/UserContext';
import './App.css';

function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  );
}

export default App;
