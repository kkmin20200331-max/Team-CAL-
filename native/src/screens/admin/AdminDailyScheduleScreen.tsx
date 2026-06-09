import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';

const dummyEmployees = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2' },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2' },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623' },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0' },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE' },
];

const generateDummyShiftsForDate = (date: string) => {
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
  return shifts.map(s => ({ ...s, user: dummyEmployees.find(u => u.id === s.userId) }));
};

const AdminDailyScheduleScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { date } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  
  const [dailyShifts, setDailyShifts] = useState(() => generateDummyShiftsForDate(date));
  
  const formattedDate = format(new Date(date), "M월 d일 (eee)", { locale: ko });

  const handleSaveShift = (newShift: any) => {
    const user = dummyEmployees.find(u => u.id === newShift.userId);
    if (!user) return;

    if (newShift.original) {
      setDailyShifts(prev => prev.map(s => (s.userId === newShift.original.userId && s.time === newShift.original.time) ? { ...newShift, user } : s));
    } else {
      setDailyShifts(prev => [...prev, { ...newShift, user }]);
    }
  };

  const handleDeleteShift = (shiftToDelete: any) => {
    setDailyShifts(prev => prev.filter(s => !(s.userId === shiftToDelete.userId && s.time === shiftToDelete.time)));
  };

  const handleNavigateToEditor = (shiftData = null) => {
    navigation.navigate('ShiftEditor', {
      shiftData,
      employees: dummyEmployees,
      date,
      onSave: handleSaveShift,
      onDelete: handleDeleteShift,
    });
  };

  const confirmDelete = (item: any) => {
    Alert.alert(
      "근무 삭제",
      `${item.user.name} (${item.time}) 근무를 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => handleDeleteShift(item) }
      ]
    );
  };

  const renderShiftItem = ({ item }: { item: any }) => (
    <View style={styles.shiftCard}>
      <TouchableOpacity style={styles.touchableArea} onPress={() => handleNavigateToEditor(item)}>
        <View style={[styles.userColorIndicator, { backgroundColor: item.user.color }]} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.userRole}>{item.user.role}</Text>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item)}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formattedDate}</Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={dailyShifts}
        renderItem={renderShiftItem}
        keyExtractor={(item, index) => `${item.userId}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>이날은 근무가 없습니다.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => handleNavigateToEditor()}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 50,
    alignItems: 'center',
  },
  backButton: {
    fontSize: 24,
    color: colors.primary,
    textAlign: 'left',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 16,
  },
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    color: '#EF4444', // ★★★ 수정된 부분 ★★★
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subText,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 30,
    color: 'white',
    lineHeight: 32,
  },
});

export default AdminDailyScheduleScreen;