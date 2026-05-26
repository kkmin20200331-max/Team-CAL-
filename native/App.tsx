import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 방금 만든 두 화면 불러오기
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PendingScreen from './src/screens/PendingScreen';

// 스택 네비게이터 생성
const Stack = createStackNavigator();

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
  const [userStatus, setUserStatus] = useState("pending"); // 사용자 상태 관리 (예: "pending", "active")

return (
    <NavigationContainer>
      {/* 조건부 렌더링 시 initialRouteName은 생략해도 됩니다. */}
      <Stack.Navigator>
        
        {/* ▼ 여기에 조건부 로직이 들어갑니다 ▼ */}
        {!isLoggedIn ? (
          // [상태 1] 로그인이 안 된 경우
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => (
                <LoginScreen 
                  {...props} 
                  setIsLoggedIn={setIsLoggedIn} 
                  setUserStatus={setUserStatus} 
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ title: '회원가입' }} 
            />
          </>
        ) : userStatus === 'active' ? (
          // [상태 2] 로그인 + 승인 완료
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: '메인 대시보드' }} 
          />
        ) : (
          // [상태 3] 로그인 + 승인 대기
          <Stack.Screen name="Pending" options={{ headerShown: false }}>
    {(props) => (
      <PendingScreen {...props} 
        setIsLoggedIn={setIsLoggedIn} // 👇 함수 전달
      />
    )}
  </Stack.Screen>
        )}
        {/* ▲ 조건부 로직 끝 ▲ */}
        
      </Stack.Navigator>
    </NavigationContainer>
  )};