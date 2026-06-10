import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';

const AdminDailyScheduleScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { date, shifts, employees } = route.params; // 월간 캘린더로부터 근무 데이터와 직원 목록을 직접 전달받음
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  
  const [dailyShifts, setDailyShifts] = useState(shifts);
  
  const formattedDate = format(new Date(date), "M월 d일 (eee)", { locale: ko });

  const handleSaveShift = (newShift: any) => {
    const user = employees.find((u: any) => u.id === newShift.userId);
    if (!user) return;

    if (newShift.original) {
      setDailyShifts((prev: any) => prev.map((s: any) => (s.userId === newShift.original.userId && s.time === newShift.original.time) ? { ...newShift, user } : s));
    } else {
      setDailyShifts((prev: any) => [...prev, { ...newShift, user }]);
    }
  };

  const handleDeleteShift = (shiftToDelete: any) => {
    setDailyShifts((prev: any) => prev.filter((s: any) => !(s.userId === shiftToDelete.userId && s.time === shiftToDelete.time)));
  };

  const handleNavigateToEditor = (shiftData = null) => {
    navigation.navigate('ShiftEditor', {
      shiftData,
      employees,
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
    color: '#EF4444',
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