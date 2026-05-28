import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// ✅ [추가 1] 하단 탭 네비게이션을 위해 필요한 라이브러리 임포트
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// 화면 불러오기
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PendingScreen from './src/screens/PendingScreen';
import BranchSelectScreen from './src/screens/BranchSelectScreen';
import QRCheckInScreen from './src/screens/QRCheckInScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';

// ✅ [정리] 중복 선언된 Stack은 하나만 남기고, Tab 네비게이터를 생성합니다.
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------
// ✅ [추가 4] 실제 하단 탭의 구조를 정의하는 컴포넌트
// ---------------------------------------------------------
function MainTabNavigator({ route }: any) {
  // App에서 넘겨받은 전역 상태 변경 함수를 가져옵니다.
  const { setIsLoggedIn } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',   // 활성화된 탭 아이콘 색상
        tabBarInactiveTintColor: '#9CA3AF', // 비활성화된 탭 아이콘 색상
        headerShown: false,                 // 탭 화면들에서 상단 타이틀 바 숨김
      }}
    >
      {/* 1. 홈 탭 (기존 대시보드) */}
      <Tab.Screen 
        name="Home" 
        options={{ title: '홈', tabBarIcon: () => <Text>🏠</Text> }}
      >
        {(props) => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>

      {/* 2. 내 스케줄 탭 */}
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        options={{ title: '내 스케줄', tabBarIcon: () => <Text>📅</Text> }} 
      />

      {/* 3. 알림 탭 (숫자 배지 추가 가능) */}
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        options={{ title: '알림', tabBarIcon: () => <Text>🔔</Text>, tabBarBadge: 1 }} 
      />

      {/* 4. 마이페이지 탭 */}
      <Tab.Screen 
        name="MyPage" 
        component={MyPageScreen} 
        initialParams={{ setIsLoggedIn }} // 로그아웃 기능을 위해 함수 전달
        options={{ title: '마이페이지', tabBarIcon: () => <Text>👤</Text> }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
  const [userStatus, setUserStatus] = useState('pending'); // 사용자 상태 관리
  // 👇 2. 지점 선택 여부를 관리하는 상태 추가 (초기값: false)
  const [hasSelectedBranch, setHasSelectedBranch] = useState(false); // 지점 선택 관리

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
            // <> </> 한 화면 안에 두 개가 있으면 빈 태그로 감싸줘야 합니다.
            <> 
            {/* [상태 2] 승인 완료 (메인 서비스 영역) */}
            {/* ✅ [수정] DashboardScreen 대신 위에서 만든 MainTabNavigator를 연결합니다. */}
            <Stack.Screen 
              name="MainTab" 
              component={MainTabNavigator} 
              initialParams={{ setIsLoggedIn }} // 탭 내부에서 로그아웃 가능하게 함수 전달
              options={{ headerShown: false }} 
            />

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
