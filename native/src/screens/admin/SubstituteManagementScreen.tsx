import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import { getSubstitutePostsAPI, approveSubstituteAPI } from '../../../api/auth';

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubstituteRequests = async () => {
    if (!userInfo || !userInfo.store_id) return;
    setLoading(true);
    try {
      const res = await getSubstitutePostsAPI(userInfo.store_id);
      // TODO: 백엔드에 status='SELECTED'인 데이터만 가져오는 API가 필요.
      // 지금은 임시로 'OPEN' 상태이고, 지원자가 있는 경우만 필터링.
      const filtered = res.data.filter((post: any) => post.status === 'OPEN' && post.applicants && post.applicants.length > 0);
      setRequests(filtered);
    } catch (error) {
      console.error("대타 신청 목록 조회 실패:", error);
      Toast.show({ type: 'error', text1: '오류', text2: '데이터를 불러오는 데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubstituteRequests();
    }, [userInfo])
  );

  const handleApprove = (post: any) => {
    // TODO: 직원이 선택한 지원자 정보를 post 객체에 담아서 와야 함.
    // 지금은 임시로 첫 번째 지원자를 선택한 것으로 간주.
    const selectedApplicant = post.applicants[0];
    if (!selectedApplicant) {
      Alert.alert("오류", "선택된 지원자 정보가 없습니다.");
      return;
    }

    Alert.alert("대타 최종 승인", `${post.requester_name}님의 근무를 ${selectedApplicant.name}님으로 변경하시겠습니까?`, [
      { text: "취소", style: 'cancel' },
      { text: "승인", onPress: async () => {
        try {
          await approveSubstituteAPI(post.shift_id, selectedApplicant.id, {
            post_id: post.id,
            original_user_id: post.requester_id,
            substitute_user_id: selectedApplicant.id,
          });
          Toast.show({ type: 'success', text1: "승인 완료", text2: "대타 근무가 확정되었습니다." });
          fetchSubstituteRequests(); // 목록 새로고침
        } catch (error) {
          console.error("대타 승인 실패:", error);
          Alert.alert("오류", "대타 승인 중 문제가 발생했습니다.");
        }
      }}
    ]);
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const selectedApplicant = item.applicants[0]; // 임시로 첫 번째 지원자 표시
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.badge}>{t('substitute')}</Text>
          <Text style={styles.dateText}>{format(new Date(item.shift_start_time), 'M월 d일 (eee)', { locale: ko })}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>요청자</Text>
            <Text style={styles.infoValue}>{item.requester_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>지원자</Text>
            <Text style={styles.infoValue}>{selectedApplicant?.name || '선택 대기중'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('workTime')}</Text>
            <Text style={styles.infoValue}>{`${format(new Date(item.shift_start_time), 'HH:mm')} - ${format(new Date(item.shift_end_time), 'HH:mm')}`}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApprove(item)}>
            <Text style={styles.approveButtonText}>최종 승인</Text>
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
        <Text style={styles.headerTitle}>대타 요청 관리</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>승인 대기 중인 대타 요청이 없습니다.</Text>}
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
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.gray },
  badge: { fontSize: 12, fontWeight: 'bold', color: colors.white, backgroundColor: colors.purple, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  dateText: { fontSize: 14, color: colors.subText },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 15, color: colors.subText },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row' },
  button: { flex: 1, padding: 16, alignItems: 'center' },
  approveButton: { backgroundColor: colors.greenLight },
  approveButtonText: { color: colors.green, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
});

export default SubstituteManagementScreen;
