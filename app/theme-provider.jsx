'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'meesh-theme-preference';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('dark');

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(STORAGE_KEY);

    if (storedPreference === 'light' || storedPreference === 'dark') {
      setTheme(storedPreference);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = (eventOrMediaQuery) => {
      const matches = eventOrMediaQuery.matches;
      setSystemTheme(matches ? 'dark' : 'light');
    };

    syncSystemTheme(mediaQuery);

    const handleChange = (event) => {
      syncSystemTheme(event);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === 'system' ? systemTheme : theme;

    root.dataset.theme = resolved;

    if (theme === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, systemTheme]);

  const value = useMemo(() => {
    const resolvedTheme = theme === 'system' ? systemTheme : theme;

    const toggleTheme = () => {
      const next = resolvedTheme === 'dark' ? 'light' : 'dark';
      setTheme(next);
    };

    return {
      theme,
      resolvedTheme,
      toggleTheme,
    };
  }, [theme, systemTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
