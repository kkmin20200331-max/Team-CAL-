import React, { useState, useContext } from 'react';
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
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import BoardScreen from './src/screens/BoardScreen'; // ✅ [추가] 게시판 화면 불러오기

// ✅ [추가] 알림 전역 상태 관리를 위한 Context 불러오기
import { NotificationProvider, NotificationContext } from './src/contexts/NotificationContext';

// ✅ [정리] 중복 선언된 Stack은 하나만 남기고, Tab 네비게이터를 생성합니다.
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------
// ✅ [직원용] 하단 탭 네비게이터
// ---------------------------------------------------------
function StaffTabNavigator({ route }: any) {
  // App에서 넘겨받은 전역 상태 변경 함수를 가져옵니다.
  // ✅ setUserInfo를 추가로 받아옵니다.
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params;

  // ✅ 안 읽은 알림 개수 가져오기
  const { unreadCount } = useContext(NotificationContext);

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
        {(props) => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} userInfo={userInfo} />}
      </Tab.Screen>

      {/* 2. 내 스케줄 탭 */}
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ userInfo }} // ✅ API 통신을 위해 유저 정보 전달
        options={{ title: '내 스케줄', tabBarIcon: () => <Text>📅</Text> }} 
      />

      {/* 3. 알림 탭 (숫자 배지 추가 가능) */}
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        // 💡 unreadCount가 0보다 클 때만 숫자를 보여주고, 0이면 배지를 숨깁니다(undefined)
        options={{ title: '알림', tabBarIcon: () => <Text>🔔</Text>, tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} 
      />

      {/* 4. 마이페이지 탭 */}
      <Tab.Screen 
        name="MyPage" 
        component={MyPageScreen} 
        initialParams={{ setIsLoggedIn, userInfo, setUserInfo }} // 정보 업데이트 함수까지 전달
        options={{ title: '마이페이지', tabBarIcon: () => <Text>👤</Text> }} 
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------
// ✅ [관리자용] 하단 탭 네비게이터
// ---------------------------------------------------------
function AdminTabNavigator({ route }: any) {
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        // 관리자는 탭 색상을 다르게(예: 주황/빨강) 주어 시각적으로 확실히 구분되게 합니다.
        tabBarActiveTintColor: '#FF5A5F',   
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,                 
      }}
    >
      {/* 관리자 1. 매장 관리 홈 (임시로 기존 대시보드 연결, 추후 AdminDashboardScreen으로 교체) */}
      <Tab.Screen 
        name="AdminHome" 
        options={{ title: '매장 관리', tabBarIcon: () => <Text>🏪</Text> }}
      >
        {(props) => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} userInfo={userInfo} />}
      </Tab.Screen>

      {/* ✅ [추가] 관리자 2. 스케줄 관리 탭 */}
      <Tab.Screen
        name="AdminSchedule"
        component={ScheduleScreen}
        initialParams={{ userInfo }} // API 통신을 위해 유저 정보 전달
        options={{ title: '스케줄 관리', tabBarIcon: () => <Text>📅</Text> }}
      />

      {/* 관리자 3. 설정 (마이페이지 공통 사용) */}
      <Tab.Screen 
        name="AdminSettings" 
        component={MyPageScreen} 
        initialParams={{ setIsLoggedIn, userInfo, setUserInfo }} 
        options={{ title: '설정', tabBarIcon: () => <Text>⚙️</Text> }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
  const [userStatus, setUserStatus] = useState('pending'); // 사용자 상태 관리
  // 👇 2. 지점 선택 여부를 관리하는 상태 추가 (초기값: false)
  const [hasSelectedBranch, setHasSelectedBranch] = useState(false); // 지점 선택 관리
  // 👇 3. 로그인한 유저의 정보를 통째로 저장하는 상태 추가
  const [userInfo, setUserInfo] = useState<any>(null);

return (
  <NotificationProvider>
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
                  // 👇 로그인 성공 시 백엔드에서 받은 유저 정보를 저장할 함수
                  setUserInfo={setUserInfo}
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
                userInfo={userInfo}
                setUserInfo={setUserInfo}
              />
            )}
          </Stack.Screen>
          ): userStatus === 'active' ? (
            // <> </> 한 화면 안에 두 개가 있으면 빈 태그로 감싸줘야 합니다.
            <> 
            {/* [상태 2] 승인 완료 (메인 서비스 영역) */}
            
            {/* ✅ [권한별 분기] 로그인한 유저의 role을 확인하여 다른 화면을 보여줍니다. */}
            {userInfo?.role === 'ADMIN' ? (
              <Stack.Screen 
                name="AdminTab" 
                component={AdminTabNavigator} 
                initialParams={{ setIsLoggedIn, userInfo, setUserInfo }}
                options={{ headerShown: false }} 
              />
            ) : (
              <Stack.Screen 
                name="StaffTab" 
                component={StaffTabNavigator} 
                initialParams={{ setIsLoggedIn, userInfo, setUserInfo }}
                options={{ headerShown: false }} 
              />
            )}

          {/* 👇 대시보드와 형제 위치에 QR 화면을 추가합니다. */}
            <Stack.Screen 
              name="QRCheckIn" 
              component={QRCheckInScreen} 
              options={{ headerShown: false }} 
            />

          {/* 👇 개인정보 수정 화면 추가 (탭 바를 덮도록 Stack에 추가) */}
            <Stack.Screen 
              name="ProfileEdit" 
              component={ProfileEditScreen} 
              options={{ headerShown: false }} 
            />

          {/* 👇 게시판 전체 보기 화면 추가 (탭 바를 덮도록 Stack에 추가) */}
            <Stack.Screen 
              name="Board" 
              component={BoardScreen} 
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
  </NotificationProvider>
  );
}
