import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { useSchedule } from '../../contexts/ScheduleContext';
import { deleteShiftAPI } from '../../../api/auth';

const AdminDailyScheduleScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { date, shifts: paramShifts, employees: paramEmployees } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  
  const { shifts: contextShifts, employees: contextEmployees, deleteShift } = useSchedule();

  const shifts = paramShifts || contextShifts || [];
  const employees = paramEmployees || contextEmployees || [];
  
  const [dailyShifts, setDailyShifts] = useState(() => 
    shifts.filter((s: any) => s.date === date).map((s: any) => ({
      ...s,
      user: employees.find((e: any) => e.id === s.userId)
    }))
  );

  useEffect(() => {
    setDailyShifts(shifts.filter((s: any) => s.date === date).map((s: any) => ({
      ...s,
      user: employees.find((e: any) => e.id === s.userId)
    })));
  }, [shifts, date, employees]);
  
  const formattedDate = format(new Date(date), "M월 d일 (eee)", { locale: ko });

  const handleNavigateToEditor = (shiftToEdit = null) => {
    navigation.navigate('ShiftEditor', {
      isEdit: !!shiftToEdit,
      shift: shiftToEdit,
      date,
    });
  };

  const confirmDelete = (item: any) => {
    Alert.alert(
      "근무 삭제",
      `${item.user.name} (${item.time}) 근무를 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              // 선민 수정 (2026-07-06): 로컬 상태 삭제뿐만 아니라 백엔드 API를 호출해 실제 DB 데이터도 삭제하도록 반영
              await deleteShiftAPI(item.id);
              deleteShift(item.id);
            } catch (error) {
              console.error("근무 삭제 실패:", error);
              Alert.alert("에러", "근무 삭제에 실패했습니다.");
            }
          }
        }
      ]
    );
  };

  const renderStatusBadge = (status?: string) => {
    const upper = (status || '').toUpperCase();
    if (upper === 'VACANT') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.badgeText, { color: '#EF4444' }]}>휴가(취소)</Text>
        </View>
      );
    }
    if (upper === 'LEAVE_PENDING') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.badgeText, { color: '#D97706' }]}>휴가 신청</Text>
        </View>
      );
    }
    if (upper === 'SUBSTITUTE_REQ') {
      return (
        <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
          <Text style={[styles.badgeText, { color: '#0284C7' }]}>대타 요청</Text>
        </View>
      );
    }
    return null;
  };

  const renderShiftItem = ({ item }: { item: any }) => (
    <View style={styles.shiftCard}>
      <TouchableOpacity style={styles.touchableArea} onPress={() => handleNavigateToEditor(item)}>
        <View style={[styles.userColorIndicator, { backgroundColor: item.user?.color || '#A1A1AA' }]} />
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userName}>{item.user?.name || '알 수 없음'}</Text>
            {renderStatusBadge(item.status)}
          </View>
          <Text style={styles.userRole}>{item.user?.role || ''}</Text>
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
        keyExtractor={(item, index) => `${item.id}-${index}`}
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
    color: colors.text,
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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
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
    color: colors.text,
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