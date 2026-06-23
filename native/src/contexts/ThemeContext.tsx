import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

// 1. 테마 방송국에서 취급할 데이터의 모양(타입)을 정의합니다.
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
  };
}

// 2. 방송국(Context)을 만듭니다.
const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps);

// 3. 실제로 데이터를 뿌려줄 Provider 컴포넌트입니다.
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<string>('시스템 설정');

  const isDarkMode = themeMode === '다크 모드' || (themeMode === '시스템 설정' && systemColorScheme === 'dark');

  const colors = {
    background: isDarkMode ? '#121212' : '#F8F9FA',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#E0E0E0' : '#333333',
    subText: isDarkMode ? '#A0A0A0' : '#666666',
    border: isDarkMode ? '#333333' : '#EEEEEE',
    primary: '#18A022',
    primaryLight: isDarkMode ? '#1A365D' : '#E8F0FE',
    modalBg: isDarkMode ? '#2A2A2A' : '#FFFFFF',
  };

  return <ThemeContext.Provider value={{ themeMode, setThemeMode, isDarkMode, colors }}>{children}</ThemeContext.Provider>;
};

// 4. 다른 화면에서 쉽게 꺼내 쓰기 위한 커스텀 훅입니다.
export const useTheme = () => useContext(ThemeContext);
