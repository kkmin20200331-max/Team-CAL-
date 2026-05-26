import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 방금 만든 두 화면 불러오기
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// 스택 네비게이터 생성
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* 로그인 화면 등록 */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} // 상단 헤더바 숨기기
        />
        {/* 회원가입 화면 등록 */}
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: '회원가입' }} // 상단 헤더바에 제목 넣기
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}