import React, { useEffect, useState } from 'react';
import Login from './Login';
import InventoryDashboard from './InventoryDashboard';
import { hasAuthSession } from './api';

function App() {
  const [page, setPage] = useState(() => (hasAuthSession() ? 'dashboard' : 'login'));
  const [theme, setTheme] = useState(() => localStorage.getItem('stockTheme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('stockTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (page === 'dashboard' && !hasAuthSession()) {
      setPage('login');
    }
  }, [page]);

  if (page === 'login') return <Login mode="login" setPage={setPage} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'signup') return <Login mode="signup" setPage={setPage} theme={theme} toggleTheme={toggleTheme} />;
  if (page === 'dashboard') return <InventoryDashboard setPage={setPage} theme={theme} toggleTheme={toggleTheme} />;
  return <Login mode="login" setPage={setPage} theme={theme} toggleTheme={toggleTheme} />;
}

export default App;
