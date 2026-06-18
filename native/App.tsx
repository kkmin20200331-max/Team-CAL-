import React, { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
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
import ScheduleScreen from './src/screens/schedule/ScheduleScreen';
import AdminDailyScheduleScreen from './src/screens/admin/AdminDailyScheduleScreen';
import EmployeeManagementScreen from './src/screens/admin/EmployeeManagementScreen';
import ShiftEditorScreen from './src/screens/admin/ShiftEditorScreen';
import EmployeeDetailScreen from './src/screens/admin/EmployeeDetailScreen';
import SubstituteManagementScreen from './src/screens/admin/SubstituteManagementScreen';
import AddBranchScreen from './src/screens/admin/AddBranchScreen';
import StoreEditScreen from './src/screens/admin/StoreEditScreen';
import AttendanceRecordScreen from './src/screens/admin/AttendanceRecordScreen';
import StaffDashboardScreen from './src/screens/main/DashboardScreen';
import NotificationScreen from './src/screens/board/NotificationScreen';
import BoardScreen from './src/screens/board/BoardScreen';
import BoardDetailScreen from './src/screens/board/BoardDetailScreen';
import BoardWriteScreen from './src/screens/board/BoardWriteScreen';
import PayrollScreen from './src/screens/main/PayrollScreen';
import PayrollDetailScreen from './src/screens/admin/PayrollDetailScreen';
import WeeklyPayrollDetailScreen from './src/screens/mypage/WeeklyPayrollDetailScreen';
import ContractScreen from './src/screens/mypage/ContractScreen';
import HealthCertScreen from './src/screens/mypage/HealthCertScreen';
import ProfileEditScreen from './src/screens/mypage/ProfileEditScreen';
import QRCheckInScreen from './src/screens/main/QRCheckInScreen';
import SubstituteMatchingScreen from './src/screens/schedule/SubstituteMatchingScreen';

// Contexts
import { AppProvider, useApp } from './src/contexts/AppContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { BoardProvider } from './src/contexts/BoardContext';
import { ScheduleProvider } from './src/contexts/ScheduleContext';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#69C779', height: 65, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FE6301', height: 65, width: '90%' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3B82F6', height: 65, width: '90%' }}
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

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignupChoice" component={SignupChoiceScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function AdminTabNavigator() {
  return (
    <AdminTab.Navigator screenOptions={{ headerShown: false }}>
      <AdminTab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: '대시보드' }} />
      <AdminTab.Screen name="AdminSchedule" component={ScheduleScreen} options={{ title: '근무 관리' }} />
      <AdminTab.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ title: '직원 관리' }} />
      <AdminTab.Screen name="AdminMyPage" component={MyPageScreen} options={{ title: '내 정보' }} />
    </AdminTab.Navigator>
  );
}

function BoardNavigator() {
  return (
    <BoardStack.Navigator screenOptions={{ headerShown: false }}>
      <BoardStack.Screen name="Board" component={BoardScreen} />
      <BoardStack.Screen name="BoardDetail" component={BoardDetailScreen} />
      <BoardStack.Screen name="BoardWrite" component={BoardWriteScreen} />
    </BoardStack.Navigator>
  );
}

function StaffTabNavigator() {
  return (
    <StaffTab.Navigator screenOptions={{ headerShown: false }}>
      <StaffTab.Screen name="StaffDashboard" component={StaffDashboardScreen} options={{ title: '대시보드' }} />
      <StaffTab.Screen name="StaffSchedule" component={ScheduleScreen} options={{ title: '근무 관리' }} />
      <StaffTab.Screen name="Notifications" component={NotificationScreen} options={{ title: '알림' }} />
      <StaffTab.Screen name="StaffMyPage" component={MyPageScreen} options={{ title: '내 정보' }} />
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
      <MainStack.Screen name="AdminDailySchedule" component={AdminDailyScheduleScreen} />
      <MainStack.Screen name="ShiftEditor" component={ShiftEditorScreen} />
      <MainStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <MainStack.Screen name="SubstituteManagement" component={SubstituteManagementScreen} />
      <MainStack.Screen name="AddBranch" component={AddBranchScreen} />
      <MainStack.Screen name="StoreEdit" component={StoreEditScreen} />
      <MainStack.Screen name="AttendanceRecord" component={AttendanceRecordScreen} />
      <MainStack.Screen name="BoardNavigator" component={BoardNavigator} />
      <MainStack.Screen name="Payroll" component={PayrollScreen} />
      <MainStack.Screen name="PayrollDetail" component={PayrollDetailScreen} />
      <MainStack.Screen name="WeeklyPayrollDetail" component={WeeklyPayrollDetailScreen} />
      <MainStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <MainStack.Screen name="Contract" component={ContractScreen} />
      <MainStack.Screen name="HealthCert" component={HealthCertScreen} />
      <MainStack.Screen name="QRCheckIn" component={QRCheckInScreen} />
      <MainStack.Screen name="SubstituteMatching" component={SubstituteMatchingScreen} />
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
    return <BranchSelectScreen />;
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
              <Toast config={toastConfig} />
            </NotificationProvider>
          </AppProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}