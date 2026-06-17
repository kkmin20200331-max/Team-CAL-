import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';
import { Shift } from '../../types/Schedule';

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { shifts, employees, updateShift } = useSchedule();

  // 1. 대타 요청과 휴무 요청을 모두 가져옴
  const pendingRequests = shifts.filter(s => s.status === 'SUBSTITUTE_REQ' || s.status === 'LEAVE_REQ');

  const handleApprove = (shift: Shift) => {
    const isLeaveReq = shift.status === 'LEAVE_REQ';
    const newStatus = isLeaveReq ? 'OFF' : 'CONFIRMED'; // 휴무 요청은 'OFF'로, 대타 요청은 일단 '확정'으로
    
    Alert.alert(
      "요청 승인",
      `${isLeaveReq ? '휴무' : '대타'} 요청을 승인하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "승인",
          onPress: () => {
            updateShift({ ...shift, status: newStatus, time: newStatus === 'OFF' ? '휴무' : shift.time });
            Toast.show({ type: 'success', text1: '요청이 승인되었습니다.' });
          },
        },
      ]
    );
  };

  const handleDecline = (shift: Shift) => {
    Alert.alert(
      "요청 거절",
      "이 요청을 거절하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "거절",
          style: "destructive",
          onPress: () => {
            updateShift({ ...shift, status: 'SCHEDULED' }); // 거절 시 '근무 예정'으로 복구
            Toast.show({ type: 'info', text1: '요청이 거절되었습니다.' });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Shift }) => {
    const user = employees.find(e => e.id === item.userId);
    if (!user) return null;
    const isLeaveReq = item.status === 'LEAVE_REQ';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.reqType, isLeaveReq ? styles.leaveReq : styles.subReq]}>
            {isLeaveReq ? '휴무 요청' : '대타 요청'}
          </Text>
          <Text style={styles.dateText}>{format(new Date(item.date), "M월 d일 (eee)", { locale: ko })}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.userInfo}>
            <View style={[styles.colorDot, { backgroundColor: user.color }]} />
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <Text style={styles.timeText}>🕒 {item.time}</Text>
          <Text style={styles.reasonText}>사유: {item.reason || '개인 사정'}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={() => handleDecline(item)}>
            <Text style={styles.declineButtonText}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApprove(item)}>
            <Text style={styles.approveButtonText}>승인</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>요청 관리</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={pendingRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>새로운 요청이 없습니다.</Text>}
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reqType: { fontSize: 14, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  leaveReq: { backgroundColor: '#FFEDD5', color: '#F97316' },
  subReq: { backgroundColor: '#FEF3C7', color: '#D97706' },
  dateText: { fontSize: 13, color: colors.subText },
  cardBody: { marginBottom: 16, paddingLeft: 4 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  timeText: { fontSize: 15, color: colors.text, marginBottom: 8, marginLeft: 18 },
  reasonText: { fontSize: 14, color: colors.subText, fontStyle: 'italic', marginLeft: 18 },
  buttonContainer: { flexDirection: 'row', gap: 10, marginTop: 8 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  declineButton: { backgroundColor: '#FEE2E2' },
  declineButtonText: { color: '#EF4444', fontWeight: 'bold' },
  approveButton: { backgroundColor: '#D1FAE5' },
  approveButtonText: { color: '#065F46', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
});

export default SubstituteManagementScreen;