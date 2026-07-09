import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import Ionicons from '@expo/vector-icons/Ionicons';

const PayrollDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employeeId, month, payrollEntry } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  const { employees, shifts } = useSchedule();
  const { t, language } = useLanguage();
  
  const dateLocale = useMemo(() => {
    if (language === 'English') return enUS;
    if (language === '日本語') return ja;
    return ko;
  }, [language]);

  // employee 정보가 ScheduleContext에 없을 수도 있으므로 (빈 배열이거나 로드 지연 등)
  // payrollEntry에 있는 데이터를 최우선으로 사용합니다.
  const employee = useMemo(() => employees?.find(e => e.id === employeeId), [employees, employeeId]);
  
  const displayEmployeeName = payrollEntry?.employeeName || employee?.name || t('이름 없음');
  const displayPosition = payrollEntry?.position || t('직원');
  const displayEmail = (employee as any)?.email || t('이메일 정보 없음');
  
  // 시급/월급 확인
  const payType = employee?.payType || 'HOURLY';
  const payRate = employee?.payRate || payrollEntry?.hourlyRate || 0;

  // Calculate daily history (이건 스케줄에서 가져와야 하므로 shifts 의존)
  const workHistory = useMemo(() => {
    if (!shifts || !employeeId || !month) return [];
    
    const selectedMonth = new Date(month);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const employeeShiftsInMonth = shifts.filter(shift => 
      shift.userId === employeeId &&
      isWithinInterval(new Date(shift.date), { start: monthStart, end: monthEnd }) &&
      (shift.status === 'CONFIRMED' || shift.status === 'COMPLETED')
    );
    
    // Sort by date ascending
    return employeeShiftsInMonth.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shifts, employeeId, month]);

  // payrollEntry가 넘어오지 않은 경우 (앱을 새로고침하지 않아서 기존 화면에서 넘어온 경우)
  // 임시로 화면이 빈 값이라도 뜨게 처리합니다.
  const totalPay = payrollEntry?.totalPay || 0;
  const basePay = payrollEntry?.basePay || 0;
  const overtimePay = payrollEntry?.overtimePay || 0;
  const holidayPay = payrollEntry?.holidayPay || 0;
  const deductions = (payrollEntry?.tax || 0) + (payrollEntry?.insurance || 0) + (payrollEntry?.pension || 0);

  // 둘 다 없으면 에러 (최소한 employeeId나 payrollEntry는 있어야 함)
  if (!employeeId && !payrollEntry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('급여 명세서')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.subText }}>{t('급여 데이터를 불러올 수 없습니다.')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderDailyWage = (item: any, index: number) => {
    let dailyHours = 0;
    if (item.time && item.time.includes(' - ')) {
      const [startStr, endStr] = item.time.split(' - ');
      try {
        const [sH, sM] = startStr.split(':').map(Number);
        const [eH, eM] = endStr.split(':').map(Number);
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        dailyHours = diff / 60;
      } catch (e) {}
    }

    return (
      <React.Fragment key={item.id}>
        <View style={styles.dailyRow}>
          <View>
            <Text style={styles.dailyDate}>{format(new Date(item.date), t('dateFormatPattern'), { locale: dateLocale })}</Text>
            <Text style={styles.dailyHours}>{item.time || t('시간 미지정')} ({dailyHours.toFixed(1)}{t('시간')})</Text>
          </View>
          <Text style={styles.dailyAmount}>
             {payType === 'HOURLY' ? Math.round(dailyHours * payRate).toLocaleString() : '-'}{t('원')}
          </Text>
        </View>
        {index < workHistory.length - 1 && <View style={styles.listDivider} />}
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{month ? format(new Date(month), t('monthYearFormatPattern'), { locale: dateLocale }) : ''} {t('명세서')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. 직원 프로필 카드 */}
        <View style={styles.profileCard}>
           <View style={styles.avatar}>
             <Text style={styles.avatarText}>{displayEmployeeName[0] || t('직')}</Text>
           </View>
           <View style={styles.profileInfo}>
             <Text style={styles.profileName}>{displayEmployeeName} <Text style={styles.profilePosition}>{displayPosition}</Text></Text>
             <Text style={styles.profileEmail}>{displayEmail}</Text>
             <Text style={styles.profilePayType}>
               {payType === 'HOURLY' ? t('시급') : t('월급')} {payRate.toLocaleString()}{t('원')}
             </Text>
           </View>
        </View>

        {/* 2. 이번 달 급여 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('총 실수령액')}</Text>
          <Text style={styles.summaryAmount}>{totalPay.toLocaleString()}<Text style={styles.summaryCurrency}>{t('원')}</Text></Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('기본급')}</Text>
            <Text style={styles.detailValue}>{Math.round(basePay).toLocaleString()}{t('원')}</Text>
          </View>
          {overtimePay > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('연장/야간수당')}</Text>
              <Text style={styles.detailValue}>{Math.round(overtimePay).toLocaleString()}{t('원')}</Text>
            </View>
          )}
          {holidayPay > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('주휴/기타수당')}</Text>
              <Text style={styles.detailValue}>{Math.round(holidayPay).toLocaleString()}{t('원')}</Text>
            </View>
          )}
          {deductions > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('공제액')}</Text>
              <Text style={[styles.detailValue, { color: '#ef4444' }]}>-{Math.round(deductions).toLocaleString()}{t('원')}</Text>
            </View>
          )}
        </View>

        {/* 3. 일자별 근무 내역 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>{t('상세 근무 내역')}</Text>
          <View style={styles.listCard}>
            {workHistory.length === 0 ? (
              <Text style={styles.emptyText}>{t('해당 월의 근무 기록이 없습니다.')}</Text>
            ) : (
              workHistory.map((item, index) => renderDailyWage(item, index))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  backButton: { padding: 4, width: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20 },

  profileCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, 
    borderRadius: 16, padding: 20, marginBottom: 20, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  profilePosition: { fontSize: 14, fontWeight: 'normal', color: colors.primary },
  profileEmail: { fontSize: 13, color: colors.subText, marginBottom: 4 },
  profilePayType: { fontSize: 13, fontWeight: '600', color: colors.text },

  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  summaryTitle: { fontSize: 14, color: colors.subText, marginBottom: 8, fontWeight: '600' },
  summaryAmount: { fontSize: 32, fontWeight: '900', color: colors.text },
  summaryCurrency: { fontSize: 20, fontWeight: '600', color: colors.subText },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: colors.subText },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.text },

  listSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  listCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 1 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  dailyDate: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  dailyHours: { fontSize: 13, color: colors.subText },
  dailyAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  listDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  emptyText: { textAlign: 'center', paddingVertical: 20, color: colors.subText, fontSize: 15 },
});

export default PayrollDetailScreen;