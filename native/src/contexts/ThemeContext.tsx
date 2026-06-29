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
    sunday: string;
    saturday: string;
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
      background: isDarkMode ? '#1C1C1E' : '#EEF5DD',
      card: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      subText: isDarkMode ? '#AAAAAA' : '#606060',
      border: isDarkMode ? '#3A3A3C' : '#E2E8F0',
      primary: '#00A200',
      primaryDark: '#008200',
      primaryLight: isDarkMode ? 'rgba(0,162,0,0.12)' : '#F2F8E8',
      danger: '#EF4444',
      dangerLight: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
      warning: '#F59E0B',
      warningLight: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
      disabled: isDarkMode ? '#3A3A3C' : '#E2E8F0',
      modalBg: isDarkMode ? '#2C2C2E' : '#FFFFFF',
      sunday: isDarkMode ? '#F87171' : '#EF4444',
      saturday: isDarkMode ? '#60A5FA' : '#3B82F6',
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