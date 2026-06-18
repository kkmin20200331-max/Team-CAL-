import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useApp } from '../../contexts/AppContext';
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLanguage } from '../../contexts/LanguageContext';

const WeeklyPayrollDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { weekStartDate } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  const { employees, shifts } = useSchedule();
  const { userInfo } = useApp();

  const weeklyDetails = useMemo(() => {
    if (!userInfo || !shifts || !employees) return null;

    const employee = employees.find(e => e.id === userInfo.id);
    if (!employee) return null;

    const weekStart = startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(weekStartDate), { weekStartsOn: 1 });

    const employeeShiftsInWeek = shifts.filter(shift => 
      shift.userId === employee.id &&
      isWithinInterval(new Date(shift.date), { start: weekStart, end: weekEnd }) &&
      (shift.status === 'CONFIRMED' || shift.status === 'COMPLETED' || shift.status === 'IN_PROGRESS')
    );

    let totalMinutes = 0;
    const dailyBreakdown = employeeShiftsInWeek.map(shift => {
      let dailyMinutes = 0;
      if (shift.time && shift.time.includes(' - ')) {
        const [startStr, endStr] = shift.time.split(' - ');
        const startTime = parseISO(`2000-01-01T${startStr}:00`);
        const endTime = parseISO(`2000-01-01T${endStr}:00`);
        dailyMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        totalMinutes += dailyMinutes;
      }
      return {
        ...shift,
        dailyHours: (dailyMinutes / 60).toFixed(1),
        dailyPay: Math.round((dailyMinutes / 60) * employee.payRate),
      };
    });

    const totalHours = totalMinutes / 60;
    const totalPay = Math.round(totalHours * employee.payRate);

    return {
      employee,
      dailyBreakdown,
      totalDays: dailyBreakdown.length,
      totalHours: totalHours.toFixed(1),
      totalPay,
      weekStart,
      weekEnd,
    };
  }, [weekStartDate, userInfo, employees, shifts]);

  if (!weeklyDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('weeklyDetailTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.errorText}>{t('noDetails')}</Text>
      </SafeAreaView>
    );
  }

  const { employee, dailyBreakdown, totalDays, totalHours, totalPay, weekStart, weekEnd } = weeklyDetails;

  const renderWorkHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{format(new Date(item.date), 'M/d (eee)', { locale: ko })}</Text>
      <Text style={styles.historyTime}>{item.time}</Text>
      <Text style={styles.historyPay}>{item.dailyPay.toLocaleString()}{t('currency')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('weeklyDetailTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.weekRangeText}>
            {format(weekStart, 'M월 d일')} ~ {format(weekEnd, 'M월 d일')}
          </Text>
          <Text style={styles.totalPayLabel}>{t('weeklySalary')} (세전)</Text>
          <Text style={styles.totalPayAmount}>{totalPay.toLocaleString()}{t('currency')}</Text>
          
          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('totalWorkDays')}</Text>
              <Text style={styles.detailValue}>{totalDays}{t('daysUnit')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('totalWorkHours')}</Text>
              <Text style={styles.detailValue}>{totalHours}{t('hoursUnit')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('appliedRate')}</Text>
              <Text style={styles.detailValue}>{employee.payRate.toLocaleString()}{t('currency')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>{t('dailyWorkHistory')}</Text>
          <FlatList
            data={dailyBreakdown}
            renderItem={renderWorkHistoryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyHistory}>{t('noWeeklyWorkHistory')}</Text>}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  errorText: { textAlign: 'center', marginTop: 50, color: colors.subText },
  
  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center' },
  weekRangeText: { fontSize: 14, color: colors.subText, marginBottom: 16 },
  totalPayLabel: { fontSize: 14, color: colors.subText },
  totalPayAmount: { fontSize: 36, fontWeight: 'bold', color: colors.text, marginTop: 4, marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginBottom: 20 },
  
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 13, color: colors.subText, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  historySection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12, paddingHorizontal: 8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  historyDate: { flex: 2, fontSize: 15, color: colors.text, fontWeight: '500' },
  historyTime: { flex: 3, fontSize: 15, color: colors.subText, textAlign: 'center' },
  historyPay: { flex: 2, fontSize: 15, color: colors.text, fontWeight: '600', textAlign: 'right' },
  emptyHistory: { textAlign: 'center', color: colors.subText, padding: 20 },
});

export default WeeklyPayrollDetailScreen;