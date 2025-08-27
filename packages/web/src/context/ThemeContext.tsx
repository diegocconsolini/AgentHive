import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeConfig } from '../types';

interface ThemeContextType {
  theme: ThemeConfig['mode'];
  setTheme: (theme: ThemeConfig['mode']) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeConfig['mode']>(() => {
    // Get theme from localStorage or default to 'system'
    const savedTheme = localStorage.getItem('theme') as ThemeConfig['mode'];
    return savedTheme || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  const setTheme = (newTheme: ThemeConfig['mode']) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const updateTheme = () => {
      let actualTheme = theme;
      
      if (theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      setIsDark(actualTheme === 'dark');
      
      if (actualTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};