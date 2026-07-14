import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';

// Props 타입 정의
type Props = {
  loading: boolean;
  todayShift: any;
  fadeAnim: Animated.Value;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
};

// 근무 상태 텍스트 반환 함수
const getStatusText = (status: string, t: (key: string) => string) => {
  switch(status) {
    case 'SCHEDULED': return t('scheduled');
    case 'IN_PROGRESS': return t('inProgress');
    case 'COMPLETED': return t('completed');
    case 'SUBSTITUTE_REQ': return t('substituteReq');
    case 'LEAVE_PENDING': return t('leavePending');
    case 'OFF': return t('offDay');
    default: return '';
  }
};

// 근무 상태 색상 반환 함수
const getStatusColor = (status: string, isDarkMode: boolean) => {
  switch(status) {
    case 'SCHEDULED': return { bg: isDarkMode ? 'rgba(0,162,0,0.16)' : '#EEF5DD', text: isDarkMode ? '#00A200' : '#008200' };
    case 'IN_PROGRESS': return { bg: isDarkMode ? '#004D00' : '#D6F2C5', text: isDarkMode ? '#00A200' : '#008200' };
    case 'COMPLETED': return { bg: isDarkMode ? '#1F293D' : '#F3F4F6', text: isDarkMode ? '#94A3B8' : '#4B5563' };
    case 'SUBSTITUTE_REQ': return { bg: isDarkMode ? '#78350F' : '#FEF3C7', text: isDarkMode ? '#FDE68A' : '#D97706' };
    case 'LEAVE_PENDING': return { bg: isDarkMode ? '#78350F' : '#FEF3C7', text: isDarkMode ? '#FDE68A' : '#D97706' };
    case 'OFF': return { bg: isDarkMode ? '#7F1D1D' : '#FEE2E2', text: isDarkMode ? '#FECACA' : '#DC2626' };
    default: return { bg: isDarkMode ? '#1F293D' : '#F3F4F6', text: isDarkMode ? '#94A3B8' : '#4B5563' };
  }
};

const calculateDailyWage = (time: string, payRate: number) => {
  if (!time || !time.includes(' - ')) return 0;
  const [start, end] = time.split(' - ');
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  
  let diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff < 0) diff += 24 * 60;
  
  const dailyHours = diff / 60;
  return Math.round(dailyHours * payRate);
};

const TodayShiftCard = ({ loading, todayShift, fadeAnim, colors, isDarkMode, t }: Props) => {
  const { userInfo } = useApp();
  const styles = getThemedStyles(colors, isDarkMode);
  const statusColor = todayShift ? getStatusColor(todayShift.status, isDarkMode) : getStatusColor('', isDarkMode);
  const statusText = todayShift ? getStatusText(todayShift.status, t) : '';

  const payRate = userInfo?.payRate || 9860;
  const dailyWage = todayShift ? calculateDailyWage(todayShift.time, payRate) : 0;

  return (
    <View style={styles.card}>
      {/* 카드 헤더 */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t('todayWork')}</Text>
        {todayShift && (
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{statusText}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <Animated.View style={{ opacity: fadeAnim, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
            <View style={{ width: '50%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
            <View style={{ width: '70%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '30%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
            <View style={{ width: '40%', height: 24, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
          </View>
        </Animated.View>
      ) : todayShift ? (
        <>
          {/* 근무 상세 정보 */}
          <View style={styles.workInfoRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>{todayShift.time}</Text>
          </View>
          {todayShift.status !== 'OFF' && (
            <View style={styles.workInfoRow}>
              <Ionicons name="location-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{todayShift.storeName}</Text>
            </View>
          )}

          {/* 출퇴근 시간 표시 영역 */}
          {todayShift.checkInTime && (
            <View style={styles.workInfoRow}>
              <Ionicons name="log-in-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>출근: {todayShift.checkInTime}</Text>
            </View>
          )}
          {todayShift.checkOutTime && (
            <View style={styles.workInfoRow}>
              <Ionicons name="log-out-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>퇴근: {todayShift.checkOutTime}</Text>
            </View>
          )}

          {/* 구분선 */}
          <View style={styles.divider} />
          {/* 급여 정보 */}
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>{t('expectedDailyWage')}</Text>
            <Text style={styles.salaryValue}>{dailyWage.toLocaleString()}{t('currency')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={40} color={colors.subText} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>{t('noScheduleToday')}</Text>
        </View>
      )}
    </View>
  );
};

// 스타일 정의
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyIcon: { marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.subText, fontWeight: '500' },
});

export default TodayShiftCard;