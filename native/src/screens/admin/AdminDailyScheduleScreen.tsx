import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';

// --- 더미 데이터 (AdminScheduleScreen과 일관성 유지) ---
const dummyUsers = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2' },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2' },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623' },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0' },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE' },
];

const generateDummyShiftsForDate = (date: string) => {
  // 실제 앱에서는 API 호출로 이 데이터를 가져옵니다.
  // 여기서는 간단한 예시를 위해 날짜의 마지막 숫자를 기반으로 생성합니다.
  const day = parseInt(date.slice(-2), 10);
  const shifts = [];
  if (day % 5 === 1) {
    shifts.push({ userId: 'user_1', time: '09:00-15:00' });
    shifts.push({ userId: 'user_3', time: '15:00-22:00' });
  } else if (day % 5 === 2) {
    shifts.push({ userId: 'user_2', time: '09:00-17:00' });
    shifts.push({ userId: 'user_4', time: '14:00-22:00' });
  } else if (day % 5 === 3) {
    shifts.push({ userId: 'user_5', time: '10:00-18:00' });
    shifts.push({ userId: 'user_1', time: '18:00-22:00' });
  } else {
     shifts.push({ userId: 'user_2', time: '09:00-15:00' });
     shifts.push({ userId: 'user_3', time: '15:00-21:00' });
     shifts.push({ userId: 'user_4', time: '17:00-22:00' });
  }
  return shifts.map(s => ({ ...s, user: dummyUsers.find(u => u.id === s.userId) }));
};

const AdminDailyScheduleScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { date } = route.params; // 'yyyy-MM-dd' 형식의 날짜
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const formattedDate = format(new Date(date), "M월 d일 (eee)", { locale: ko });
  const dailyShifts = generateDummyShiftsForDate(date);

  const renderShiftItem = ({ item }: { item: any }) => (
    <View style={styles.shiftCard}>
      <View style={[styles.userColorIndicator, { backgroundColor: item.user.color }]} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user.name}</Text>
        <Text style={styles.userRole}>{item.user.role}</Text>
      </View>
      <View style={styles.timeInfo}>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formattedDate}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={dailyShifts}
        renderItem={renderShiftItem}
        keyExtractor={(item, index) => `${item.userId}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>이날은 근무가 없습니다.</Text>}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  userColorIndicator: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 4,
  },
  timeInfo: {
    paddingHorizontal: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subText,
  },
});

export default AdminDailyScheduleScreen;