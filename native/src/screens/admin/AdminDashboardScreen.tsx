import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { useScheduleStore } from '../../store/scheduleStore'; // 전역 스토어 임포트

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const isFocused = useIsFocused();

  // ★★★ 수정된 부분: 전역 스토어에서 데이터와 함수를 가져옴 ★★★
  const { shifts, employees } = useScheduleStore();

  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [substituteRequests, setSubstituteRequests] = useState(0);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      const filteredTodayShifts = shifts
        .filter(s => s.date === todayStr)
        .map(s => ({ ...s, user: employees.find(e => e.id === s.userId) }));
      
      setTodayShifts(filteredTodayShifts);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const workingNowCount = filteredTodayShifts.filter(shift => {
        const [startStr, endStr] = shift.time.split('-');
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }).length;

      setCurrentlyWorking(workingNowCount);

      const subCount = shifts.filter(s => s.status === 'SUBSTITUTE_REQ').length;
      setSubstituteRequests(subCount);
    }
  }, [isFocused, shifts]); // shifts가 변경될 때마다 다시 계산

  const handleNavigateToDailySchedule = () => {
    navigation.navigate('AdminDailySchedule', {
      date: format(new Date(), 'yyyy-MM-dd'),
      shifts: todayShifts,
      employees: employees,
    });
  };

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
          <TouchableOpacity style={styles.summaryBox} onPress={handleNavigateToDailySchedule}>
            <Text style={styles.summaryValue}>{currentlyWorking}명</Text>
            <Text style={styles.summaryLabel}>현재 근무중</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryBox} onPress={() => navigation.navigate('SubstituteManagement')}>
            <Text style={styles.summaryValue}>{substituteRequests}건</Text>
            <Text style={styles.summaryLabel}>대타 요청</Text>
          </TouchableOpacity>
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