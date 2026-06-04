import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

// ✅ 1. 백엔드에서 받아올 데이터의 형태(타입)를 미리 정의합니다.
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
  accumulatedWeekly: number; // 주급 신청 가능한 이번 주 누적 급여
}

const PayrollScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { userInfo } = route.params || {};
  
  // 테마 색상 상태 가져오기
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // ✅ 2. 서버에서 불러올 상태 관리
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [dailyWages, setDailyWages] = useState<DailyWage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequested, setIsRequested] = useState(false);

  // ✅ 3. 화면이 켜지면 급여 데이터를 불러옵니다.
  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      // [TODO: 실제 백엔드 연동 시 아래 코드를 사용하세요]
      // const response = await getPayrollAPI(userInfo.username);
      // setSummary(response.data.summary);
      // setDailyWages(response.data.dailyWages);
      // setIsRequested(response.data.isWeeklyAdvanceRequested);

      // 🚀 백엔드 통신을 흉내내는 임시 지연 로직 (1초 대기 후 더미데이터 삽입)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSummary({
        estimatedTotal: 1248320,
        basePay: 1048320,
        holidayPay: 150000,
        substituteBonus: 50000,
        accumulatedWeekly: 288960,
      });
      setDailyWages([
        { id: '1', date: '6월 01일 (월)', hours: '8시간', amount: 82560 },
        { id: '2', date: '6월 02일 (화)', hours: '8시간', amount: 82560 },
        { id: '3', date: '6월 05일 (금)', hours: '8시간', amount: 82560 },
        { id: '4', date: '6월 06일 (토)', hours: '4시간 (대타)', amount: 41280 },
      ]);
    } catch (error) {
      Alert.alert('오류', '급여 내역을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 4. 주급 신청 백엔드 통신 시뮬레이션
  const handleAdvancePayRequest = () => {
    Alert.alert(
      t('advancePayConfirmTitle'),
      t('advancePayConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('applyBtn'), 
          onPress: async () => {
            setIsRequested(true);
            try {
              // [TODO: 실제 연동 시 주급 신청 API 호출]
              // await requestAdvancePayAPI({ userId: userInfo.username, amount: summary?.accumulatedWeekly });
              await new Promise(resolve => setTimeout(resolve, 1500)); // 통신 대기
              Alert.alert(t('advancePaySuccessTitle'), t('advancePaySuccessMsg'));
            } catch (error) {
              Alert.alert('오류', '주급 신청 중 문제가 발생했습니다.');
              setIsRequested(false); // 실패 시 상태 되돌림
            }
          } 
        }
      ]
    );
  };

  const renderDailyWage = ({ item }: { item: any }) => (
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payrollTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading || !summary ? (
        // 로딩 화면
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>데이터를 불러오는 중입니다...</Text>
        </View>
      ) : (
        // 데이터가 불러와졌을 때 보여줄 실제 화면
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 이번 달 누적 급여 요약 카드 */}
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

        {/* 이번 주 주급 신청 버튼 */}
        <TouchableOpacity 
          style={[styles.advanceButton, isRequested && styles.advanceButtonDisabled]} 
          onPress={handleAdvancePayRequest}
          disabled={isRequested}
        >
          <Text style={styles.advanceButtonText}>
            {isRequested ? '⏳ 승인 대기 중...' : `💸 ${t('advancePayBtn')}`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>현재까지 누적된 이번 주 예상 급여: {summary.accumulatedWeekly.toLocaleString()}원</Text>

        {/* 일별 상세 리스트 */}
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
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
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

  advanceButton: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  advanceButtonDisabled: { backgroundColor: isDarkMode ? '#374151' : '#D1D5DB' },
  advanceButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  helpText: { textAlign: 'center', fontSize: 13, color: colors.subText, marginBottom: 32 },

  listSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  listCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 1 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  dailyDate: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  dailyHours: { fontSize: 13, color: colors.subText },
  dailyAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  listDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
});

export default PayrollScreen;