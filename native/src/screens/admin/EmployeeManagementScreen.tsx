import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const initialEmployees = [
  { id: 'user_1', name: '김민준', phone: '010-1234-5678', role: '매니저', payType: 'SALARY' as const, payRate: 3000000 },
  { id: 'user_2', name: '이서연', phone: '010-2345-6789', role: '파트타임', payType: 'HOURLY' as const, payRate: 10000 },
  { id: 'user_3', name: '박도윤', phone: '010-3456-7890', role: '파트타임', payType: 'HOURLY' as const, payRate: 9860 },
  { id: 'user_4', name: '최지우', phone: '010-4567-8901', role: '풀타임', payType: 'SALARY' as const, payRate: 2500000 },
  { id: 'user_5', name: '정시우', phone: '010-5678-9012', role: '파트타임', payType: 'HOURLY' as const, payRate: 11000 },
  { id: 'user_6', name: '강하윤', phone: '010-6789-0123', role: '파트타임', payType: 'HOURLY' as const, payRate: 9860 },
  { id: 'user_7', name: '조은우', phone: '010-7890-1234', role: '매니저', payType: 'SALARY' as const, payRate: 3200000 },
];

const EmployeeManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const [employees, setEmployees] = useState(initialEmployees);

  const handleSaveEmployee = (updatedEmployee: typeof initialEmployees[0]) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  };

  const handleNavigateToDetail = (employee: typeof initialEmployees[0]) => {
    navigation.navigate('EmployeeDetail', {
      employee,
      onSave: handleSaveEmployee,
    });
  };

  const renderEmployeeItem = ({ item }: { item: typeof initialEmployees[0] }) => {
    const isManager = item.role === '매니저';
    return (
      <TouchableOpacity style={styles.employeeCard} onPress={() => handleNavigateToDetail(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.employeeInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <View style={[styles.roleBadge, isManager && styles.managerBadge]}>
              <Text style={[styles.roleText, isManager && styles.managerRoleText]}>{item.role}</Text>
            </View>
          </View>
          <Text style={styles.employeePhone}>{item.phone}</Text>
        </View>
        <View style={styles.payInfo}>
          <Text style={styles.payRateText}>
            {item.payType === 'HOURLY' ? `${item.payRate.toLocaleString()}원` : `${(item.payRate / 10000).toLocaleString()}만`}
          </Text>
          <Text style={styles.payTypeText}>
            {item.payType === 'HOURLY' ? '시급' : '월급'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 24,
    color: colors.primary,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  roleBadge: {
    backgroundColor: colors.disabled,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  managerBadge: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subText,
  },
  managerRoleText: {
    color: '#FFFFFF',
  },
  employeePhone: {
    fontSize: 14,
    color: colors.subText,
  },
  payInfo: {
    alignItems: 'flex-end',
  },
  payRateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  payTypeText: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 4,
  },
});

export default EmployeeManagementScreen;