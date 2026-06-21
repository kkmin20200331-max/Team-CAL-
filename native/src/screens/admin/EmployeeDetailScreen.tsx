import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { approveStaffAPI } from '../../../api/auth'; // 경로 수정

const EmployeeDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employee, onGoBack } = route.params;
  const { colors } = useTheme();
  const { userInfo } = useApp();
  const styles = getThemedStyles(colors);

  const handleApprove = () => {
    if (!userInfo || !userInfo.store_id) {
      Alert.alert("오류", "매장 정보가 없습니다.");
      return;
    }

    Alert.alert(
      "직원 승인",
      `${employee.name} 님의 근무 신청을 승인하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "확인", 
          onPress: async () => {
            try {
              // URL: /api/store_member?user_id={user_id}&store_id={store_id} (PUT)
              // DB: STORE_MEMBER 테이블에서 해당 직원의 status를 'ACTIVE'로 변경
              await approveStaffAPI(employee.id, userInfo.store_id);
              Alert.alert("성공", "직원이 성공적으로 승인되었습니다.");
              if (onGoBack) onGoBack(); // 목록 새로고침 콜백 실행
              navigation.goBack();
            } catch (error) {
              console.error("직원 승인 중 오류 발생:", error);
              Alert.alert("오류", "직원 승인 중 문제가 발생했습니다.");
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = () => {
    // TODO: 추후 백엔드에 직원 비활성화 API (updateUserStatusAPI) 구현 시 아래 로직 활성화
    Alert.alert("준비 중인 기능", "직원 비활성화 기능은 현재 준비 중입니다.");
    /*
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const statusText = newStatus === 'ACTIVE' ? '활성' : '비활성';
    Alert.alert(
      "상태 변경",
      `${employee.name} 님의 상태를 ${statusText}으로 변경하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: () => {
          // await updateUserStatusAPI(employee.id, newStatus);
          if (onGoBack) onGoBack();
          navigation.goBack();
        }}
      ]
    );
    */
  };
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: '활동중', style: styles.activeBadge, textStyle: styles.activeStatusText };
      case 'PENDING':
        return { text: '승인대기', style: styles.pendingBadge, textStyle: styles.pendingStatusText };
      default:
        return { text: '비활성', style: styles.inactiveBadge, textStyle: styles.inactiveStatusText };
    }
  };

  const statusInfo = getStatusInfo(employee.status);

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
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: '#A1A1AA' }]}>
            <Text style={styles.avatarText}>{employee.name.substring(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{employee.name}</Text>
          <Text style={styles.role}>{employee.nickname}</Text>
          <View style={[styles.statusBadge, statusInfo.style]}>
            <Text style={statusInfo.textStyle}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>연락처</Text>
            <Text style={styles.infoValue}>{employee.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>아이디</Text>
            <Text style={styles.infoValue}>{employee.username}</Text>
          </View>
        </View>

        {/* 직원이 승인된 상태일 때만 다른 메뉴들을 보여줌 */}
        {employee.status === 'ACTIVE' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>근태 관리</Text>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AttendanceRecord', { employeeId: employee.id, employeeName: employee.name })}>
                <Text style={styles.menuItemText}>📅 출퇴근 기록 보기</Text>
                <Text style={styles.arrow}>〉</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.statusButton} onPress={handleStatusChange}>
              <Text style={styles.statusButtonText}>직원 비활성화</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 직원이 승인 대기 상태일 때 승인 버튼을 보여줌 */}
        {employee.status === 'PENDING' && (
          <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
            <Text style={styles.approveButtonText}>근무 신청 승인하기</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 16 },
  profileSection: { alignItems: 'center', paddingVertical: 20, backgroundColor: colors.card, borderRadius: 12, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  role: { fontSize: 16, color: colors.subText, marginTop: 4 },
  statusBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginTop: 12 },
  activeBadge: { backgroundColor: colors.greenLight },
  activeStatusText: { fontSize: 12, fontWeight: 'bold', color: colors.green },
  pendingBadge: { backgroundColor: colors.yellowLight },
  pendingStatusText: { fontSize: 12, fontWeight: 'bold', color: colors.yellow },
  inactiveBadge: { backgroundColor: colors.gray },
  inactiveStatusText: { fontSize: 12, fontWeight: 'bold', color: colors.subText },
  section: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 15, color: colors.subText },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  statusButton: { backgroundColor: colors.redLight, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  statusButtonText: { color: colors.red, fontSize: 16, fontWeight: 'bold' },
  approveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  approveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuItemText: { fontSize: 16, color: colors.text },
  arrow: { fontSize: 20, color: colors.subText },
});

export default EmployeeDetailScreen;
