import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format, getDaysInMonth } from 'date-fns';

// --- 데이터 소스 (다른 화면과 일관성 유지) ---
const dummyEmployees = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2' },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2' },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623' },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0' },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE' },
];

const generateDummyShifts = (month: Date) => {
  const shifts = [];
  const daysInMonth = getDaysInMonth(month);
  const monthStr = format(month, 'yyyy-MM');

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (day % 2 !== 0) {
        shifts.push({ userId: dummyEmployees[day % 5].id, date: dateStr, time: '09:00-17:00', status: 'CONFIRMED' });
        shifts.push({ userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00', status: 'CONFIRMED' });
      }
      else if (day % 4 === 0) {
        shifts.push({ userId: dummyEmployees[day % 5].id, date: dateStr, time: '08:00-16:00', status: 'CONFIRMED' });
        shifts.push({ userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00', status: 'SUBSTITUTE_REQ' }); // 대타 요청
        shifts.push({ userId: dummyEmployees[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00', status: 'CONFIRMED' });
      }
    }
    else if (dayOfWeek === 6) {
        shifts.push({ userId: dummyEmployees[day % 5].id, date: dateStr, time: '10:00-18:00', status: 'CONFIRMED' });
        shifts.push({ userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '12:00-20:00', status: 'CONFIRMED' });
        shifts.push({ userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '14:00-22:00', status: 'SUBSTITUTE_REQ' }); // 대타 요청
    }
  }
  return shifts;
};


const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [substituteRequests, setSubstituteRequests] = useState(0);

  useEffect(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const allShifts = generateDummyShifts(now);

    // 1. 현재 근무중인 인원 계산
    const todayShifts = allShifts.filter(s => s.date === todayStr);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const workingNowCount = todayShifts.filter(shift => {
      const [startStr, endStr] = shift.time.split('-');
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }).length;

    setCurrentlyWorking(workingNowCount);

    // 2. 대타 요청 건수 계산
    const subCount = allShifts.filter(s => s.status === 'SUBSTITUTE_REQ').length;
    setSubstituteRequests(subCount);

  }, []); // 컴포넌트가 마운트될 때 한 번만 실행

  const menuItems = [
    { title: '직원 관리', icon: '👥', screen: 'EmployeeManagement' },
    { title: '월간 근무표 보기', icon: '📅', screen: 'AdminSchedule' },
    { title: '급여 정산', icon: '💰', screen: 'Payroll' },
    { title: '공지사항 관리', icon: '📢', screen: 'NoticeManagement' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관리자 대시보드</Text>
          <Text style={styles.storeName}>컴포즈 미금점</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{currentlyWorking}명</Text>
            <Text style={styles.summaryLabel}>현재 근무중</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{substituteRequests}건</Text>
            <Text style={styles.summaryLabel}>대타 요청</Text>
          </View>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  storeName: {
    fontSize: 16,
    color: colors.subText,
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  summaryBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    width: '45%',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;