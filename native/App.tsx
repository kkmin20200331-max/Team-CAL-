import React, { useState, useContext, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { User } from './src/types/User';

import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import PendingScreen from './src/screens/auth/PendingScreen';
import BranchSelectScreen from './src/screens/main/BranchSelectScreen';
import QRCheckInScreen from './src/screens/main/QRCheckInScreen';
import MyPageScreen from './src/screens/mypage/MyPageScreen';
import NotificationScreen from './src/screens/board/NotificationScreen';
import ScheduleScreen from './src/screens/schedule/ScheduleScreen';
import ProfileEditScreen from './src/screens/mypage/ProfileEditScreen';
import BoardScreen from './src/screens/board/BoardScreen';
import BoardWriteScreen from './src/screens/board/BoardWriteScreen';
import SubstituteScreen from './src/screens/schedule/SubstituteScreen';
import ContractScreen from './src/screens/mypage/ContractScreen';
import HealthCertScreen from './src/screens/mypage/HealthCertScreen';
import PayrollScreen from './src/screens/main/PayrollScreen';
import BoardDetailScreen from './src/screens/board/BoardDetailScreen';

import { NotificationProvider, NotificationContext } from './src/contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#34C759', height: 80, width: '90%', borderRadius: 12 }}
      contentContainerStyle={{ paddingHorizontal: 20 }}
      text1Style={{ fontSize: 18, fontWeight: 'bold' }}
      text2Style={{ fontSize: 15 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', height: 80, width: '90%', borderRadius: 12 }}
      contentContainerStyle={{ paddingHorizontal: 20 }}
      text1Style={{ fontSize: 18, fontWeight: 'bold' }}
      text2Style={{ fontSize: 15 }}
    />
  ),
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const BoardStack = createStackNavigator(); // ✅ [오류 수정] 게시판 전용 스택 네비게이터 생성

export const navigationRef = createNavigationContainerRef<any>();

// ✅ [오류 수정] 게시판 관련 화면들을 별도의 스택으로 묶어 관리합니다.
function BoardNavigator() {
  return (
    <BoardStack.Navigator screenOptions={{ headerShown: false }}>
      <BoardStack.Screen name="Board" component={BoardScreen} />
      <BoardStack.Screen name="BoardDetail" component={BoardDetailScreen} />
      <BoardStack.Screen name="BoardWrite" component={BoardWriteScreen} />
    </BoardStack.Navigator>
  );
}

function StaffTabNavigator({ route }: any) {
  // ✅ [개선 2] 로그아웃 함수(handleLogout)를 하위 화면(MyPage, Dashboard)으로 전달합니다.
  const { handleLogout, userInfo, setUserInfo } = route.params || {};
  const { unreadCount } = useContext(NotificationContext);
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      {/* ✅ [오류 수정] component prop을 사용하고, 필요한 데이터는 initialParams로 전달합니다. */}
      <Tab.Screen
        name="Home" 
        component={DashboardScreen}
        initialParams={{ handleLogout, userInfo }}
        options={{ title: t('tabHome') as string, tabBarIcon: () => <Text>🏠</Text> }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        initialParams={{ userInfo }}
        options={{ title: t('tabSchedule'), tabBarIcon: () => <Text>📅</Text> }} 
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        options={{ title: '알림', tabBarIcon: () => <Text>🔔</Text>, tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} 
      />
      <Tab.Screen 
        name="MyPage" 
        component={MyPageScreen} 
        initialParams={{ handleLogout, userInfo, setUserInfo }}
        options={{ title: t('tabMyPage'), tabBarIcon: () => <Text>👤</Text> }} 
      />
    </Tab.Navigator>
  );
}

function AdminTabNavigator({ route }: any) {
  const { handleLogout, userInfo, setUserInfo } = route.params || {};
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      {/* ✅ [오류 수정] component prop을 사용하고, 필요한 데이터는 initialParams로 전달합니다. */}
      <Tab.Screen
        name="AdminHome" 
        component={DashboardScreen}
        initialParams={{ handleLogout, userInfo }}
        options={{ title: t('tabAdminHome') as string, tabBarIcon: () => <Text>🏪</Text> }}
      />
      <Tab.Screen
        name="AdminSchedule"
        component={ScheduleScreen}
        initialParams={{ userInfo }}
        options={{ title: t('tabAdminSchedule'), tabBarIcon: () => <Text>📅</Text> }}
      />
      <Tab.Screen 
        name="AdminSettings" 
        component={MyPageScreen} 
        initialParams={{ handleLogout, userInfo, setUserInfo }} 
        options={{ title: t('tabAdminSettings'), tabBarIcon: () => <Text>⚙️</Text> }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // ✅ [개선 3] 'any' 대신 User 타입의 status('ACTIVE' | 'PENDING')를 사용하도록 수정합니다.
  const [userStatus, setUserStatus] = useState<User['status']>('PENDING');
  const [hasSelectedBranch, setHasSelectedBranch] = useState(false);
  // ✅ [개선 4] 'any' 대신 User 또는 null 타입을 사용하도록 하여 안정성을 높입니다.
  const [userInfo, setUserInfo] = useState<User | null>(null);

  // ✅ [개선 5] 로그아웃 시 모든 사용자 관련 상태를 초기화하는 함수입니다.
  // 이 함수를 사용해야 다른 계정으로 로그인 시 이전 정보가 남는 버그를 막을 수 있습니다.
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserStatus('PENDING');
    setHasSelectedBranch(false);
    setUserInfo(null);
  };

  useEffect(() => {
    async function requestPushPermissions() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: 5,
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

    const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data && data.screen && navigationRef.isReady()) {
        (navigationRef as any).navigate(data.screen, { postToOpen: data.postToOpen });
      }
    });

    return () => {
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
            <NavigationContainer ref={navigationRef}>
              <Stack.Navigator>
                {!isLoggedIn ? (
                  <Stack.Group>
                    <Stack.Screen name="Login" options={{ headerShown: false }}>
                      {(props: any) => (
                        <LoginScreen 
                          {...props} 
                          setIsLoggedIn={setIsLoggedIn}
                          setUserStatus={setUserStatus}
                          setHasSelectedBranch={setHasSelectedBranch}
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
                // ✅ [개선 6] 'active' 대신 'ACTIVE' (대문자)로 확인하여 로그인 로직과 일치시킵니다.
                ) : userStatus === 'ACTIVE' ? (
                  <Stack.Group> 
                    {userInfo?.role === 'ADMIN' ? (
                      <Stack.Screen 
                        name="AdminTab" 
                        component={AdminTabNavigator} 
                        initialParams={{ handleLogout, userInfo, setUserInfo }}
                        options={{ headerShown: false }} 
                      />
                    ) : (
                      <Stack.Screen 
                        name="StaffTab" 
                        component={StaffTabNavigator} 
                        initialParams={{ handleLogout, userInfo, setUserInfo }}
                        options={{ headerShown: false }} 
                      />
                    )}
                    <Stack.Screen name="QRCheckIn" component={QRCheckInScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: false }} />
                    {/* ✅ [오류 수정] 개별 등록 대신 BoardNavigator 그룹을 등록합니다. */}
                    <Stack.Screen name="BoardNavigator" component={BoardNavigator} options={{ headerShown: false }} />
                    <Stack.Screen name="Substitute" component={SubstituteScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Payroll" component={PayrollScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Contract" component={ContractScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="HealthCert" component={HealthCertScreen} options={{ headerShown: false }} />
                  </Stack.Group>
                ) : (
                  <Stack.Group>
                    <Stack.Screen name="Pending" options={{ headerShown: false }}>
                      {({ navigation }: any) => (
                        <PendingScreen 
                          navigation={navigation} 
                          handleLogout={handleLogout}  
                        />
                      )}
                    </Stack.Screen>
                  </Stack.Group>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationProvider>
        </LanguageProvider>
        <Toast config={toastConfig} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}