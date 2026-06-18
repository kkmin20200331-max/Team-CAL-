import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { Shift } from '../../types/Schedule';
import { format, addDays, startOfWeek, getDay, getDaysInMonth, getMonth, getYear, setMonth, startOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useApp } from '../../contexts/AppContext';
import { useSchedule } from '../../contexts/ScheduleContext';

const today = new Date();
const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
const initialSelectedDate = formatDate(today);
const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const generateWeekDates = (base: Date) => {
  const sunday = startOfWeek(base, { weekStartsOn: 0 });
  return Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(sunday, i);
    return { fullDate: formatDate(d), date: String(d.getDate()), dayIndex: d.getDay() };
  });
};

const ScheduleScreen = ({ navigation }: { navigation: any }) => {
  const { userInfo } = useApp();
  const { shifts, employees, setShifts: setGlobalShifts } = useSchedule();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [baseDate, setBaseDate] = useState(new Date());
  
  const mySchedule = useMemo(() => 
    shifts.map(shift => {
      const user = employees.find(e => e.id === shift.userId);
      return { ...shift, user, storeName: user?.brandName || '매장' };
    }).filter(shift => {
      if (userInfo?.role === 'ADMIN') return true;
      return shift.userId === userInfo?.id;
    })
  , [shifts, employees, userInfo]);

  const [isReqModalVisible, setReqModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'LEAVE' | 'SUBSTITUTE'>('LEAVE');
  const [reason, setReason] = useState('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isMonthModalVisible, setMonthModalVisible] = useState(false);

  const renderStatusBadge = (status: Shift['status']) => {
    const statusMap = {
      SCHEDULED: { style: styles.badgeScheduled, textStyle: styles.badgeTextScheduled, label: '근무 예정' },
      IN_PROGRESS: { style: styles.badgeInProgress, textStyle: styles.badgeTextInProgress, label: '근무중' },
      COMPLETED: { style: styles.badgeCompleted, textStyle: styles.badgeTextCompleted, label: '근무 완료' },
      SUBSTITUTE_REQ: { style: styles.badgeSubstitute, textStyle: styles.badgeTextSubstitute, label: '대타 요청중' },
      LEAVE_REQ: { style: styles.badgeLeaveReq, textStyle: styles.badgeTextLeaveReq, label: '휴무 신청 대기중' },
      OFF: { style: styles.badgeOff, textStyle: styles.badgeTextOff, label: '휴무' },
    };
    const currentStatus = statusMap[status];
    if (!currentStatus) return null;
    return <View style={[styles.badge, currentStatus.style]}><Text style={currentStatus.textStyle}>{currentStatus.label}</Text></View>;
  };

  const handleOpenModal = (item: Shift, type: 'LEAVE' | 'SUBSTITUTE') => {
    setSelectedShift(item);
    setModalType(type);
    setReason('');
    setReqModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim() || !selectedShift) return;
    const newStatus = modalType === 'SUBSTITUTE' ? 'SUBSTITUTE_REQ' : 'LEAVE_REQ';
    setGlobalShifts(prev => prev.map(shift => 
      shift.id === selectedShift.id ? { ...shift, status: newStatus } : shift
    ));
    Toast.show({ type: 'success', text1: '신청 완료', text2: '점주에게 요청이 전송되었습니다.' });
    setReqModalVisible(false);
    setSelectedShift(null);
  };

  const moveWeek = (offset: number) => {
    setBaseDate(prev => addDays(prev, offset * 7));
  };

  const onDateSelectFromCalendar = (date: Date) => {
    setBaseDate(date);
    setSelectedDate(formatDate(date));
    setMonthModalVisible(false);
  };

  const renderShiftCard = ({ item }: { item: any }) => {
    const cardContent = (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <Text style={styles.cardDate}>{format(new Date(item.date), "M월 d일 (eee)", { locale: ko })}</Text>
          {renderStatusBadge(item.status)}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>🕒</Text><Text style={styles.infoText}>{item.time}</Text></View>
          {item.status !== 'OFF' && <View style={styles.infoRow}><Text style={styles.infoIcon}>👤</Text><Text style={styles.infoText}>{item.user?.name || '배정 안됨'}</Text></View>}
        </View>
        {userInfo?.role === 'STAFF' && item.status === 'SCHEDULED' && item.userId === userInfo.id && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenModal(item, 'LEAVE')}><Text style={styles.actionButtonText}>휴가 신청</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.substituteButton]} onPress={() => handleOpenModal(item, 'SUBSTITUTE')}><Text style={styles.actionButtonText}>대타 신청</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );

    if (userInfo?.role === 'ADMIN') {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('ShiftEditor', { isEdit: true, shift: item })}>
          {cardContent}
        </TouchableOpacity>
      );
    }
    return cardContent;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {userInfo?.role === 'ADMIN' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{width: 40}}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{`${getYear(baseDate)}년 ${getMonth(baseDate) + 1}월`}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setMonthModalVisible(true)}>
            <Text style={styles.monthViewButton}>월간 보기</Text>
          </TouchableOpacity>
          {userInfo?.role === 'ADMIN' && (
            <TouchableOpacity onPress={() => navigation.navigate('ShiftEditor', { isEdit: false, date: selectedDate })}>
              <Text style={styles.addButton}>+ 새 근무</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysContainer}>
          <TouchableOpacity onPress={() => moveWeek(-1)} style={styles.arrowButton}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
          {generateWeekDates(baseDate).map((item) => {
            const isSelected = item.fullDate === selectedDate;
            const dayColor = item.dayIndex === 0 ? colors.sunday : item.dayIndex === 6 ? colors.saturday : colors.subText;
            return (
              <TouchableOpacity key={item.fullDate} style={[styles.dateBox, isSelected && styles.dateBoxSelected]} onPress={() => setSelectedDate(item.fullDate)}>
                <Text style={[styles.dayText, { color: isSelected ? colors.white : dayColor }]}>{KOREAN_DAYS[item.dayIndex]}</Text>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => moveWeek(1)} style={styles.arrowButton}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
        </View>
      </View>

      <FlatList data={mySchedule.filter((item) => item.date === selectedDate)} renderItem={renderShiftCard} keyExtractor={item => item.id} contentContainerStyle={styles.listContainer} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyIcon}>🏖️</Text><Text style={styles.emptyText}>예정된 근무가 없습니다.</Text></View>} />
      
      <CalendarModal isVisible={isMonthModalVisible} onClose={() => setMonthModalVisible(false)} onDateSelect={onDateSelectFromCalendar} shifts={shifts} colors={colors} />

      <Modal animationType="fade" transparent={true} visible={isReqModalVisible} onRequestClose={() => setReqModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'LEAVE' ? '휴가 신청' : '대타 요청'}</Text>
            {selectedShift && <Text style={styles.modalSubtitle}>{format(new Date(selectedShift.date), "M월 d일 (eee)", { locale: ko })} {selectedShift.time}</Text>}
            <TextInput style={styles.reasonInput} placeholder={modalType === 'LEAVE' ? '휴가 사유를 입력해주세요.' : '대타 요청 사유를 입력해주세요.'} placeholderTextColor={colors.subText} value={reason} onChangeText={setReason} multiline={true} textAlignVertical="top" />
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setReqModalVisible(false)}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSubmitRequest}><Text style={styles.modalSubmitText}>신청</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const CalendarModal = ({ isVisible, onClose, onDateSelect, shifts, colors }: any) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const styles = getThemedStyles(colors);

  const markedDates = useMemo(() => {
    const marks: { [key: string]: { dots: { color: string }[] } } = {};
    shifts.forEach((item: Shift) => {
      const color = item.status === 'OFF' ? colors.red : colors.blue;
      if (!marks[item.date]) {
        marks[item.date] = { dots: [] };
      }
      if (!marks[item.date].dots.some(d => d.color === color)) {
        marks[item.date].dots.push({ color });
      }
    });
    return marks;
  }, [shifts, colors]);

  const changeMonth = (offset: number) => {
    setCalendarDate(prev => setMonth(prev, getMonth(prev) + offset));
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(calendarDate);
    const firstDayOfMonth = getDay(monthStart);
    const daysInMonth = getDaysInMonth(calendarDate);
    const grid = [];

    for (let i = 0; i < firstDayOfMonth; i++) grid.push(<View key={`empty-${i}`} style={styles.dayCell} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(getYear(calendarDate), getMonth(calendarDate), day);
      const dateString = formatDate(currentDate);
      
      grid.push(
        <TouchableOpacity key={day} style={styles.dayCell} onPress={() => onDateSelect(currentDate)}>
          <Text style={styles.dayNumber}>{day}</Text>
          <View style={styles.dotsContainer}>
            {markedDates[dateString]?.dots.map((dot: any, index: number) => <View key={index} style={[styles.dot, { backgroundColor: dot.color }]} />)}
          </View>
        </TouchableOpacity>
      );
    }
    return grid;
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.calendarModalContent} activeOpacity={1}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.calendarNav}>◀</Text></TouchableOpacity>
            <Text style={styles.calendarTitle}>{`${getYear(calendarDate)}년 ${getMonth(calendarDate) + 1}월`}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.calendarNav}>▶</Text></TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {KOREAN_DAYS.map((day, index) => <Text key={day} style={[styles.weekDay, index === 0 && {color: colors.sunday}, index === 6 && {color: colors.saturday}]}>{day}</Text>)}
          </View>
          <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.card },
  backButton: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  monthViewButton: { fontSize: 14, color: colors.text, fontWeight: '600' },
  addButton: { fontSize: 14, color: colors.text, fontWeight: 'bold' },
  calendarContainer: { backgroundColor: colors.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
  arrowButton: { paddingHorizontal: 5, paddingVertical: 10 },
  arrowText: { fontSize: 16, color: colors.text },
  dateBox: { width: 42, height: 65, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: colors.background },
  dateBoxSelected: { backgroundColor: colors.blue },
  dayText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  dateTextSelected: { color: colors.white },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardDate: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeScheduled: { backgroundColor: colors.skyLight },
  badgeTextScheduled: { color: colors.sky, fontSize: 12, fontWeight: '600' },
  badgeInProgress: { backgroundColor: colors.greenLight },
  badgeTextInProgress: { color: colors.green, fontSize: 12, fontWeight: '600' },
  badgeCompleted: { backgroundColor: colors.gray },
  badgeTextCompleted: { color: colors.subText, fontSize: 12, fontWeight: '600' },
  badgeSubstitute: { backgroundColor: colors.yellowLight },
  badgeTextSubstitute: { color: colors.yellow, fontSize: 12, fontWeight: '600' },
  badgeLeaveReq: { backgroundColor: colors.orangeLight },
  badgeTextLeaveReq: { color: colors.orange, fontSize: 12, fontWeight: '600' },
  badgeOff: { backgroundColor: colors.redLight },
  badgeTextOff: { color: colors.red, fontSize: 12, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { fontSize: 16, marginRight: 8 },
  infoText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  actionButton: { flex: 1, backgroundColor: colors.gray, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  substituteButton: { backgroundColor: colors.purpleLight },
  actionButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyText: { fontSize: 16, color: colors.subText, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: colors.card, borderRadius: 16, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: colors.subText, marginBottom: 20, textAlign: 'center' },
  reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, height: 100, fontSize: 15, color: colors.text, backgroundColor: colors.background, marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, backgroundColor: colors.gray, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modalSubmitButton: { flex: 1, backgroundColor: colors.blue, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  // Calendar Modal Styles
  calendarModalContent: { width: '90%', backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  calendarNav: { fontSize: 20, color: colors.primary, padding: 10 },
  calendarTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 10, marginBottom: 5 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 13, color: colors.subText, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dayNumber: { fontSize: 15, color: colors.text },
  dotsContainer: { flexDirection: 'row', position: 'absolute', bottom: -6 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 1 },
});

export default ScheduleScreen;