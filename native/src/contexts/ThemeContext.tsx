import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

<<<<<<< HEAD
=======
type ThemeMode = '시스템 설정' | '라이트 모드' | '다크 모드' | string;

>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
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
<<<<<<< HEAD
=======
    primaryDark: string;
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
    primaryLight: string;
    danger: string;
    dangerLight: string;
    warning: string;
    warningLight: string;
    disabled: string;
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
  const [themeMode, setThemeMode] = useState<ThemeMode>('시스템 설정');

  const isDarkMode =
    themeMode === '다크 모드' ||
    (themeMode === '시스템 설정' && systemColorScheme === 'dark');

<<<<<<< HEAD
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
=======
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
    }),
    [isDarkMode],
  );
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

<<<<<<< HEAD
export const useTheme = () => useContext(ThemeContext);
=======
export const useTheme = () => useContext(ThemeContext);
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
