import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 화면 불러오기
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PendingScreen from './src/screens/PendingScreen';
import BranchSelectScreen from './src/screens/BranchSelectScreen';
import QRCheckInScreen from './src/screens/QRCheckInScreen';

// 스택 네비게이터 생성
const Stack = createStackNavigator();

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
  const [userStatus, setUserStatus] = useState('pending'); // 사용자 상태 관리
  // 👇 2. 지점 선택 여부를 관리하는 상태 추가 (초기값: false)
  const [hasSelectedBranch, setHasSelectedBranch] = useState(false); // 지점 선택 관리

  console.log('userStatus:', userStatus);

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
                  // 👇 화살표 함수로 감싸서 값만 전달하도록 명확히 수정합니다.
                  setIsLoggedIn={setIsLoggedIn}
                  setUserStatus={setUserStatus}
                  // 👇 로그아웃 후 다시 로그인할 때를 위해 함수를 넘겨줍니다.
                  setHasSelectedBranch={setHasSelectedBranch}
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ title: '회원가입' }} 
            />
          </>
        ) : !hasSelectedBranch ? (
          // 👇 [상태 1.5] 로그인은 했지만 지점 선택을 안 한 경우 (새로 추가됨!)
          <Stack.Screen name="BranchSelect" options={{ headerShown: false }}>
            {({ navigation }) => (
              <BranchSelectScreen 
                navigation={navigation} 
                setHasSelectedBranch={setHasSelectedBranch} 
              />
            )}
          </Stack.Screen>
          ): userStatus === 'active' ? (
          // [상태 2] 로그인 + 승인 완료
          // <> </> 한 화면 안에 두 개가 있으면 빈 태그로 감싸줘야 합니다.
          <> 
          <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
            {/* props 대신 { navigation } 만 구조분해할당으로 받아서 넘겨줍니다 */}
            {({ navigation }) => (
              <DashboardScreen 
                navigation={navigation} 
                setIsLoggedIn={setIsLoggedIn} 
              />
            )}
          </Stack.Screen>

          {/* 👇 대시보드와 형제 위치에 QR 화면을 추가합니다. */}
            <Stack.Screen 
              name="QRCheckIn" 
              component={QRCheckInScreen} 
              options={{ headerShown: false }} 
            />
        </>
        ) : (
          // [상태 3] 로그인 + 승인 대기
          <Stack.Screen name="Pending" options={{ headerShown: false }}>
            {/* 여기도 동일하게 수정합니다 */}
            {({ navigation }) => (
              <PendingScreen 
                navigation={navigation} 
                setIsLoggedIn={setIsLoggedIn}  
              />
            )}
          </Stack.Screen>
        )}
        {/* ▲ 조건부 로직 끝 ▲ */}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}