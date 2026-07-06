import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Shift } from '../../types/Schedule';
import { User } from '../../types/User';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  const { schedule, userInfo }: { schedule: Shift[], userInfo: User } = route.params || {};
  
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [dailyWages, setDailyWages] = useState<DailyWage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (schedule && userInfo && schedule.length > 0) {
      calculatePayroll();
    } else {
      setIsLoading(false);
    }
  }, [schedule, userInfo]);

  const calculatePayroll = () => {
    setIsLoading(true);
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const payRate = userInfo.payRate || 9860;

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

          // 주차별 근무시간 합산 (월요일 기준)
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

    // 주휴수당 계산: 주 15시간 이상 근무 시 (근무시간/40)*8*시급
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

  const renderDailyWage = ({ item }: { item: DailyWage }) => (
    <View style={styles.dailyRow}>
      <View>
        <Text style={styles.dailyDate}>{item.date}</Text>
        <Text style={styles.dailyHours}>{item.hours}</Text>
      </View>
      <Text style={styles.dailyAmount}>{item.amount.toLocaleString()}{t('currency')}</Text>
    </View>
  );

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
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.subText },

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
  emptyText: { textAlign: 'center', paddingVertical: 20, color: colors.subText },
});

export default PayrollScreen;
