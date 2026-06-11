import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format, getDaysInMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

const dummyEmployees = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2', payType: 'SALARY' as const, payRate: 3000000 },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2', payType: 'HOURLY' as const, payRate: 10000 },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623', payType: 'HOURLY' as const, payRate: 9860 },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0', payType: 'SALARY' as const, payRate: 2500000 },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE', payType: 'HOURLY' as const, payRate: 11000 },
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
        shifts.push({ id: `s_${day}_1`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '09:00-17:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_2`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00', status: 'CONFIRMED', reason: '' });
      } else if (day % 4 === 0) {
        shifts.push({ id: `s_${day}_3`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '08:00-16:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_4`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00', status: 'SUBSTITUTE_REQ', reason: '병원 진료' });
        shifts.push({ id: `s_${day}_5`, userId: dummyEmployees[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00', status: 'CONFIRMED', reason: '' });
      }
    } else if (dayOfWeek === 6) {
      shifts.push({ id: `s_${day}_6`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '10:00-18:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_7`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '12:00-20:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_8`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '14:00-22:00', status: 'SUBSTITUTE_REQ', reason: '가족 행사' });
    }
  }
  return shifts;
};

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [shifts, setShifts] = useState(generateDummyShifts(new Date()));
  const [employees, setEmployees] = useState(dummyEmployees);
  
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const subRequests = shifts
      .filter(s => s.status === 'SUBSTITUTE_REQ')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(s => ({ ...s, user: employees.find(e => e.id === s.userId) }));
    setRequests(subRequests);
  }, [shifts, employees]);

  const handleApprove = (item: any) => {
    Alert.alert("요청 승인", `${item.user.name}의 대타 요청을 승인하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "승인", onPress: () => {
        const updatedShifts = shifts.map(shift => 
          shift.id === item.id ? { ...shift, status: 'APPROVED' } : shift
        );
        setShifts(updatedShifts);
      }}
    ]);
  };

  const handleDecline = (item: any) => {
    Alert.alert("요청 거절", `${item.user.name}의 대타 요청을 거절하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "거절", style: "destructive", onPress: () => {
        const updatedShifts = shifts.map(shift => 
          shift.id === item.id ? { ...shift, status: 'CONFIRMED' } : shift
        );
        setShifts(updatedShifts);
      }}
    ]);
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.employeeName}>{item.user.name}</Text>
        <Text style={styles.dateText}>{format(new Date(item.date), "M월 d일 (eee)", { locale: ko })}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.timeText}>🕒 {item.time}</Text>
        <Text style={styles.reasonText}>사유: {item.reason}</Text>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={() => handleDecline(item)}>
          <Text style={styles.declineButtonText}>거절</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApprove(item)}>
          <Text style={styles.approveButtonText}>승인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대타 요청 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>새로운 대타 요청이 없습니다.</Text>}
      />
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
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 16 },
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
  dateText: { fontSize: 14, color: colors.subText },
  cardBody: { marginBottom: 16 },
  timeText: { fontSize: 16, color: colors.text, marginBottom: 8 },
  reasonText: { fontSize: 14, color: colors.subText, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  declineButton: {
    backgroundColor: '#E5E7EB',
  },
  declineButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#34D399',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subText,
  },
});

export default SubstituteManagementScreen;