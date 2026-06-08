import React, { useState, useContext, useEffect } from 'react';
// ✅ createNavigationContainerRef 추가
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// ✅ [추가 1] 하단 탭 네비게이션을 위해 필요한 라이브러리 임포트
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native'; // ✅ Platform 모듈 추가

// 화면 불러오기
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import PendingScreen from './src/screens/auth/PendingScreen';
import BranchSelectScreen from './src/screens/main/BranchSelectScreen';
import QRCheckInScreen from './src/screens/main/QRCheckInScreen';
import MyPageScreen from './src/screens/mypage/MyPageScreen';
import NotificationScreen from './src/screens/board/NotificationScreen'; // ✅ [추가] 알림 화면 불러오기
import ScheduleScreen from './src/screens/schedule/ScheduleScreen';
import ProfileEditScreen from './src/screens/mypage/ProfileEditScreen';
import BoardScreen from './src/screens/board/BoardScreen'; // ✅ [추가] 게시판 화면 불러오기
import BoardWriteScreen from './src/screens/board/BoardWriteScreen'; // ✅ [추가] 글쓰기 화면 불러오기
import SubstituteScreen from './src/screens/schedule/SubstituteScreen'; // ✅ [추가] 대타 전용 화면 불러오기
import ContractScreen from './src/screens/mypage/ContractScreen'; // ✅ [추가] 근로계약서 화면
import HealthCertScreen from './src/screens/mypage/HealthCertScreen'; // ✅ [추가] 보건증 화면
import PayrollScreen from './src/screens/main/PayrollScreen'; // ✅ [추가] 급여 관리 화면

// ✅ [추가] 알림 전역 상태 관리를 위한 Context 불러오기
import { NotificationProvider, NotificationContext } from './src/contexts/NotificationContext';
// ✅ [추가] 다국어 전역 상태 관리 Context 불러오기 (useLanguage 추가)
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
// ✅ [추가] 테마(주/야간 모드) 전역 상태 관리 Context 불러오기
import { ThemeProvider } from './src/contexts/ThemeContext';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'; // ✅ [수정] 토스트 커스텀 컴포넌트 추가
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // ✅ [추가] 제스처 최상단 래퍼
import * as Notifications from 'expo-notifications'; // ✅ [추가] 푸시 알림 라이브러리

// ✅ [추가] 토스트 알림을 더 크고 잘 보이게 만드는 커스텀 설정
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#34C759', height: 80, width: '90%', borderRadius: 12 }} // 높이와 너비 증가
      contentContainerStyle={{ paddingHorizontal: 20 }} // 내부 여백 증가
      text1Style={{
        fontSize: 18, // 제목 폰트 크기 증가
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 15, // 내용 폰트 크기 증가
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', height: 80, width: '90%', borderRadius: 12 }} // 높이와 너비 증가
      contentContainerStyle={{ paddingHorizontal: 20 }}
      text1Style={{
        fontSize: 18,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 15,
      }}
    />
  ),
};

// ✅ 앱이 실행 중(포그라운드)일 때도 상단에 헤드업 알림이 뜨도록 설정
Notifications.setNotificationHandler({
  // ✅ TypeScript 에러를 방지하기 위해 사용하지 않더라도 인자(notification)를 명시해줍니다.
  handleNotification: async (notification) => ({
    shouldShowBanner: true, // ✅ 최신 Expo 규격: 화면 상단에 알림 배너 표시
    shouldShowList: true,   // ✅ 최신 Expo 규격: 알림 센터 목록에 표시
    shouldPlaySound: true, // 알림 소리 재생
    shouldSetBadge: true,  // 앱 아이콘에 숫자 배지 표시
  }),
});

// ✅ [정리] 중복 선언된 Stack은 하나만 남기고, Tab 네비게이터를 생성합니다.
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ [추가] 외부(알림 리스너)에서 화면을 강제로 이동시키기 위한 네비게이션 참조 객체
export const navigationRef = createNavigationContainerRef<any>();

// ---------------------------------------------------------
// ✅ [직원용] 하단 탭 네비게이터
// ---------------------------------------------------------
function StaffTabNavigator({ route }: any) {
  // App에서 넘겨받은 전역 상태 변경 함수를 가져옵니다.
  // ✅ setUserInfo를 추가로 받아옵니다.
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params || {};

  // ✅ 안 읽은 알림 개수 가져오기
  const { unreadCount } = useContext(NotificationContext);

  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

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
        options={{ title: t('tabHome') as string, tabBarIcon: () => <Text>🏠</Text> }}
      >
        {(props: any) => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} userInfo={userInfo} />}
      </Tab.Screen>

      {/* 2. 내 스케줄 탭 */}
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ userInfo }} // ✅ API 통신을 위해 유저 정보 전달
        options={{ title: t('tabSchedule'), tabBarIcon: () => <Text>📅</Text> }} 
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
        options={{ title: t('tabMyPage'), tabBarIcon: () => <Text>👤</Text> }} 
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------
// ✅ [관리자용] 하단 탭 네비게이터
// ---------------------------------------------------------
function AdminTabNavigator({ route }: any) {
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params || {};
  
  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

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
        options={{ title: t('tabAdminHome') as string, tabBarIcon: () => <Text>🏪</Text> }}
      >
        {(props: any) => <DashboardScreen {...props} setIsLoggedIn={setIsLoggedIn} userInfo={userInfo} />}
      </Tab.Screen>

      {/* ✅ [추가] 관리자 2. 스케줄 관리 탭 */}
      <Tab.Screen
        name="AdminSchedule"
        component={ScheduleScreen}
        initialParams={{ userInfo }} // API 통신을 위해 유저 정보 전달
        options={{ title: t('tabAdminSchedule'), tabBarIcon: () => <Text>📅</Text> }}
      />

      {/* 관리자 3. 설정 (마이페이지 공통 사용) */}
      <Tab.Screen 
        name="AdminSettings" 
        component={MyPageScreen} 
        initialParams={{ setIsLoggedIn, userInfo, setUserInfo }} 
        options={{ title: t('tabAdminSettings'), tabBarIcon: () => <Text>⚙️</Text> }} 
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

  // ✅ 앱 시작 시 사용자에게 푸시 알림 권한(허용/거부) 요청
  useEffect(() => {
    async function requestPushPermissions() {
      // ✅ [추가] 안드로이드 푸시 알림 작동을 위한 필수 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: 5, // ✅ AndroidImportance.MAX 와 동일한 값. (버전 충돌 및 오류 방지를 위해 숫자 5로 변경)
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
      }
    }
    requestPushPermissions();

    // ✅ [핵심 추가] 푸시 알림을 클릭했을 때 발생하는 이벤트 리스너
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      // ✅ TypeScript 에러(빨간 줄) 방지를 위해 data의 타입을 명시적(as any)으로 지정해줍니다.
      const data = response.notification.request.content.data as any;
      
      // 알림 데이터에 이동할 화면(screen) 정보가 있고, 네비게이션이 준비된 상태면 이동
      if (data && data.screen && navigationRef.isReady()) {
        // ✅ React Navigation의 엄격한 타입 검사를 우회하여 강제로 화면을 이동시킵니다.
        (navigationRef as any).navigate(data.screen, { postToOpen: data.postToOpen });
      }
    });

    return () => {
      // ✅ 최신 Expo 버전에 맞게 리스너 제거 방식 수정
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

return (
<GestureHandlerRootView style={{ flex: 1 }}>
<ThemeProvider>
    <LanguageProvider>
      <NotificationProvider>
      {/* ✅ 생성한 navigationRef를 연결해 줍니다. */}
      <NavigationContainer ref={navigationRef}>
          {/* 조건부 렌더링 시 initialRouteName은 생략해도 됩니다. */}
          <Stack.Navigator>
            
            {/* ▼ 여기에 조건부 로직이 들어갑니다 ▼ */}
            {!isLoggedIn ? (
              // [상태 1] 로그인이 안 된 경우
              <Stack.Group>
                <Stack.Screen name="Login" options={{ headerShown: false }}>
                  {(props: any) => (
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
              </Stack.Group>
            ) : !hasSelectedBranch ? (
              // 👇 [상태 1.5] 로그인은 했지만 지점 선택을 안 한 경우 (새로 추가됨!)
              <Stack.Group>
              <Stack.Screen name="BranchSelect" options={{ headerShown: false }}>
                {({ navigation }: any) => (
                  <BranchSelectScreen 
                    navigation={navigation} 
                    setHasSelectedBranch={setHasSelectedBranch} 
                    userInfo={userInfo}
                    setUserInfo={setUserInfo}
                  />
                )}
              </Stack.Screen>
              </Stack.Group>
            ) : userStatus === 'active' ? (
                // ✅ 빈 태그(<></>) 대신 React Navigation에서 권장하는 <Stack.Group>으로 감싸줍니다.
                <Stack.Group> 
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

              {/* 👇 게시판 글쓰기 화면 추가 */}
                <Stack.Screen 
                  name="BoardWrite" 
                  component={BoardWriteScreen} 
                  options={{ headerShown: false }} 
                />
    
              {/* 👇 대타 구하기 / 지원하기 화면 추가 */}
                <Stack.Screen 
                  name="Substitute" 
                  component={SubstituteScreen} 
                  options={{ headerShown: false }} 
                />
                
              {/* 👇 급여 및 주급 신청 화면 추가 */}
                <Stack.Screen 
                  name="Payroll" 
                  component={PayrollScreen} 
                  options={{ headerShown: false }} 
                />

              {/* 👇 근로계약서 화면 추가 */}
                <Stack.Screen 
                  name="Contract" 
                  component={ContractScreen} 
                  options={{ headerShown: false }} 
                />
  
              {/* 👇 보건증 관리 화면 추가 */}
                <Stack.Screen 
                  name="HealthCert" 
                  component={HealthCertScreen} 
                  options={{ headerShown: false }} 
                />
            </Stack.Group>
            ) : (
              // [상태 3] 로그인 + 승인 대기
              <Stack.Group>
              <Stack.Screen name="Pending" options={{ headerShown: false }}>
                {/* 여기도 동일하게 수정합니다 */}
                {({ navigation }: any) => (
                  <PendingScreen 
                    navigation={navigation} 
                    setIsLoggedIn={setIsLoggedIn}  
                  />
                )}
              </Stack.Screen>
              </Stack.Group>
            )}
            {/* ▲ 조건부 로직 끝 ▲ */}
            
          </Stack.Navigator>
      </NavigationContainer>
      </NotificationProvider>
    </LanguageProvider>
    <Toast config={toastConfig} />
</ThemeProvider>
</GestureHandlerRootView>
  );
}
