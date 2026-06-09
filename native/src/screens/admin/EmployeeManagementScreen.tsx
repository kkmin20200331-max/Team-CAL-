import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

// --- 더미 데이터 ---
const dummyEmployees = [
  { id: 'user_1', name: '김민준', phone: '010-1234-5678', role: '매니저' },
  { id: 'user_2', name: '이서연', phone: '010-2345-6789', role: '파트타임' },
  { id: 'user_3', name: '박도윤', phone: '010-3456-7890', role: '파트타임' },
  { id: 'user_4', name: '최지우', phone: '010-4567-8901', role: '풀타임' },
  { id: 'user_5', name: '정시우', phone: '010-5678-9012', role: '파트타임' },
  { id: 'user_6', name: '강하윤', phone: '010-6789-0123', role: '파트타임' },
  { id: 'user_7', name: '조은우', phone: '010-7890-1234', role: '매니저' },
];

const EmployeeManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const renderEmployeeItem = ({ item }: { item: typeof dummyEmployees[0] }) => (
    <View style={styles.employeeCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeePhone}>{item.phone}</Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
    </View>
  );

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
        data={dummyEmployees}
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
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  employeePhone: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: colors.disabled,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subText,
  },
});

export default EmployeeManagementScreen;