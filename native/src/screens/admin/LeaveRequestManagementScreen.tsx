import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { getLeaveRequestsAPI, processLeaveRequestAPI } from '../../../api/auth';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const LeaveRequestManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = async () => {
    if (!userInfo || !userInfo.store_id) return;
    setLoading(true);
    try {
      const res = await getLeaveRequestsAPI(userInfo.store_id);
      setRequests(res.data);
    } catch (error) {
      console.error("휴무 신청 목록 조회 실패:", error);
      Alert.alert("오류", "휴무 신청 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeaveRequests();
    }, [userInfo])
  );

  const handleProcessRequest = (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const actionText = status === 'APPROVED' ? '승인' : '거절';
    Alert.alert(
      `휴무 신청 ${actionText}`,
      `이 휴무 신청을 ${actionText}하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: async () => {
            try {
              // URL: /api/leave_request/{id}?status={status} (PUT)
              // DB: LEAVE_REQUESTS 테이블에서 해당 요청의 status를 'APPROVED' 또는 'REJECTED'로 변경
              await processLeaveRequestAPI(requestId, status);
              Alert.alert("성공", `요청이 ${actionText}되었습니다.`);
              fetchLeaveRequests(); // 목록 새로고침
            } catch (error) {
              console.error(`휴무 신청 ${actionText} 처리 오류:`, error);
              Alert.alert("오류", `처리 중 문제가 발생했습니다.`);
            }
          },
        },
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.employeeName}>{item.user_name}</Text>
        <Text style={styles.requestDate}>{format(new Date(item.requested_at), 'yyyy.MM.dd')}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.shiftInfo}>
          {format(new Date(item.shift_start_time), 'M월 d일 (eee) HH:mm')} - {format(new Date(item.shift_end_time), 'HH:mm')}
        </Text>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleProcessRequest(item.id, 'REJECTED')}>
          <Text style={styles.rejectButtonText}>거절</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => handleProcessRequest(item.id, 'APPROVED')}>
          <Text style={styles.approveButtonText}>승인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>휴무 신청 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>대기 중인 휴무 신청이 없습니다.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 16, gap: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyText: { fontSize: 16, color: colors.subText },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  employeeName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  requestDate: { fontSize: 13, color: colors.subText },
  cardBody: { marginBottom: 16 },
  shiftInfo: { fontSize: 14, color: colors.subText, marginBottom: 8 },
  reason: { fontSize: 15, color: colors.text, lineHeight: 22 },
  buttonContainer: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  rejectButton: { backgroundColor: colors.redLight },
  rejectButtonText: { color: colors.red, fontSize: 15, fontWeight: '600' },
  approveButton: { backgroundColor: colors.primary },
  approveButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});

export default LeaveRequestManagementScreen;
