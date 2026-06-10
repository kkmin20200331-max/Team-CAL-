import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from './src/store/appStore';

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
import StaffDashboardScreen from './src/screens/main/DashboardScreen';
import StaffScheduleScreen from './src/screens/schedule/ScheduleScreen';

// Contexts
import { NotificationProvider } from './src/contexts/NotificationContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();
const StaffStack = createStackNavigator();

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminSchedule" component={AdminScheduleScreen} />
      <AdminStack.Screen name="AdminDailySchedule" component={AdminDailyScheduleScreen} />
      <AdminStack.Screen name="EmployeeManagement" component={EmployeeManagementScreen} />
      <AdminStack.Screen name="ShiftEditor" component={ShiftEditorScreen} />
      <AdminStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <AdminStack.Screen name="SubstituteManagement" component={SubstituteManagementScreen} />
    </AdminStack.Navigator>
  );
}

function StaffNavigator() {
  return (
    <StaffStack.Navigator screenOptions={{ headerShown: false }}>
      <StaffStack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
      <StaffStack.Screen name="StaffSchedule" component={StaffScheduleScreen} />
    </StaffStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignupChoice" component={SignupChoiceScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { userInfo, userStatus, hasSelectedBranch, logout } = useAppStore();
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

  return userInfo.role === 'ADMIN' ? <AdminNavigator /> : <StaffNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
            <Toast />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}