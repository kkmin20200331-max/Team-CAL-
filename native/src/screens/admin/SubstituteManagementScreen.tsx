import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSchedule } from '../../contexts/ScheduleContext'; // 1. useSchedule 훅 임포트

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  // 2. 전역 상태에서 shifts, employees, setShifts 가져오기
  const { shifts, employees, setShifts } = useSchedule();
  
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
        // 3. 전역 setShifts 함수를 사용하여 상태 업데이트
        setShifts(prevShifts => prevShifts.map(shift => 
          shift.id === item.id ? { ...shift, status: 'APPROVED' } : shift
        ));
      }}
    ]);
  };

  const handleDecline = (item: any) => {
    Alert.alert("요청 거절", `${item.user.name}의 대타 요청을 거절하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "거절", style: "destructive", onPress: () => {
        // 3. 전역 setShifts 함수를 사용하여 상태 업데이트
        setShifts(prevShifts => prevShifts.map(shift => 
          shift.id === item.id ? { ...shift, status: 'CONFIRMED' } : shift
        ));
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