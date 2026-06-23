import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { Shift } from '../../types/Schedule';
import { format, addDays, startOfWeek, getDay, getDaysInMonth, getMonth, getYear, setMonth, startOfMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useApp } from '../../contexts/AppContext';
import { getMyScheduleAPI, requestLeaveAPI } from '../../../api/auth';

const today = new Date();
const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');
const initialSelectedDate = formatDate(today);
const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 1. 삭제되었던 generateWeekDates 함수 복원
const generateWeekDates = (base: Date) => {
  const sunday = startOfWeek(base, { weekStartsOn: 0 });
  return Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(sunday, i);
    return { fullDate: formatDate(d), date: String(d.getDate()), dayIndex: d.getDay() };
  });
};

const getTimePart = (value?: string) => {
  if (!value) return '';
  const time = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
  return time ? time.slice(0, 5) : '';
};

const normalizeStatus = (status?: string): Shift['status'] => {
  const upper = (status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'COMPLETED';
  if (upper === 'WORKING' || upper === 'CHECKED_IN' || upper === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (upper === 'SUBSTITUTE_REQ') return 'SUBSTITUTE_REQ';
  return 'SCHEDULED';
};

const mapShift = (raw: any, storeName: string): Shift => {
  const fullDate = raw.work_date?.includes('T')
    ? raw.work_date.split('T')[0]
    : raw.work_date?.split(' ')[0] || formatDate(new Date());
  const start = getTimePart(raw.start_at);
  const end = getTimePart(raw.end_at);

  return getRealTimeItem({
    id: raw.id,
    fullDate,
    date: String(Number(fullDate.slice(8, 10))),
    day: KOREAN_DAYS[getDay(parseISO(fullDate))],
    time: start && end ? `${start} - ${end}` : '-',
    storeName,
    status: normalizeStatus(raw.status),
    checkInTime: getTimePart(raw.check_in_at) || null,
    checkOutTime: getTimePart(raw.check_out_at) || null,
  });
};

const getRealTimeItem = (item: Shift): Shift => {
  if (item.status === 'OFF' || item.status === 'SUBSTITUTE_REQ' || !item.time || !item.time.includes(' - ')) {
    return item;
  }
  const now = new Date();
  const todayStr = formatDate(now);
  if (item.fullDate < todayStr) return { ...item, status: 'COMPLETED' };
  if (item.fullDate > todayStr) return { ...item, status: 'SCHEDULED' };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startStr, endStr] = item.time.split(' - ');
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let newStatus: Shift['status'] = 'COMPLETED';
  if (currentMinutes < startMinutes) newStatus = 'SCHEDULED';
  else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) newStatus = 'IN_PROGRESS';
  
  return { ...item, status: newStatus };
};

const ScheduleScreen = () => {
  const { userInfo } = useApp();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [baseDate, setBaseDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const [isReqModalVisible, setReqModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'LEAVE' | 'SUBSTITUTE'>('LEAVE');
  const [reason, setReason] = useState('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const [isMonthModalVisible, setMonthModalVisible] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadSchedule = async () => {
      if (!userInfo?.id) {
        setScheduleData([]);
        return;
      }

      setLoading(true);
      try {
        const weekDates = generateWeekDates(baseDate);
        const startDate = weekDates[0].fullDate;
        const endDate = weekDates[6].fullDate;
        const response = await getMyScheduleAPI(userInfo.id, startDate, endDate);
        const shifts = Array.isArray(response.data)
          ? response.data
              .filter((item: any) => item.status !== 'VACANT' && item.status !== 'CANCELLED')
              .map((item: any) => mapShift(item, storeName))
          : [];

        if (alive) setScheduleData(shifts);
      } catch (error) {
        console.error('스케줄 조회 오류:', error);
        if (alive) {
          setScheduleData([]);
          Toast.show({ type: 'error', text1: '스케줄 조회 실패', text2: '근무표를 불러오지 못했습니다.' });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadSchedule();

    return () => {
      alive = false;
    };
  }, [baseDate, storeName, userInfo?.id]);

  const renderStatusBadge = (status: string) => {
    const statusMap = {
      SCHEDULED: { style: styles.badgeScheduled, textStyle: styles.badgeTextScheduled, label: '근무 예정' },
      IN_PROGRESS: { style: styles.badgeInProgress, textStyle: styles.badgeTextInProgress, label: '근무중' },
      COMPLETED: { style: styles.badgeCompleted, textStyle: styles.badgeTextCompleted, label: '근무 완료' },
      SUBSTITUTE_REQ: { style: styles.badgeSubstitute, textStyle: styles.badgeTextSubstitute, label: '대타 요청중' },
      OFF: { style: styles.badgeOff, textStyle: styles.badgeTextOff, label: '휴무' },
    };
    const currentStatus = statusMap[status as keyof typeof statusMap];
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
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: '알림', text2: '사유를 입력해주세요.' });
      return;
    }
    if (!selectedShift || !userInfo?.id) return;

    try {
      if (modalType === 'LEAVE') {
        await requestLeaveAPI({
          shift_id: selectedShift.id,
          user_id: userInfo.id,
          reason,
        });
        setScheduleData(prev => prev.map(shift =>
          shift.id === selectedShift.id ? { ...shift, status: 'OFF', time: '휴무' } : shift
        ));
      } else {
        setScheduleData(prev => prev.map(shift =>
          shift.id === selectedShift.id ? { ...shift, status: 'SUBSTITUTE_REQ' } : shift
        ));
      }

      Toast.show({
        type: 'success',
        text1: '신청 완료',
        text2: modalType === 'LEAVE' ? '휴무 신청이 전송되었습니다.' : '대타 요청 상태로 표시했습니다.',
      });
      setReqModalVisible(false);
      setSelectedShift(null);
    } catch (error) {
      console.error('신청 오류:', error);
      Toast.show({ type: 'error', text1: '신청 실패', text2: '잠시 후 다시 시도해주세요.' });
    }
  };

  const moveWeek = (offset: number) => {
    const newBase = new Date(baseDate);
    newBase.setDate(newBase.getDate() + offset * 7);
    setBaseDate(newBase);
  };

  const onDateSelectFromCalendar = (date: Date) => {
    setBaseDate(date);
    setSelectedDate(formatDate(date));
    setMonthModalVisible(false);
  };

  const renderShiftCard = ({ item }: { item: Shift }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
         <Text style={styles.cardDate}>{item.fullDate} ({item.day})</Text>
        {renderStatusBadge(item.status)}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}><Text style={styles.infoIcon}>🕒</Text><Text style={styles.infoText}>{item.time}</Text></View>
        {item.status !== 'OFF' && <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><Text style={styles.infoText}>{item.storeName}</Text></View>}
      </View>
      {item.status === 'SCHEDULED' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenModal(item, 'LEAVE')}><Text style={styles.actionButtonText}>휴가 신청</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.substituteButton]} onPress={() => handleOpenModal(item, 'SUBSTITUTE')}><Text style={styles.actionButtonText}>대타 신청</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{`${getYear(baseDate)}년 ${getMonth(baseDate) + 1}월`}</Text>
        <TouchableOpacity onPress={() => setMonthModalVisible(true)}>
          <Text style={styles.monthViewButton}>월간 보기</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysContainer}>
          <TouchableOpacity onPress={() => moveWeek(-1)} style={styles.arrowButton}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
          {generateWeekDates(baseDate).map((item) => {
            const isSelected = item.fullDate === selectedDate;
            const isWeekend = item.dayIndex === 0 ? '#EF4444' : item.dayIndex === 6 ? '#3B82F6' : colors.subText;
            return (
              <TouchableOpacity key={item.fullDate} style={[styles.dateBox, isSelected && styles.dateBoxSelected]} onPress={() => setSelectedDate(item.fullDate)}>
                <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : isWeekend }]}>{KOREAN_DAYS[item.dayIndex]}</Text>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => moveWeek(1)} style={styles.arrowButton}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
        </View>
      </View>

      {loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563EB" /></View>
       : <FlatList data={scheduleData.filter((item) => item.fullDate === selectedDate)} renderItem={renderShiftCard} keyExtractor={item => item.id} contentContainerStyle={styles.listContainer} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyIcon}>🏖️</Text><Text style={styles.emptyText}>예정된 근무가 없습니다.</Text></View>} />
      }

      <CalendarModal isVisible={isMonthModalVisible} onClose={() => setMonthModalVisible(false)} onDateSelect={onDateSelectFromCalendar} shifts={scheduleData} colors={colors} />

      <Modal animationType="fade" transparent={true} visible={isReqModalVisible} onRequestClose={() => setReqModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'LEAVE' ? '휴가 신청' : '대타 요청'}</Text>
            {selectedShift && <Text style={styles.modalSubtitle}>{selectedShift.fullDate} ({selectedShift.day}) {selectedShift.time}</Text>}
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
    (Array.isArray(shifts) ? shifts : []).forEach((item: Shift) => {
      const color = item.status === 'OFF' ? 'red' : 'blue';
      if (!marks[item.fullDate]) {
        marks[item.fullDate] = { dots: [] };
      }
      if (!marks[item.fullDate].dots.some(d => d.color === color)) {
        marks[item.fullDate].dots.push({ color });
      }
    });
    return marks;
  }, [shifts]);

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
            {KOREAN_DAYS.map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}
          </View>
          <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getThemedStyles = (colors: any, isDarkMode?: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.card },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthViewButton: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  calendarContainer: { backgroundColor: colors.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
  arrowButton: { paddingHorizontal: 5, paddingVertical: 10 },
  arrowText: { fontSize: 16, color: colors.subText },
  dateBox: { width: 42, height: 65, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB' },
  dateBoxSelected: { backgroundColor: '#2563EB' },
  dayText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  dateTextSelected: { color: '#FFFFFF' },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardDate: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeScheduled: { backgroundColor: isDarkMode ? '#075985' : '#E0F2FE' },
  badgeTextScheduled: { color: isDarkMode ? '#BAE6FD' : '#0284C7', fontSize: 12, fontWeight: '600' },
  badgeInProgress: { backgroundColor: isDarkMode ? '#14532D' : '#DCFCE7' },
  badgeTextInProgress: { color: isDarkMode ? '#86EFAC' : '#16A34A', fontSize: 12, fontWeight: '600' },
  badgeCompleted: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' },
  badgeTextCompleted: { color: isDarkMode ? '#D1D5DB' : '#4B5563', fontSize: 12, fontWeight: '600' },
  badgeSubstitute: { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' },
  badgeTextSubstitute: { color: isDarkMode ? '#FDE68A' : '#D97706', fontSize: 12, fontWeight: '600' },
  badgeOff: { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' },
  badgeTextOff: { color: isDarkMode ? '#FECACA' : '#DC2626', fontSize: 12, fontWeight: '600' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { fontSize: 16, marginRight: 8 },
  infoText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  actionButton: { flex: 1, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  substituteButton: { backgroundColor: isDarkMode ? '#5B21B6' : '#A78BFA' },
  actionButtonText: { color: isDarkMode ? colors.text : '#1F2937', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyText: { fontSize: 16, color: colors.subText, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: colors.card, borderRadius: 16, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: colors.subText, marginBottom: 20, textAlign: 'center' },
  reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, height: 100, fontSize: 15, color: colors.text, backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB', marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modalSubmitButton: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
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
  dotsContainer: { flexDirection: 'row', position: 'absolute', bottom: -5 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 1 },
});

export default ScheduleScreen;
