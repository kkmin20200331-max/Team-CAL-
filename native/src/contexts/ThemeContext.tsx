import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = '시스템 설정' | '라이트 모드' | '다크 모드' | string;

interface ThemeContextProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  colors: {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    primary: string;
    primaryDark: string;
    primaryLight: string;
    danger: string;
    dangerLight: string;
    warning: string;
    warningLight: string;
    disabled: string;
    modalBg: string;
  };
}

const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('시스템 설정');

  const isDarkMode =
    themeMode === '다크 모드' ||
    (themeMode === '시스템 설정' && systemColorScheme === 'dark');

  const colors = useMemo(
    () => ({
      background: isDarkMode ? '#0B0F19' : '#F8FAFC',
      card: isDarkMode ? '#151B2E' : '#FFFFFF',
      text: isDarkMode ? '#F8FAFC' : '#0F172A',
      subText: isDarkMode ? '#94A3B8' : '#64748B',
      border: isDarkMode ? '#1F293D' : '#E2E8F0',
      primary: '#10B981',
      primaryDark: '#059669',
      primaryLight: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
      danger: '#EF4444',
      dangerLight: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
      warning: '#F59E0B',
      warningLight: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
      disabled: isDarkMode ? '#1F293D' : '#E2E8F0',
      modalBg: isDarkMode ? '#13182C' : '#FFFFFF',
    }),
    [isDarkMode],
  );

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
