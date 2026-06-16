import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';

const SubstituteMatchingScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { initialTab } = route.params || {};
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { shifts, employees } = useSchedule();
  const { userInfo } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab || 'new'); // 'new' or 'history'

  const myRequests = useMemo(() => 
    shifts.filter(s => s.userId === userInfo?.id && s.status === 'SUBSTITUTE_REQ'), 
  [shifts, userInfo]);

  const myApplications = useMemo(() => 
    // This is a simplified logic. A real app would have a separate 'applications' table.
    // Here, we'll just show shifts that are open for substitution.
    shifts.filter(s => s.status === 'SUBSTITUTE_REQ' && s.userId !== userInfo?.id),
  [shifts, userInfo]);

  const handleApply = (shiftToTake: any) => {
    Alert.alert(
      "대타 지원",
      `${shiftToTake.user.name}님의 ${format(new Date(shiftToTake.date), "M월 d일")} 근무에 지원하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "지원",
          onPress: () => {
            Toast.show({
              type: 'success',
              text1: '지원 완료',
              text2: '대타 지원이 완료되었습니다. 관리자 승인을 기다려주세요.',
            });
          },
        },
      ]
    );
  };

  const renderNewItem = ({ item }: { item: any }) => {
    const user = employees.find(e => e.id === item.userId);
    if (!user) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.colorDot, { backgroundColor: user.color }]} />
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <Text style={styles.dateText}>{format(new Date(item.date), "M월 d일 (eee)", { locale: ko })}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.timeText}>🕒 {item.time}</Text>
          <Text style={styles.reasonText}>사유: {item.reason || '개인 사정'}</Text>
        </View>
        <TouchableOpacity style={styles.applyButton} onPress={() => handleApply({ ...item, user })}>
          <Text style={styles.applyButtonText}>지원하기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
     const user = employees.find(e => e.id === item.userId);
     return (
        <View style={[styles.card, styles.historyCard]}>
            <Text style={styles.historyDate}>{format(new Date(item.date), "M월 d일 (eee)", { locale: ko })}</Text>
            <Text style={styles.historyTime}>{item.time}</Text>
            <View style={[styles.statusBadge, item.status === 'SUBSTITUTE_REQ' ? styles.pendingBadge : styles.approvedBadge]}>
                <Text style={styles.statusText}>{item.status === 'SUBSTITUTE_REQ' ? '요청 중' : '지원 완료'}</Text>
            </View>
        </View>
     )
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대타 매칭</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'new' && styles.tabActive]} onPress={() => setActiveTab('new')}>
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>새로운 대타</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>나의 내역</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <FlatList
          data={myApplications}
          renderItem={renderNewItem}
          keyExtractor={(item) => `new-${item.id}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>현재 올라온 대타 요청이 없습니다.</Text>}
        />
      ) : (
        <FlatList
          data={myRequests}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => `hist-${item.id}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>나의 대타 내역이 없습니다.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { flex: 1, padding: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.subText, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  dateText: { fontSize: 14, color: colors.subText },
  cardBody: { marginBottom: 16, paddingLeft: 18 },
  timeText: { fontSize: 16, color: colors.text, marginBottom: 8 },
  reasonText: { fontSize: 14, color: colors.subText, fontStyle: 'italic' },
  applyButton: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 16, fontWeight: '600', color: colors.text },
  historyTime: { fontSize: 15, color: colors.subText },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  approvedBadge: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
});

export default SubstituteMatchingScreen;