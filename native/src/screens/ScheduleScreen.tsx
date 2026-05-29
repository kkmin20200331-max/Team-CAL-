import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { getMyScheduleAPI, requestLeaveAPI } from '../../api/auth';

// 1. 데이터의 형태(타입)를 먼저 정의해 줍니다.
interface ScheduleItem {
  id: string;
  fullDate: string;
  date: string;
  day: string;
  time: string;
  storeName: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OFF' | 'SUBSTITUTE_REQ';
}

// 2. 이번 주 근무 더미 데이터
const dummySchedule: ScheduleItem[] = [
  { id: '1', fullDate: '2026-05-25', date: '25', day: '월', time: '14:00 - 22:00', storeName: '컴포즈 미금점', status: 'COMPLETED' },
  { id: '2', fullDate: '2026-05-26', date: '26', day: '화', time: '14:00 - 22:00', storeName: '컴포즈 미금점', status: 'SCHEDULED' },
  { id: '3', fullDate: '2026-05-27', date: '27', day: '수', time: '휴무', storeName: '-', status: 'OFF' },
  { id: '4', fullDate: '2026-05-28', date: '28', day: '목', time: '17:00 - 22:00', storeName: '컴포즈 미금점', status: 'SCHEDULED' },
  { id: '5', fullDate: '2026-05-29', date: '29', day: '금', time: '14:00 - 22:00', storeName: '컴포즈 미금점', status: 'SUBSTITUTE_REQ' },
];

// 상단 가로 달력용 날짜 데이터
const weekDates = [
  { date: '24', day: '일' }, { date: '25', day: '월' }, { date: '26', day: '화' },
  { date: '27', day: '수' }, { date: '28', day: '목' }, { date: '29', day: '금' }, { date: '30', day: '토' },
];

const ScheduleScreen = ({ route }: any) => {
  // App.tsx에서 넘겨준 유저 정보
  const { userInfo } = route?.params || {};

  // 선택된 날짜 상태 (기본값: 오늘인 26일로 세팅)
  const [selectedDate, setSelectedDate] = useState('26');
  
  // ✅ 백엔드에서 불러온 스케줄을 담을 상태 (기본값으로 더미 데이터를 넣어두어 화면이 비어보이지 않게 함)
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>(dummySchedule);
  const [loading, setLoading] = useState(false);

  // 휴무 신청 모달 상태 관리
  const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [selectedShiftForLeave, setSelectedShiftForLeave] = useState<ScheduleItem | null>(null);

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
      
      // 백엔드에 데이터가 실제로 있다면 덮어씌움
      if (response.data && response.data.length > 0) {
        setScheduleData(response.data);
      }
    } catch (error) {
      console.log('스케줄 불러오기 에러 (임시 더미 데이터 사용 중):', error);
    } finally {
      setLoading(false);
    }
  };

  // 상태에 따른 배지 스타일 렌더링 함수
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return <View style={[styles.badge, styles.badgeScheduled]}><Text style={styles.badgeTextScheduled}>근무 예정</Text></View>;
      case 'COMPLETED': return <View style={[styles.badge, styles.badgeCompleted]}><Text style={styles.badgeTextCompleted}>근무 완료</Text></View>;
      case 'SUBSTITUTE_REQ': return <View style={[styles.badge, styles.badgeSubstitute]}><Text style={styles.badgeTextSubstitute}>대타 찾는 중</Text></View>;
      case 'OFF': return <View style={[styles.badge, styles.badgeOff]}><Text style={styles.badgeTextOff}>휴무</Text></View>;
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
      Alert.alert('알림', '휴무 사유를 입력해주세요.');
      return;
    }
    
    try {
      // ✅ 백엔드 DTO(LeaveRequestVO) 규격에 맞춰 데이터 전송
      await requestLeaveAPI({
        shift_id: selectedShiftForLeave!.id,
        user_id: userInfo?.username || 'unknown',
        reason: leaveReason
      });

      Alert.alert('신청 완료', '점주에게 휴무 승인 요청이 전송되었습니다.');
      setLeaveModalVisible(false);
      setSelectedShiftForLeave(null);
      
      // 신청 완료 후 스케줄 새로고침
      fetchMySchedule();
    } catch (error) {
      console.error('휴무 신청 에러:', error);
      Alert.alert('신청 실패', '휴무 신청 중 오류가 발생했습니다.');
    }
  };

  // 근무 카드 컴포넌트
  const renderShiftCard = ({ item }: { item: ScheduleItem }) => {
    // 선택한 날짜의 데이터만 보여주거나 전체를 보여줄 수 있습니다. 지금은 리스트 전체를 보여줍니다.
    return (
      <View style={[styles.card, item.date === selectedDate && styles.cardHighlighted]}>
        {/* 카드 헤더 (날짜 및 배지) */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{item.fullDate} ({item.day})</Text>
          {renderStatusBadge(item.status)}
        </View>
        
        {/* 카드 본문 (근무 시간, 지점) */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
          {item.status !== 'OFF' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{item.storeName}</Text>
            </View>
          )}
        </View>

        {/* 예정된 근무에만 휴무 신청 / 대타 구하기 버튼 표시 */}
        {item.status === 'SCHEDULED' && (
          <TouchableOpacity 
            style={styles.leaveButton}
            onPress={() => handleOpenLeaveModal(item)}
          >
            <Text style={styles.leaveButtonText}>휴무 신청 / 대타 구하기</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 상단 월 표시 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>2026년 5월</Text>
        <TouchableOpacity>
          <Text style={styles.monthChangeButton}>📅 월간 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 주간 캘린더 (가로 스크롤) */}
      <View style={styles.calendarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {weekDates.map((item, index) => {
            const isSelected = item.date === selectedDate;
            // 일요일은 빨간색, 토요일은 파란색 처리
            const isWeekend = item.day === '일' ? '#EF4444' : item.day === '토' ? '#3B82F6' : '#6B7280';
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.dateBox, isSelected && styles.dateBoxSelected]}
                onPress={() => setSelectedDate(item.date)}
              >
                <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : isWeekend }]}>{item.day}</Text>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 근무 카드 리스트 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList
          data={scheduleData} // 더미 대신 상태 데이터 사용
          renderItem={renderShiftCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
            <Text style={styles.modalTitle}>휴무 신청 / 대타 구하기</Text>
            {selectedShiftForLeave && (
              <Text style={styles.modalSubtitle}>
                {selectedShiftForLeave.fullDate} ({selectedShiftForLeave.day}) {selectedShiftForLeave.time}
              </Text>
            )}
            
            <TextInput
              style={styles.reasonInput}
              placeholder="휴무 사유를 상세히 적어주세요 (예: 병원 진료, 학교 시험 등)"
              placeholderTextColor="#9CA3AF"
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline={true}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setLeaveModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSubmitLeaveRequest}>
                <Text style={styles.modalSubmitText}>신청하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// 3. UI 스타일링
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  monthChangeButton: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  
  // 달력 영역
  calendarContainer: { backgroundColor: '#FFFFFF', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  calendarScroll: { paddingHorizontal: 16, gap: 8 },
  dateBox: { 
    width: 50, 
    height: 70, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 12, 
    backgroundColor: '#F9FAFB' 
  },
  dateBoxSelected: { backgroundColor: '#2563EB' },
  dayText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  dateTextSelected: { color: '#FFFFFF' },
  
  // 카드 리스트 영역
  listContainer: { padding: 16, gap: 16 },
  card: { 
    backgroundColor: '#FFFFFF', 
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
  cardDate: { fontSize: 16, fontWeight: '700', color: '#111827' },
  
  // 배지 스타일
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeScheduled: { backgroundColor: '#E0F2FE' },
  badgeTextScheduled: { color: '#0284C7', fontSize: 12, fontWeight: '600' },
  badgeCompleted: { backgroundColor: '#F3F4F6' },
  badgeTextCompleted: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  badgeSubstitute: { backgroundColor: '#FEF3C7' },
  badgeTextSubstitute: { color: '#D97706', fontSize: 12, fontWeight: '600' },
  badgeOff: { backgroundColor: '#FEE2E2' },
  badgeTextOff: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { fontSize: 16, marginRight: 8 },
  infoText: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  
  // 휴무 신청 버튼
  leaveButton: { 
    marginTop: 8, 
    backgroundColor: '#F3F4F6', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  leaveButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  
  // 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  reasonInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, height: 100, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB', marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
  modalSubmitButton: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }
});

export default ScheduleScreen;