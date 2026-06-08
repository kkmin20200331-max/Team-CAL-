import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyScheduleAPI, requestLeaveAPI } from '../../../api/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 테마 Context 추가
import Toast from 'react-native-toast-message';

// 1. 데이터의 형태(타입)를 먼저 정의해 줍니다.
interface ScheduleItem {
  id: string;
  fullDate: string;
  date: string;
  day: string;
  time: string;
  storeName: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OFF' | 'SUBSTITUTE_REQ' | 'IN_PROGRESS';
}

// ✅ 현재 날짜를 기준으로 동적으로 년/월/일을 계산합니다.
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
const currentDate = today.getDate();

const formatDate = (year: number, month: number, date: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
};

const initialSelectedDate = formatDate(currentYear, currentMonth, currentDate);

// ✅ 특정 날짜가 속한 1주일(일~토) 데이터를 생성하는 함수
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

// ✅ 특정 년/월의 전체 달력 데이터를 생성하는 함수 (월간 보기 모달용)
const generateMonthDates = (year: number, month: number) => {
  const dates = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  
  for (let i = 0; i < firstDayIndex; i++) dates.push(null); // 1일 이전의 빈 칸 처리
  for (let i = 1; i <= lastDay; i++) dates.push({ fullDate: formatDate(year, month, i), date: String(i) });
  return dates;
};

// ✅ 실시간 시간에 따라 상태(근무 예정, 근무 중, 근무 완료)를 동적으로 계산하는 함수
const getRealTimeItem = (item: ScheduleItem): ScheduleItem => {
  if (item.status === 'OFF' || item.status === 'SUBSTITUTE_REQ' || !item.time || !item.time.includes(' - ')) {
    return item;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. 과거 날짜면 무조건 '근무 완료'
  if (item.fullDate < todayStr) return { ...item, status: 'COMPLETED' };
  // 2. 미래 날짜면 무조건 '근무 예정'
  if (item.fullDate > todayStr) return { ...item, status: 'SCHEDULED' };

  // 3. 오늘 날짜인 경우 시간 비교
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startStr, endStr] = item.time.split(' - ');
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let newStatus: ScheduleItem['status'] = 'COMPLETED';
  if (currentMinutes < startMinutes) newStatus = 'SCHEDULED';
  else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) newStatus = 'IN_PROGRESS';
  
  return { ...item, status: newStatus };
};

const ScheduleScreen = ({ route }: any) => {
  // App.tsx에서 넘겨준 유저 정보
  const { userInfo } = route?.params || {};

  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // ✅ 유저 정보에서 선택한 지점명 가져오기
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  // ✅ 스케줄 더미 데이터를 컴포넌트 내부로 옮겨 지점명이 동적으로 즉시 반영되게 합니다.
  const dummySchedule: ScheduleItem[] = [
    { id: '0', fullDate: '2026-05-31', date: '31', day: '일', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
    { id: '1', fullDate: '2026-06-01', date: '01', day: '월', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
    { id: '2', fullDate: '2026-06-02', date: '02', day: '화', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
    { id: '3', fullDate: '2026-06-03', date: '03', day: '수', time: t('offDay'), storeName: '-', status: 'OFF' },
    { id: '4', fullDate: '2026-06-05', date: '05', day: '목', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
    { id: '5', fullDate: '2026-06-06', date: '06', day: '금', time: '14:00 - 22:00', storeName: storeName, status: 'SUBSTITUTE_REQ' },
  ];

  // ✅ 선택된 날짜 상태 (기본값을 '오늘 날짜'로 자동 세팅)
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  // ✅ 현재 렌더링 기준이 되는 날짜 상태 (주간 달력과 월간 달력의 기준이 됨)
  const [baseDate, setBaseDate] = useState(new Date());
  
  // ✅ 백엔드에서 불러온 스케줄을 담을 상태 (기본값으로 더미 데이터를 넣어두어 화면이 비어보이지 않게 함)
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>(dummySchedule);
  const [loading, setLoading] = useState(false);

  // 휴무 신청 모달 상태 관리
  const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
  // ✅ 월간 보기 달력 모달 상태 관리
  const [isMonthModalVisible, setMonthModalVisible] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedShiftForLeave, setSelectedShiftForLeave] = useState<ScheduleItem | null>(null);

  // ✅ 화면(탭)에 들어올 때마다 무조건 '오늘 날짜' 기준으로 캘린더 초기화
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setBaseDate(now); // 이번 주로 이동
      setSelectedDate(formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())); // 오늘 날짜 선택
    }, [])
  );

  // ✅ 화면이 렌더링될 때 백엔드에서 내 스케줄 가져오기
  useEffect(() => {
    fetchMySchedule();
  }, [userInfo]);

  const fetchMySchedule = async () => {
    if (!userInfo) return;
    
    try {
      setLoading(true);
      // 매장명(store_id)과 아이디를 백엔드로 보냄
      const storeId = userInfo.store_id || userInfo.brandName || 'default_store';
      const response = await getMyScheduleAPI(userInfo.username, storeId);
      
      // 🚨 UI 테스트를 위해 임시로 백엔드 데이터 덮어씌우기를 주석 처리합니다!
      // 🚨 (나중에 진짜 6월 데이터를 DB에 넣고 나면 주석을 해제해 주세요)
      // if (response.data && response.data.length > 0) {
      //   setScheduleData(response.data);
      // }
    } catch (error) {
      console.log('스케줄 불러오기 에러 (임시 더미 데이터 사용 중):', error);
    } finally {
      setLoading(false);
    }
  };

  // 상태에 따른 배지 스타일 렌더링 함수
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

  // 휴무 신청 버튼 클릭 시 모달 열기
  const handleOpenLeaveModal = (item: ScheduleItem) => {
    setSelectedShiftForLeave(item);
    setLeaveReason('');
    setLeaveModalVisible(true);
  };

  // 모달에서 '신청하기' 눌렀을 때 처리
  const handleSubmitLeaveRequest = async () => {
    if (!leaveReason.trim()) {
      Toast.show({ type: 'error', text1: '알림', text2: '휴무 사유를 입력해주세요.' });
      return;
    }
    
    try {
      // ✅ 백엔드 DTO(LeaveRequestVO) 규격에 맞춰 데이터 전송
      // 🚨 현재 더미 데이터(가짜 일정)를 사용 중이므로 실제 API 호출 시 DB 에러가 발생합니다.
      // 🚨 백엔드 연동이 완벽히 끝나기 전까지는 UI 흐름을 위해 API 호출을 주석 처리합니다.
      // await requestLeaveAPI({
      //   shift_id: selectedShiftForLeave!.id,
      //   user_id: userInfo?.username || 'unknown',
      //   reason: leaveReason
      // });

      Toast.show({ type: 'success', text1: '신청 완료', text2: '점주에게 휴무 승인 요청이 전송되었습니다.' });
      setLeaveModalVisible(false);
      setSelectedShiftForLeave(null);
      
      // 신청 완료 후 스케줄 새로고침
      // fetchMySchedule(); // 🚨 이 부분도 임시로 주석 처리
    } catch (error) {
      console.error('휴무 신청 에러:', error);
      Toast.show({ type: 'error', text1: '신청 실패', text2: '휴무 신청 중 오류가 발생했습니다.' });
    }
  };

  // ✅ 주간 달력: 이전/다음 주 이동
  const moveWeek = (offset: number) => {
    const newBase = new Date(baseDate);
    newBase.setDate(newBase.getDate() + offset * 7);
    setBaseDate(newBase);
  };

  // ✅ 월간 달력: 이전/다음 달 이동
  const moveMonth = (offset: number) => {
    const newBase = new Date(baseDate);
    newBase.setMonth(newBase.getMonth() + offset);
    setBaseDate(newBase);
  };

  // 근무 카드 컴포넌트
  const renderShiftCard = ({ item }: { item: ScheduleItem }) => {
    // 메모: FlatList에서 이미 선택된 날짜로 필터링해서 넘어옵니다.
     // ✅ 실시간 상태 적용 (누락되었던 코드 추가!)
    const currentItem = getRealTimeItem(item);
    const translatedDay = t(DAY_KEYS[new Date(currentItem.fullDate.replace(/-/g, '/')).getDay()]);
    return (
      <View style={styles.card}>
        {/* 카드 헤더 (날짜 및 배지) */}
        <View style={styles.cardHeader}>
           <Text style={styles.cardDate}>{currentItem.fullDate} ({translatedDay})</Text>
          {renderStatusBadge(currentItem.status)}
        </View>
        
        {/* 카드 본문 (근무 시간, 지점) */}
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

        {/* 예정된 근무에만 휴무 신청 / 대타 구하기 버튼 표시 */}
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
      
      {/* 상단 월 표시 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{`${baseDate.getFullYear()}${t('year')} ${baseDate.getMonth() + 1}${t('month')}`}</Text>
        <TouchableOpacity onPress={() => setMonthModalVisible(true)}>
          <Text style={styles.monthChangeButton}>📅 {t('monthlyView')}</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ 주간 캘린더 (화살표 이동 방식) */}
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

      {/* 근무 카드 리스트 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList
          // 🚨 UI 테스트를 위해 임시로 scheduleData 상태 대신 dummySchedule을 직접 연결합니다.
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

      {/* 휴무 신청 사유 입력 모달 */}
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

      {/* ✅ 월간 달력 모달 */}
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
                
                // ✅ 해당 날짜의 일정을 찾아서 상태를 확인합니다. (테스트를 위해 dummySchedule로 바로 연결)
                const shift = dummySchedule.find((s) => s.fullDate === item.fullDate);
                const isWork = shift && shift.status !== 'OFF';
                const isOff = shift && shift.status === 'OFF';

                return (
                  <TouchableOpacity key={item.fullDate} style={[styles.monthDateCell, isSelected && styles.monthDateCellSelected]} onPress={() => { setSelectedDate(item.fullDate); setBaseDate(new Date(item.fullDate)); setMonthModalVisible(false); }}>
                    <Text style={[styles.monthDateText, isSelected && styles.monthDateTextSelected]}>{item.date}</Text>
                    {/* ✅ 글자 바로 아래에 표시될 작은 점(Dot) */}
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

// 3. UI 스타일링
// ✅ 테마 색상을 인자로 받아 동적으로 스타일을 생성하도록 변경
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
  
  // ✅ 주간 달력 영역
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
  
  // 카드 리스트 영역
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
  cardHighlighted: { borderColor: '#93C5FD' }, // 선택된 날짜 강조 테두리
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardDate: { fontSize: 16, fontWeight: '700', color: colors.text },
  
  // 배지 스타일
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
  
  // 휴무 신청 버튼
  leaveButton: { 
    marginTop: 8, 
    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  leaveButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  
  // 빈 상태(휴무/일정 없음) 표시 스타일
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyText: { fontSize: 16, color: colors.subText, fontWeight: '500' },

  // 모달 스타일
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

  // 월간 달력 모달 스타일
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
  
  // ✅ 월간 달력 점(Dot) 스타일 (숫자가 흔들리지 않게 absolute 사용)
  workDot: { position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  offDot: { position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  
  closeModalButton: { marginTop: 20, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});

export default ScheduleScreen;