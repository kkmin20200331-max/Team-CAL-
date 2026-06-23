import React, { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native'; // 1. View, Text, StyleSheet 임포트
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'; // 2. BaseToast, ErrorToast 임포트
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import SignupChoiceScreen from './src/screens/auth/SignupChoiceScreen';
import PendingScreen from './src/screens/auth/PendingScreen';
import BranchSelectScreen from './src/screens/main/BranchSelectScreen';
import MyPageScreen from './src/screens/mypage/MyPageScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminScheduleScreen from './src/screens/admin/AdminScheduleScreen';
import AdminDailyScheduleScreen from './src/screens/admin/AdminDailyScheduleScreen';
import EmployeeManagementScreen from './src/screens/admin/EmployeeManagementScreen';
import ShiftEditorScreen from './src/screens/admin/ShiftEditorScreen';
import EmployeeDetailScreen from './src/screens/admin/EmployeeDetailScreen';
import SubstituteManagementScreen from './src/screens/admin/SubstituteManagementScreen';
import AddBranchScreen from './src/screens/admin/AddBranchScreen';
import StaffDashboardScreen from './src/screens/main/DashboardScreen';
import StaffScheduleScreen from './src/screens/schedule/ScheduleScreen';
import NotificationScreen from './src/screens/board/NotificationScreen';
import BoardScreen from './src/screens/board/BoardScreen';
import BoardDetailScreen from './src/screens/board/BoardDetailScreen';
import BoardWriteScreen from './src/screens/board/BoardWriteScreen';
import PayrollScreen from './src/screens/main/PayrollScreen';
import ContractScreen from './src/screens/mypage/ContractScreen';
import HealthCertScreen from './src/screens/mypage/HealthCertScreen';
import ProfileEditScreen from './src/screens/mypage/ProfileEditScreen';
import QRCheckInScreen from './src/screens/main/QRCheckInScreen';
import SubstituteScreen from './src/screens/schedule/SubstituteScreen';

import { Ionicons } from '@expo/vector-icons';

// Contexts
import { AppProvider, useApp } from './src/contexts/AppContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BoardProvider } from './src/contexts/BoardContext';
import { ScheduleProvider } from './src/contexts/ScheduleContext';

// 3. 커스텀 토스트 메시지 UI 설정
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#69C779', height: 65, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
      }}
      text2Style={{
        fontSize: 14,
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FE6301', height: 65, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
      }}
      text2Style={{
        fontSize: 14,
      }}
    />
  ),
};


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('푸시 알림을 받으려면 알림 권한을 허용해주세요!');
    return;
  }
}


const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const AdminTab = createBottomTabNavigator();
const StaffTab = createBottomTabNavigator();
const BoardStack = createStackNavigator();
const asScreen = (component: React.ComponentType<any>) => component;

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignupChoice" component={SignupChoiceScreen} />
      <AuthStack.Screen name="Signup" component={asScreen(SignupScreen)} />
    </AuthStack.Navigator>
  );
}

function AdminTabNavigator() {
  const { colors } = useTheme();
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'grid';
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'EmployeeManagement') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminMyPage') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <AdminTab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: '대시보드' }} />
      <AdminTab.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ title: '직원관리' }} />
      <AdminTab.Screen name="AdminMyPage" component={MyPageScreen} options={{ title: '내 정보' }} />
    </AdminTab.Navigator>
  );
}

function BoardNavigator() {
  return (
    <BoardStack.Navigator screenOptions={{ headerShown: false }}>
      <BoardStack.Screen name="Board" component={BoardScreen} />
      <BoardStack.Screen name="BoardDetail" component={asScreen(BoardDetailScreen)} />
      <BoardStack.Screen name="BoardWrite" component={BoardWriteScreen} />
    </BoardStack.Navigator>
  );
}

function StaffTabNavigator() {
  const { colors } = useTheme();
  return (
    <StaffTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'home';
          if (route.name === 'StaffDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StaffSchedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'StaffMyPage') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <StaffTab.Screen name="StaffDashboard" component={StaffDashboardScreen} options={{ title: '홈' }} />
      <StaffTab.Screen name="StaffSchedule" component={StaffScheduleScreen} options={{ title: '스케줄' }} />
      <StaffTab.Screen name="Notifications" component={NotificationScreen} options={{ title: '알림' }} />
      <StaffTab.Screen name="StaffMyPage" component={MyPageScreen} options={{ title: '마이페이지' }} />
    </StaffTab.Navigator>
  );
}

function MainNavigator() {
  const { userInfo } = useApp();
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {userInfo?.role === 'ADMIN' ? (
        <MainStack.Screen name="AdminRoot" component={AdminTabNavigator} />
      ) : (
        <MainStack.Screen name="StaffRoot" component={StaffTabNavigator} />
      )}
      <MainStack.Screen name="AdminSchedule" component={AdminScheduleScreen} />
      <MainStack.Screen name="AdminDailySchedule" component={AdminDailyScheduleScreen} />
      <MainStack.Screen name="ShiftEditor" component={asScreen(ShiftEditorScreen)} />
      <MainStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <MainStack.Screen name="SubstituteManagement" component={SubstituteManagementScreen} />
      <MainStack.Screen name="AddBranch" component={AddBranchScreen} />
      <MainStack.Screen name="BoardNavigator" component={BoardNavigator} />
      <MainStack.Screen name="Payroll" component={PayrollScreen} />
      <MainStack.Screen name="ProfileEdit" component={asScreen(ProfileEditScreen)} />
      <MainStack.Screen name="Contract" component={ContractScreen} />
      <MainStack.Screen name="HealthCert" component={HealthCertScreen} />
      <MainStack.Screen name="QRCheckIn" component={QRCheckInScreen} />
      <MainStack.Screen name="Substitute" component={SubstituteScreen} />
    </MainStack.Navigator>
  );
}

function BranchSetupNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="BranchSelect" component={BranchSelectScreen} />
      <MainStack.Screen name="AddBranch" component={AddBranchScreen} />
    </MainStack.Navigator>
  );
}

function AppContent() {
  const { userInfo, userStatus, hasSelectedBranch, logout } = useApp();
  const isLoggedIn = !!userInfo;

  if (!isLoggedIn) {
    return <AuthNavigator />;
  }

  if (!hasSelectedBranch) {
    return <BranchSetupNavigator />;
  }

  if (userStatus !== 'ACTIVE') {
    return <PendingScreen handleLogout={logout} />;
  }

  return <MainNavigator />;
}

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <AppProvider>
            <NotificationProvider>
              <BoardProvider>
                <ScheduleProvider>
                  <NavigationContainer>
                    <AppContent />
                  </NavigationContainer>
                </ScheduleProvider>
              </BoardProvider>
              {/* 4. Toast 컴포넌트에 config 전달 */}
              <Toast config={toastConfig} />
            </NotificationProvider>
          </AppProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
