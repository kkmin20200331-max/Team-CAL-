import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextProps {
  themeMode: string;
  setThemeMode: (mode: string) => void;
  isDarkMode: boolean;
  colors: {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    primary: string;
    primaryLight: string;
    modalBg: string;
    white: string;
    red: string;
    redLight: string;
    gray: string;
    green: string;
    greenLight: string;
    yellow: string;
    yellowLight: string;
    blue: string;
    blueLight: string;
    purple: string;
    purpleLight: string;
    orange: string;
    orangeLight: string;
    sky: string;
    skyLight: string;
    saturday: string;
    sunday: string;
    disabled: string;
  };
}

const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<string>('시스템 설정');

  const isDarkMode = themeMode === '다크 모드' || (themeMode === '시스템 설정' && systemColorScheme === 'dark');

  const colors = {
    background: isDarkMode ? '#121212' : '#F8F9FA',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#333333' : '#EEEEEE',
    primary: '#007BFF',
    primaryLight: isDarkMode ? '#1A365D' : '#E8F0FE',
    modalBg: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    white: '#FFFFFF',
    red: isDarkMode ? '#FECACA' : '#DC2626',
    redLight: isDarkMode ? '#7F1D1D' : '#FEE2E2',
    gray: isDarkMode ? '#374151' : '#F3F4F6',
    green: isDarkMode ? '#86EFAC' : '#16A34A',
    greenLight: isDarkMode ? '#14532D' : '#DCFCE7',
    yellow: isDarkMode ? '#FDE68A' : '#D97706',
    yellowLight: isDarkMode ? '#78350F' : '#FEF3C7',
    blue: '#2563EB',
    blueLight: '#93C5FD',
    purple: isDarkMode ? '#A78BFA' : '#5B21B6',
    purpleLight: isDarkMode ? '#5B21B6' : '#A78BFA',
    orange: isDarkMode ? '#FB923C' : '#F97316',
    orangeLight: isDarkMode ? '#9A3412' : '#FFEDD5',
    sky: isDarkMode ? '#BAE6FD' : '#0284C7',
    skyLight: isDarkMode ? '#075985' : '#E0F2FE',
    saturday: isDarkMode ? '#93C5FD' : '#3B82F6',
    sunday: isDarkMode ? '#FCA5A5' : '#EF4444',
    disabled: isDarkMode ? '#4A4A4A' : '#D1D5DB',
  };

  return <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, colors }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);