import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { Shift } from '../../types/Schedule';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  requests: Shift[];
};

const RequestManagementModal = ({ isVisible, onClose, requests }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees, updateShift } = useSchedule();

  const handleApprove = (shift: Shift) => {
    const newStatus = shift.status === 'LEAVE_REQ' ? 'OFF' : 'CONFIRMED'; // 대타 요청 승인은 일단 확정으로 변경
    updateShift({ ...shift, status: newStatus, time: newStatus === 'OFF' ? '휴무' : shift.time });
    Toast.show({ type: 'success', text1: '요청이 승인되었습니다.' });
  };

  const handleDecline = (shift: Shift) => {
    updateShift({ ...shift, status: 'SCHEDULED' }); // 거절 시 '근무 예정'으로 복구
    Toast.show({ type: 'info', text1: '요청이 거절되었습니다.' });
  };

  const renderRequestItem = ({ item }: { item: Shift }) => {
    const user = employees.find(e => e.id === item.userId);
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
          <Text style={styles.employeeName}>{user?.name || '알 수 없음'}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
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
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent}>
          <Text style={styles.modalTitle}>요청 관리</Text>
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>새로운 요청이 없습니다.</Text>}
            contentContainerStyle={{ maxHeight: '80%' }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: colors.card, borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  emptyText: { textAlign: 'center', color: colors.subText, paddingVertical: 40 },
  card: { backgroundColor: colors.background, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reqType: { fontSize: 14, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  leaveReq: { backgroundColor: '#FFEDD5', color: '#F97316' },
  subReq: { backgroundColor: '#FEF3C7', color: '#D97706' },
  dateText: { fontSize: 13, color: colors.subText },
  cardBody: { marginBottom: 16 },
  employeeName: { fontSize: 16, fontWeight: '600', color: colors.text },
  timeText: { fontSize: 14, color: colors.subText, marginTop: 4 },
  buttonContainer: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  declineButton: { backgroundColor: '#FEE2E2' },
  declineButtonText: { color: '#EF4444', fontWeight: 'bold' },
  approveButton: { backgroundColor: '#D1FAE5' },
  approveButtonText: { color: '#065F46', fontWeight: 'bold' },
});

export default RequestManagementModal;