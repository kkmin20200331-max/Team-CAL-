import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Shift } from '../../types/Schedule';
import { User } from '../../types/User';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getStorePayrollAPI } from '../../../api/auth';

interface DailyWage {
  id: string;
  date: string;
  hours: string;
  amount: number;
}

interface PayrollSummary {
  estimatedTotal: number;
  basePay: number;
  holidayPay: number;
  substituteBonus: number;
}

const PayrollScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const { userInfo } = useApp();
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
  const activeBranch = useMemo(() => {
    return userInfo?.branches?.find((branch) => branch.id === userInfo.activeBranchId);
  }, [userInfo]);
  const styles = getThemedStyles(colors, isDarkMode);

  // STAFF Role States & Params
  const { schedule, userInfo: staffUserInfo }: { schedule: Shift[], userInfo: User } = route.params || {};
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [dailyWages, setDailyWages] = useState<DailyWage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ADMIN Role States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [storePayrollEntries, setStorePayrollEntries] = useState<any[]>([]);
  const [loadingStorePayroll, setLoadingStorePayroll] = useState(false);

  const isAdmin = userInfo?.role === 'ADMIN';

  // STAFF Payroll Calculation
  useEffect(() => {
    if (!isAdmin) {
      if (schedule && staffUserInfo && schedule.length > 0) {
        calculateStaffPayroll();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, schedule, staffUserInfo]);

  const calculateStaffPayroll = () => {
    setIsLoading(true);
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const payRate = staffUserInfo.payRate || 9860;

    let totalMinutes = 0;
    const wages: DailyWage[] = [];
    const weekMap: { [key: string]: number } = {};

    schedule.forEach(item => {
      const shiftDate = parseISO(item.fullDate);
      if (isWithinInterval(shiftDate, { start: monthStart, end: monthEnd })) {
        if (item.status !== 'OFF' && (item.status as any) !== 'LEAVE_PENDING' && item.status !== 'SUBSTITUTE_REQ' && item.time && item.time.includes(' - ')) {
          const [start, end] = item.time.split(' - ');
          const [sH, sM] = start.split(':').map(Number);
          const [eH, eM] = end.split(':').map(Number);
          
          let diff = (eH * 60 + eM) - (sH * 60 + sM);
          if (diff < 0) diff += 24 * 60;
          
          totalMinutes += diff;
          const dailyHours = diff / 60;
          const dailyAmount = dailyHours * payRate;

          const weekStartStr = format(startOfWeek(shiftDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          weekMap[weekStartStr] = (weekMap[weekStartStr] || 0) + dailyHours;

          wages.push({
            id: item.id,
            date: format(shiftDate, "M월 d일 (eee)", { locale: ko }),
            hours: `${dailyHours.toFixed(1)}시간`,
            amount: Math.round(dailyAmount),
          });
        }
      }
    });

    const totalHours = totalMinutes / 60;
    const basePay = totalHours * payRate;

    let totalHolidayPay = 0;
    Object.values(weekMap).forEach(hours => {
      if (hours >= 15) {
        const holidayHours = (Math.min(hours, 40) / 40) * 8;
        totalHolidayPay += holidayHours * payRate;
      }
    });

    setSummary({
      estimatedTotal: Math.round(basePay + totalHolidayPay),
      basePay: Math.round(basePay),
      holidayPay: Math.round(totalHolidayPay),
      substituteBonus: 0,
    });

    setDailyWages(wages.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()));
    setIsLoading(false);
  };

  // ADMIN Store Payroll Fetching
  useEffect(() => {
    if (isAdmin && storeId) {
      const loadStorePayroll = async () => {
        setLoadingStorePayroll(true);
        try {
          const periodStr = format(currentMonth, 'yyyy-MM');
          const res = await getStorePayrollAPI(storeId, periodStr);
          setStorePayrollEntries(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error('[PayrollScreen] Failed to load store payroll', err);
          setStorePayrollEntries([]);
        } finally {
          setLoadingStorePayroll(false);
        }
      };
      
      loadStorePayroll();
    }
  }, [isAdmin, storeId, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(m => subMonths(m, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(m => addMonths(m, 1));
  };

  const totalStorePayroll = useMemo(() => {
    return storePayrollEntries.reduce((sum, entry) => sum + (entry.totalPay || 0), 0);
  }, [storePayrollEntries]);

  const totalEmployeeCount = useMemo(() => {
    return storePayrollEntries.length;
  }, [storePayrollEntries]);

  const renderDailyWage = ({ item }: { item: DailyWage }) => (
    <View style={styles.dailyRow}>
      <View>
        <Text style={styles.dailyDate}>{item.date}</Text>
        <Text style={styles.dailyHours}>{item.hours}</Text>
      </View>
      <Text style={styles.dailyAmount}>{item.amount.toLocaleString()}{t('currency')}</Text>
    </View>
  );

  // ----------------------------------------------------
  // ADMIN VIEW RENDER
  // ----------------------------------------------------
  if (isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>급여 정산 현황</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 월 선택 영역 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthChevron}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthChevron}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loadingStorePayroll ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>급여 내역을 조회 중입니다...</Text>
          </View>
        ) : storePayrollEntries.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="cash-outline" size={48} color={colors.subText} style={{ opacity: 0.5, marginBottom: 12 }} />
            <Text style={styles.emptyText}>선택한 달의 급여 정산 기록이 없습니다.</Text>
          </View>
        ) : (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* 총계 요약 카드 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>총 급여 지급액 (세후 예상)</Text>
              <Text style={styles.summaryAmount}>
                {totalStorePayroll.toLocaleString()}
                <Text style={styles.summaryCurrency}>원</Text>
              </Text>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>총 직원 수</Text>
                <Text style={styles.detailValue}>{totalEmployeeCount}명</Text>
              </View>
            </View>

            {/* 직원별 리스트 */}
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>직원별 정산 내역 ({totalEmployeeCount}건)</Text>
              <View style={{ gap: 12 }}>
                {storePayrollEntries.map((entry) => {
                  const deductions = (entry.tax || 0) + (entry.insurance || 0) + (entry.pension || 0);
                  const displayHours = ((entry.regularHours || 0) + (entry.overtimeHours || 0) + (entry.holidayHours || 0)).toFixed(1);
                  return (
                    <TouchableOpacity
                      key={entry.employeeId || entry.id}
                      style={styles.adminEmployeeCard}
                      onPress={() => navigation.navigate('PayrollDetail', {
                        employeeId: entry.employeeId,
                        month: format(currentMonth, 'yyyy-MM-dd'),
                        payrollEntry: entry
                      })}
                    >
                      <View style={styles.employeeCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={styles.avatarMini}>
                            <Text style={styles.avatarMiniText}>{entry.employeeName?.[0] || '직'}</Text>
                          </View>
                          <View>
                            <Text style={styles.employeeNameText}>{entry.employeeName}</Text>
                            <Text style={styles.employeePositionText}>{entry.position || '직원'}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.subText} />
                      </View>
                      
                      <View style={styles.employeeCardDivider} />
                      
                      <View style={styles.employeeCardDetails}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.cardDetailLabel}>근무시간</Text>
                          <Text style={styles.cardDetailValue}>{displayHours}h</Text>
                        </View>
                        <View style={styles.detailColumn}>
                          <Text style={styles.cardDetailLabel}>기본급</Text>
                          <Text style={styles.cardDetailValue}>{Math.round(entry.basePay || 0).toLocaleString()}원</Text>
                        </View>
                        <View style={styles.detailColumn}>
                          <Text style={styles.cardDetailLabel}>공제액</Text>
                          <Text style={[styles.cardDetailValue, { color: '#ef4444' }]}>{Math.round(deductions).toLocaleString()}원</Text>
                        </View>
                        <View style={styles.detailColumn}>
                          <Text style={styles.cardDetailLabel}>실수령액</Text>
                          <Text style={[styles.cardDetailValue, { color: colors.primary, fontWeight: '800' }]}>{Math.round(entry.totalPay || 0).toLocaleString()}원</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // STAFF VIEW RENDER (DEFAULT)
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payrollTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('calculatingPayroll')}</Text>
        </View>
      ) : !summary || dailyWages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('noWorkRecordThisMonth')}</Text>
        </View>
      ) : (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('estMonthlySalary')}</Text>
          <Text style={styles.summaryAmount}>{summary.estimatedTotal.toLocaleString()}<Text style={styles.summaryCurrency}>{t('currency')}</Text></Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('basePay')}</Text>
            <Text style={styles.detailValue}>{summary.basePay.toLocaleString()}{t('currency')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('holidayPay')}</Text>
            <Text style={styles.detailValue}>{summary.holidayPay.toLocaleString()}{t('currency')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('substituteBonus')}</Text>
            <Text style={[styles.detailValue, { color: isDarkMode ? '#86EFAC' : '#16A34A' }]}>+{summary.substituteBonus.toLocaleString()}{t('currency')}</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>{t('dailyWageDetail')}</Text>
          <View style={styles.listCard}>
            {dailyWages.map((wage, index) => (
              <React.Fragment key={wage.id}>
                {renderDailyWage({ item: wage })}
                {index < dailyWages.length - 1 && <View style={styles.listDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
      )}
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
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.subText },

  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24,
    paddingVertical: 14, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  monthChevron: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? '#222' : '#f0f0f0',
    alignItems: 'center', justifyContent: 'center'
  },
  monthText: { fontSize: 18, fontWeight: 'bold', color: colors.text },

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

  adminEmployeeCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 18, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6
  },
  employeeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarMini: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center'
  },
  avatarMiniText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  employeeNameText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  employeePositionText: { fontSize: 12, color: colors.subText, marginTop: 2 },
  employeeCardDivider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  employeeCardDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailColumn: { alignItems: 'flex-start', flex: 1 },
  cardDetailLabel: { fontSize: 11, color: colors.subText, marginBottom: 4 },
  cardDetailValue: { fontSize: 14, fontWeight: '600', color: colors.text }
});

export default PayrollScreen;
