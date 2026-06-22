import React from 'react';
import LineTestScreen from './LineTestScreen';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppProvider } from './src/contexts/AppContext';

// LINE 연동 테스트를 위해 임시로 App.tsx의 내용을 변경합니다.
// 테스트가 끝나면 원래 코드로 되돌려야 합니다.

export default function App() {
  return (
    // LineTestScreen이 Context에 접근할 수 있도록 Provider로 감싸줍니다.
    <ThemeProvider>
      <AppProvider>
        <LineTestScreen />
      </AppProvider>
    </ThemeProvider>
  );
}

/*
// ------------------- 원래 코드 시작 -------------------
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// ... (이하 모든 기존 코드)
// ------------------- 원래 코드 끝 -------------------
*/
