import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  approveSubstituteAPI,
  cancelSubstitutePostAPI,
  getStoreShiftsAPI,
  getStoreStaffAPI,
  getSubstituteApplicationsAPI,
  getSubstitutePostsAPI,
} from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

type SubstituteRequest = {
  post: any;
  applications: any[];
  shift?: any;
};

const normalizeShift = (shift: any) => ({
  ...shift,
  id: shift.id,
  userId: shift.user_id || shift.userId,
  date: shift.work_date || shift.date,
  time: shift.time || (
    shift.start_time && shift.end_time
      ? `${String(shift.start_time).slice(0, 5)}-${String(shift.end_time).slice(0, 5)}`
      : ''
  ),
});

const isActiveSubstitutePost = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  return !['canceled', 'cancelled', 'closed', 'rejected'].includes(normalized);
};

const isPendingSubstituteApplication = (status?: string) => {
  return (status || '').toLowerCase() === 'pending';
};

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [requests, setRequests] = useState<SubstituteRequest[]>([]);
  const [staffMap, setStaffMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getUserName = (userId?: string) => {
    if (!userId) return '정보없음';
    const user = staffMap.get(userId);
    return user?.name || user?.username || userId;
  };

  const loadRequests = useCallback(async () => {
    if (!storeId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

      const [postResponse, staffResponse, shiftResponse] = await Promise.all([
        getSubstitutePostsAPI(storeId),
        getStoreStaffAPI(storeId),
        getStoreShiftsAPI(storeId, startDate, endDate),
      ]);

      const staff = Array.isArray(staffResponse.data) ? staffResponse.data : [];
      const nextStaffMap = new Map(staff.map((user: any) => [user.id, user]));
      setStaffMap(nextStaffMap);

      const shifts = (Array.isArray(shiftResponse.data) ? shiftResponse.data : []).map(normalizeShift);
      const shiftMap = new Map(shifts.map((shift: any) => [shift.id, shift]));

        const posts = Array.isArray(postResponse.data) ? postResponse.data : [];
        const items = await Promise.all(
          posts
          .filter((post: any) => isActiveSubstitutePost(post.status))
          .map(async (post: any) => {
            const appResponse = await getSubstituteApplicationsAPI(post.id);
            return {
              post,
              applications: (Array.isArray(appResponse.data) ? appResponse.data : [])
                .filter((app: any) => isPendingSubstituteApplication(app.status)),
              shift: shiftMap.get(post.shift_id),
            };
          }),
      );

      setRequests(items);
    } catch (error) {
      console.error('대타 요청 조회 오류:', error);
      Toast.show({
        type: 'error',
        text1: '조회 실패',
        text2: '대타 요청 목록을 불러오지 못했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApprove = (item: SubstituteRequest, application: any) => {
    Alert.alert(
      '대타 승인',
      `${getUserName(application.applicant_user_id)}님을 대타로 승인하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          onPress: async () => {
            setProcessingId(application.id);
            try {
              await approveSubstituteAPI(item.post.shift_id, application.applicant_user_id, {
                id: `SH_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
                shift_id: item.post.shift_id,
                store_id: item.post.store_id,
                original_user_id: item.post.requester_user_id,
                substitute_user_id: application.applicant_user_id,
                approved_by: userInfo?.id,
              });

              Toast.show({
                type: 'success',
                text1: '승인 완료',
                text2: '대타 근무자가 변경되었습니다.',
              });
              await loadRequests();
            } catch (error) {
              console.error('대타 승인 오류:', error);
              Alert.alert('승인 실패', '대타 승인 처리 중 오류가 발생했습니다.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleRejectPost = (item: SubstituteRequest) => {
    Alert.alert('대타 거절', '해당 대타 요청을 거절하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '거절하기',
        style: 'destructive',
        onPress: async () => {
          setProcessingId(item.post.id);
          try {
            await cancelSubstitutePostAPI(item.post.id);
            Toast.show({ type: 'success', text1: '거절 완료', text2: '대타 요청을 거절하였습니다.' });
            await loadRequests();
          } catch (error) {
            console.error('대타 요청 거절 오류:', error);
            Alert.alert('거절 실패', '대타 요청 거절 중 오류가 발생했습니다.');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const renderRequestItem = ({ item }: { item: SubstituteRequest }) => {
    const shift = item.shift;
    const pendingApplications = item.applications.filter((app) => app.status !== 'CANCELED' && app.status !== 'REJECTED');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.employeeName}>{getUserName(item.post.requester_user_id)}</Text>
          <Text style={styles.statusText}>{item.post.status || 'OPEN'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.timeText}>
            {shift?.date ? format(new Date(shift.date), 'M월 d일 (eee)', { locale: ko }) : '날짜 확인 필요'}
          </Text>
          <Text style={styles.timeText}>시간: {shift?.time || item.post.shift_id}</Text>
          <Text style={styles.reasonText}>사유: {item.post.reason || '-'}</Text>
          <Text style={styles.applyCount}>지원자 {pendingApplications.length}명</Text>
        </View>

        {pendingApplications.map((application) => (
          <View key={application.id} style={styles.applicationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.applicationName}>{getUserName(application.applicant_user_id)}</Text>
              <Text style={styles.applicationMessage}>{application.message || '메시지 없음'}</Text>
            </View>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(item, application)}
              disabled={processingId === application.id}
            >
              {processingId === application.id ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.approveButtonText}>승인</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleRejectPost(item)}
          disabled={processingId === item.post.id}
        >
          <Text style={styles.cancelButtonText}>거절</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대타 요청 관리</Text>
        <TouchableOpacity onPress={loadRequests}>
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {loading && requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>대타 요청을 불러오는 중입니다.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.post.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>새로운 대타 요청이 없습니다.</Text>}
        />
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
  backButton: { fontSize: 28, color: colors.primary, width: 72 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  refreshText: { color: colors.primary, fontSize: 13, fontWeight: '800', width: 72, textAlign: 'right' },
  listContainer: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  employeeName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statusText: { fontSize: 13, color: colors.primary, fontWeight: '800' },
  cardBody: { marginBottom: 16 },
  timeText: { fontSize: 16, color: colors.text, marginBottom: 8 },
  reasonText: { fontSize: 14, color: colors.subText, fontStyle: 'italic', marginBottom: 8 },
  applyCount: { fontSize: 14, color: colors.primary, fontWeight: '800' },
  applicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
  },
  applicationName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  applicationMessage: { color: colors.subText, fontSize: 13, marginTop: 3 },
  approveButton: {
    backgroundColor: '#34D399',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancelButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 14,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '800',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subText,
  },
});

export default SubstituteManagementScreen;
