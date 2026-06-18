import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';

const SubstituteMatchingScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { initialTab = 'requests' } = route.params || {};
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const { shifts, employees, applyForSubstitute } = useSchedule();

  const [activeTab, setActiveTab] = useState(initialTab);

  const substituteRequests = useMemo(() => 
    shifts
      .filter(s => s.status === 'SUBSTITUTE_REQ' && s.userId !== userInfo?.id)
      .map(s => ({ ...s, user: employees.find(e => e.id === s.userId) })),
    [shifts, employees, userInfo]
  );

  const myRequests = useMemo(() =>
    shifts.filter(s => s.status === 'SUBSTITUTE_REQ' && s.userId === userInfo?.id),
    [shifts, userInfo]
  );

  const myApplications = useMemo(() =>
    shifts.filter(s => s.applicants?.some(a => a.userId === userInfo?.id)),
    [shifts, userInfo]
  );

  const handleApply = (shiftId: string) => {
    if (!userInfo) return;
    Alert.alert("대타 지원", "이 근무에 대타로 지원하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "지원", onPress: async () => {
        try {
          await applyForSubstitute(shiftId, userInfo.id);
          Toast.show({ type: 'success', text1: '지원이 완료되었습니다.' });
        } catch (error) {
          Toast.show({ type: 'error', text1: '지원 중 오류가 발생했습니다.' });
        }
      }}
    ]);
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{format(new Date(item.date), 'M월 d일 (eee)', { locale: ko })}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: item.user?.color || colors.subText }]} />
          <Text style={styles.userName}>{item.user?.name || '알 수 없음'}</Text>
        </View>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>
      <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item.id)}>
        <Text style={styles.applyButtonText}>지원하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{format(new Date(item.date), 'M월 d일 (eee)', { locale: ko })}</Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>
      <View style={styles.statusFooter}>
        <Text style={styles.statusText}>
          {item.userId === userInfo?.id ? `내가 올린 요청` : `내가 지원한 요청`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대타 구인</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>대타 구해요</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>내역</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' ? (
        <FlatList
          data={substituteRequests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>현재 올라온 대타 요청이 없습니다.</Text>}
        />
      ) : (
        <FlatList
          data={[...myRequests, ...myApplications]}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>요청 또는 지원 내역이 없습니다.</Text>}
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
  tabContainer: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.subText },
  activeTabText: { color: colors.primary, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  timeText: { fontSize: 16, color: colors.subText },
  cardBody: { marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  userName: { fontSize: 15, color: colors.text },
  reasonText: { fontSize: 15, color: colors.subText, fontStyle: 'italic' },
  applyButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  statusFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 },
  statusText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
});

export default SubstituteMatchingScreen;