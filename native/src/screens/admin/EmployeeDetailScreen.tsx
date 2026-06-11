import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import Toast from 'react-native-toast-message';

const EmployeeDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employee } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { updateEmployeeStatus, removeEmployee } = useSchedule();

  const handleApprove = () => {
    updateEmployeeStatus(employee.id, 'ACTIVE');
    Toast.show({
      type: 'success',
      text1: '승인 완료',
      text2: `${employee.name}님의 가입을 승인했습니다.`,
    });
    navigation.goBack();
  };

  const handleDecline = () => {
    Alert.alert(
      "가입 거절",
      `${employee.name}님의 가입 요청을 거절하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          style: "destructive",
          onPress: () => {
            removeEmployee(employee.id);
            Toast.show({
              type: 'info',
              text1: '요청 거절',
              text2: `${employee.name}님의 가입을 거절했습니다.`,
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 상세 정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{employee.name}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>역할</Text>
          <Text style={styles.value}>{employee.role}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>상태</Text>
          <Text style={[styles.value, employee.status === 'PENDING' && styles.pendingText]}>
            {employee.status}
          </Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>시급</Text>
          <Text style={styles.value}>{employee.payRate?.toLocaleString()}원</Text>
        </View>
      </ScrollView>

      {employee.status === 'PENDING' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={handleApprove}>
            <Text style={styles.approveButtonText}>승인</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  infoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.subText,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  pendingText: {
    color: '#F59E0B', // Amber color for pending status
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  approveButtonText: {
    color: '#065F46',
    fontWeight: 'bold',
  },
});

export default EmployeeDetailScreen;