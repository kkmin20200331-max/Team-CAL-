import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyScheduleAPI, requestLeaveAPI } from '../../../api/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

// ✅ [개선 25] src/types 폴더에 정의된 User와 Shift 타입을 임포트하여 사용합니다.
import { User } from '../../types/User';
import { Shift } from '../../types/Schedule';

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const currentDate = today.getDate();

const formatDate = (year: number, month: number, date: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
};

const initialSelectedDate = formatDate(currentYear, currentMonth, currentDate);

const generateWeekDates = (base: Date) => {
  const day = base.getDay();
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - day);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    week.push({ fullDate: formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate()), date: String(d.getDate()), dayIndex: d.getDay() });
  }
  return week;
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const generateMonthDates = (year: number, month: number) => {
  const dates = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  
  for (let i = 0; i < firstDayIndex; i++) dates.push(null);
  for (let i = 1; i <= lastDay; i++) dates.push({ fullDate: formatDate(year, month, i), date: String(i) });
  return dates;
};

// ✅ [개선 26] 타입 안정성을 위해 파라미터 타입을 Shift로 명확히 합니다.
const getRealTimeItem = (item: Shift): Shift => {
  if (item.status === 'OFF' || item.status === 'SUBSTITUTE_REQ' || !item.time || !item.time.includes(' - ')) {
    return item;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

// ✅ [개선 27] route prop의 타입을 명확하게 정의합니다.
const ScheduleScreen = ({ route }: { route: { params?: { userInfo: User | null } } }) => {
  const { userInfo } = route?.params || {};
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  // ✅ [개선 28] 더미 데이터에도 Shift[] 타입을 명시합니다.
  const dummySchedule: Shift[] = [
    { id: '0', fullDate: '2026-05-31', date: '31', day: '일', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
    { id: '1', fullDate: '2026-06-01', date: '01', day: '월', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
    { id: '2', fullDate: '2026-06-02', date: '02', day: '화', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
    { id: '3', fullDate: '2026-06-03', date: '03', day: '수', time: t('offDay'), storeName: '-', status: 'OFF' },
    { id: '4', fullDate: '2026-06-05', date: '05', day: '목', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
    { id: '5', fullDate: '2026-06-06', date: '06', day: '금', time: '14:00 - 22:00', storeName: storeName, status: 'SUBSTITUTE_REQ' },
  ];

  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [baseDate, setBaseDate] = useState(new Date());
  
  // ✅ [개선 29] 'any' 대신 명확한 Shift[] 타입을 사용합니다.
  const [scheduleData, setScheduleData] = useState<Shift[]>(dummySchedule);
  const [loading, setLoading] = useState(false);

  const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
  const [isMonthModalVisible, setMonthModalVisible] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedShiftForLeave, setSelectedShiftForLeave] = useState<Shift | null>(null);

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setBaseDate(now);
      setSelectedDate(formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate()));
    }, [])
  );

  useEffect(() => {
    fetchMySchedule();
  }, [userInfo]);

  const fetchMySchedule = async () => {
    if (!userInfo) return;
    
    try {
      setLoading(true);
      const storeId = userInfo.store_id || userInfo.brandName || 'default_store';
      const response = await getMyScheduleAPI(userInfo.username, storeId);
      // if (response.data && response.data.length > 0) {
      //   setScheduleData(response.data);
      // }
    } catch (error) {
      console.log('스케줄 불러오기 에러 (임시 더미 데이터 사용 중):', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return <View style={[styles.badge, styles.badgeScheduled]}><Text style={styles.badgeTextScheduled}>{t('scheduled')}</Text></View>;
      case 'IN_PROGRESS': return <View style={[styles.badge, styles.badgeInProgress]}><Text style={styles.badgeTextInProgress}>{t('inProgress')}</Text></View>;
      case 'COMPLETED': return <View style={[styles.badge, styles.badgeCompleted]}><Text style={styles.badgeTextCompleted}>{t('completed')}</Text></View>;
      case 'SUBSTITUTE_REQ': return <View style={[styles.badge, styles.badgeSubstitute]}><Text style={styles.badgeTextSubstitute}>{t('substituteReq')}</Text></View>;
      case 'OFF': return <View style={[styles.badge, styles.badgeOff]}><Text style={styles.badgeTextOff}>{t('offDay')}</Text></View>;
      default: return null;
    }
  };

  const handleOpenLeaveModal = (item: Shift) => {
    setSelectedShiftForLeave(item);
    setLeaveReason('');
    setLeaveModalVisible(true);
  };

  const handleSubmitLeaveRequest = async () => {
    if (!leaveReason.trim()) {
      Toast.show({ type: 'error', text1: '알림', text2: '휴무 사유를 입력해주세요.' });
      return;
    }
    
    try {
      // await requestLeaveAPI({
      //   shift_id: selectedShiftForLeave!.id,
      //   user_id: userInfo?.username || 'unknown',
      //   reason: leaveReason
      // });
      Toast.show({ type: 'success', text1: '신청 완료', text2: '점주에게 휴무 승인 요청이 전송되었습니다.' });
      setLeaveModalVisible(false);
      setSelectedShiftForLeave(null);
      // fetchMySchedule();
    } catch (error) {
      console.error('휴무 신청 에러:', error);
      Toast.show({ type: 'error', text1: '신청 실패', text2: '휴무 신청 중 오류가 발생했습니다.' });
    }
  };

  const moveWeek = (offset: number) => {
    const newBase = new Date(baseDate);
    newBase.setDate(newBase.getDate() + offset * 7);
    setBaseDate(newBase);
  };

  const moveMonth = (offset: number) => {
    const newBase = new Date(baseDate);
    newBase.setMonth(newBase.getMonth() + offset);
    setBaseDate(newBase);
  };

  const renderShiftCard = ({ item }: { item: Shift }) => {
    const currentItem = getRealTimeItem(item);
    const translatedDay = t(DAY_KEYS[new Date(currentItem.fullDate.replace(/-/g, '/')).getDay()]);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <Text style={styles.cardDate}>{currentItem.fullDate} ({translatedDay})</Text>
          {renderStatusBadge(currentItem.status)}
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <Text style={styles.infoText}>{currentItem.time}</Text>
          </View>
          {currentItem.status !== 'OFF' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{currentItem.storeName}</Text>
            </View>
          )}
        </View>

        {currentItem.status === 'SCHEDULED' && (
          <TouchableOpacity 
            style={styles.leaveButton}
             onPress={() => handleOpenLeaveModal(currentItem)}
          >
            <Text style={styles.leaveButtonText}>{t('leaveRequest')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{`${baseDate.getFullYear()}${t('year')} ${baseDate.getMonth() + 1}${t('month')}`}</Text>
        <TouchableOpacity onPress={() => setMonthModalVisible(true)}>
          <Text style={styles.monthChangeButton}>📅 {t('monthlyView')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysContainer}>
          <TouchableOpacity onPress={() => moveWeek(-1)} style={styles.arrowButton}>
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>

          {generateWeekDates(baseDate).map((item) => {
            const isSelected = item.fullDate === selectedDate;
            const isWeekend = item.dayIndex === 0 ? '#EF4444' : item.dayIndex === 6 ? '#3B82F6' : colors.subText;
            return (
              <TouchableOpacity key={item.fullDate} style={[styles.dateBox, isSelected && styles.dateBoxSelected]} onPress={() => { setSelectedDate(item.fullDate); setBaseDate(new Date(item.fullDate)); }}>
                <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : isWeekend }]}>{t(DAY_KEYS[item.dayIndex])}</Text>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={() => moveWeek(1)} style={styles.arrowButton}>
            <Text style={styles.arrowText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList
          data={dummySchedule.filter((item) => item.fullDate === selectedDate)} 
          renderItem={renderShiftCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyText}>{t('noSchedule')}</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isLeaveModalVisible}
        onRequestClose={() => setLeaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('leaveRequest')}</Text>
            {selectedShiftForLeave && (
              <Text style={styles.modalSubtitle}>
                {selectedShiftForLeave.fullDate} ({t(DAY_KEYS[new Date(selectedShiftForLeave.fullDate).getDay()])}) {selectedShiftForLeave.time}
              </Text>
            )}
            
            <TextInput
              style={styles.reasonInput}
              placeholder={t('leaveReasonPlaceholder')}
              placeholderTextColor={colors.subText}
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline={true}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setLeaveModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSubmitLeaveRequest}>
                <Text style={styles.modalSubmitText}>{t('apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isMonthModalVisible}
        onRequestClose={() => setMonthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthModalContent}>
            <View style={styles.monthModalHeader}>
              <TouchableOpacity onPress={() => moveMonth(-1)} style={styles.arrowButton}><Text style={styles.arrowText}>◀</Text></TouchableOpacity>
              <Text style={styles.monthModalTitle}>{baseDate.getFullYear()}{t('year')} {baseDate.getMonth() + 1}{t('month')}</Text>
              <TouchableOpacity onPress={() => moveMonth(1)} style={styles.arrowButton}><Text style={styles.arrowText}>▶</Text></TouchableOpacity>
            </View>
            
            <View style={styles.monthDaysHeader}>
              {DAY_KEYS.map((d, index) => (
                <Text key={d} style={[styles.monthDayText, index === 0 && {color: '#EF4444'}, index === 6 && {color: '#3B82F6'}]}>{t(d)}</Text>
              ))}
            </View>
            
            <View style={styles.monthGrid}>
              {generateMonthDates(baseDate.getFullYear(), baseDate.getMonth() + 1).map((item, index) => {
                if (!item) return <View key={`empty-${index}`} style={styles.monthDateCell} />;
                const isSelected = item.fullDate === selectedDate;
                
                const shift = dummySchedule.find((s) => s.fullDate === item.fullDate);
                const isWork = shift && shift.status !== 'OFF';
                const isOff = shift && shift.status === 'OFF';

                return (
                  <TouchableOpacity key={item.fullDate} style={[styles.monthDateCell, isSelected && styles.monthDateCellSelected]} onPress={() => { setSelectedDate(item.fullDate); setBaseDate(new Date(item.fullDate)); setMonthModalVisible(false); }}>
                    <Text style={[styles.monthDateText, isSelected && styles.monthDateTextSelected]}>{item.date}</Text>
                    {isWork && <View style={[styles.workDot, isSelected && { backgroundColor: '#FFFFFF' }]} />}
                    {isOff && <View style={[styles.offDot, isSelected && { backgroundColor: '#FFFFFF' }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setMonthModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 10,
    backgroundColor: colors.card
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthChangeButton: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  
  calendarContainer: { backgroundColor: colors.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
  arrowButton: { paddingHorizontal: 5, paddingVertical: 10 },
  arrowText: { fontSize: 16, color: colors.subText },
  dateBox: { 
    width: 42, 
    height: 65, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 10, 
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB' 
  },
  dateBoxSelected: { backgroundColor: '#2563EB' },
  dayText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  dateTextSelected: { color: '#FFFFFF' },
  
  listContainer: { padding: 16, gap: 16 },
  card: { 
    backgroundColor: colors.card, 
    borderRadius: 16, 
    padding: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  cardHighlighted: { borderColor: '#93C5FD' },
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
  
  leaveButton: { 
    marginTop: 8, 
    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  leaveButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyText: { fontSize: 16, color: colors.subText, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: colors.modalBg, borderRadius: 16, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: colors.subText, marginBottom: 20, textAlign: 'center' },
  reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, height: 100, fontSize: 15, color: colors.text, backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB', marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modalSubmitButton: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  monthModalContent: { width: '90%', backgroundColor: colors.modalBg, borderRadius: 16, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  monthModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthModalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  monthDaysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  monthDayText: { fontSize: 13, fontWeight: '600', color: colors.subText, width: '14%', textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthDateCell: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderRadius: 20 },
  monthDateCellSelected: { backgroundColor: '#2563EB' },
  monthDateText: { fontSize: 15, color: colors.text },
  monthDateTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  
  workDot: { position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  offDot: { position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },

  closeModalButton: { marginTop: 20, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});

export default ScheduleScreen;