import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean; // resolved actual dark state
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: false,
});

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return mode === 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
    // Migrate old 'theme' key
    const legacy = localStorage.getItem('theme');
    if (legacy === 'dark') return 'dark';
    if (legacy === 'light') return 'light';
    return 'system';
  });

  const [isDark, setIsDark] = useState(() => resolveIsDark(mode));

  const applyTheme = useCallback((m: ThemeMode) => {
    const dark = resolveIsDark(m);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('theme-mode', m);
    localStorage.setItem('theme', resolveIsDark(m) ? 'dark' : 'light'); // keep legacy key in sync
    applyTheme(m);
  }, [applyTheme]);

  // Apply on mount
  useEffect(() => {
    applyTheme(mode);
  }, []);

  // Listen for OS preference changes when in system mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, applyTheme]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
