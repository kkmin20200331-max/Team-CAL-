import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { approveStoreMemberAPI, rejectStoreMemberAPI, getAttendanceRecordsAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';

const EmployeeDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { employee } = route.params;
  const { userInfo } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [processing, setProcessing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const isPending = employee.sectionStatus === 'PENDING' || employee.status === 'PENDING';

  useEffect(() => {
    if (isPending || !storeId || !employee.id) return;

    const fetchTodayAttendance = async () => {
      setAttendanceLoading(true);
      try {
        const today = new Date();
        const monthStr = format(today, 'yyyy-MM');
        const todayStr = format(today, 'yyyy-MM-dd');
        
        const { data } = await getAttendanceRecordsAPI(employee.id, monthStr, storeId);
        
        if (Array.isArray(data)) {
          const todayRecord = data.find((item: any) => {
            const itemDate = item.work_date || item.workDate || item.date;
            return itemDate === todayStr;
          });
          setTodayAttendance(todayRecord || null);
        }
      } catch (error) {
        console.error('오늘의 출퇴근 기록 조회 실패:', error);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchTodayAttendance();
  }, [employee.id, storeId, isPending]);

  const formatTimeOnly = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes(' ')) {
      const parts = dateTimeStr.split(' ');
      if (parts[1]) {
        return parts[1].substring(0, 5);
      }
    }
    return dateTimeStr.substring(0, 5);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WORKING': return t('statusWorking');
      case 'COMPLETED': return t('statusCompleted');
      case 'CHECKED_OUT': return t('statusCheckedOut');
      case 'LATE': return t('statusLate');
      case 'EARLY_LEAVE': return t('statusEarlyLeave');
      case 'ABSENT': return t('statusAbsent');
      case 'NORMAL': return t('statusNormal');
      default: return status;
    }
  };

  const handleApprove = async () => {
    if (!storeId) {
      Alert.alert(t('error'), t('noStoreInfo'));
      return;
    }

    setProcessing(true);
    try {
      await approveStoreMemberAPI(employee.id, storeId);
      Toast.show({
        type: 'success',
        text1: t('approvalComplete'),
        text2: `${employee.name}${t('approvedStaffMsg')}`,
      });
      navigation.goBack();
    } catch (error) {
      console.error('직원 승인 오류:', error);
      Alert.alert(t('approvalFailed'), t('approvalFailedMsg'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = () => {
    if (!storeId) {
      Alert.alert(t('error'), t('noStoreInfo'));
      return;
    }

    Alert.alert(t('rejectRequest'), `${employee.name}${t('rejectConfirmMsg')}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deny'),
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await rejectStoreMemberAPI(employee.id, storeId);
            Toast.show({
              type: 'info',
              text1: t('rejectRequest'),
              text2: `${employee.name}${t('rejectedStaffMsg')}`,
            });
            navigation.goBack();
          } catch (error) {
            console.error('직원 거절 오류:', error);
            Alert.alert(t('rejectionFailed'), t('rejectionFailedMsg'));
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('employeeDetailTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.label}>{t('nameLabel')}</Text>
          <Text style={styles.value}>{employee.name}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>{t('idLabel')}</Text>
          <Text style={styles.value}>{employee.username || employee.id}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>{t('phoneLabel')}</Text>
          <Text style={styles.value}>{employee.phone || '-'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>{t('roleLabel')}</Text>
          <Text style={styles.value}>{employee.role || 'STAFF'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>{t('status')}</Text>
          <Text style={[styles.value, isPending && styles.pendingText]}>
            {isPending ? t('pendingApproval') : t('approved')}
          </Text>
        </View>

        {!isPending && (
          <View style={styles.attendanceSection}>
            <Text style={styles.sectionHeader}>{t('todayAttendance')}</Text>
            
            {attendanceLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : todayAttendance ? (
              <View style={styles.attendanceCard}>
                <View style={styles.attendanceRow}>
                  <Text style={styles.attendanceLabel}>{t('checkIn')}</Text>
                  <Text style={styles.attendanceValue}>
                    {todayAttendance.check_in_at || todayAttendance.checkInAt || todayAttendance.check_in 
                      ? formatTimeOnly(todayAttendance.check_in_at || todayAttendance.checkInAt || todayAttendance.check_in)
                      : t('notCheckedInYet')}
                  </Text>
                </View>
                <View style={styles.attendanceRow}>
                  <Text style={styles.attendanceLabel}>{t('checkOut')}</Text>
                  <Text style={styles.attendanceValue}>
                    {todayAttendance.check_out_at || todayAttendance.checkOutAt || todayAttendance.check_out
                      ? formatTimeOnly(todayAttendance.check_out_at || todayAttendance.checkOutAt || todayAttendance.check_out)
                      : (todayAttendance.check_in_at || todayAttendance.checkInAt || todayAttendance.check_in 
                          ? t('notCheckedOutYet') 
                          : '-')}
                  </Text>
                </View>
                {todayAttendance.status && (
                  <View style={styles.attendanceRow}>
                    <Text style={styles.attendanceLabel}>{t('status')}</Text>
                    <Text style={[
                      styles.attendanceValue, 
                      (todayAttendance.status === 'LATE' || todayAttendance.status === 'EARLY_LEAVE') && { color: colors.warning || '#F59E0B' },
                      todayAttendance.status === 'ABSENT' && { color: colors.danger || '#EF4444' },
                      (todayAttendance.status === 'NORMAL' || todayAttendance.status === 'COMPLETED' || todayAttendance.status === 'WORKING' || todayAttendance.status === 'CHECKED_OUT') && { color: colors.primary || '#00A200' }
                    ]}>
                      {getStatusText(todayAttendance.status)}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAttendanceBox}>
                <Text style={styles.noAttendanceText}>{t('noAttendanceToday')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate('AttendanceRecord', { 
                employeeId: employee.id, 
                employeeName: employee.name 
              })}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.historyButtonText}>{t('viewMonthlyAttendance')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {isPending && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={processing}
          >
            <Text style={styles.declineButtonText}>{t('deny')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? <ActivityIndicator color="#065F46" /> : <Text style={styles.approveButtonText}>{t('approve')}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 28, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  infoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.subText,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  pendingText: {
    color: '#F59E0B',
  },
  attendanceSection: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  attendanceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  attendanceLabel: {
    fontSize: 15,
    color: colors.subText,
  },
  attendanceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  noAttendanceBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  noAttendanceText: {
    color: colors.subText,
    fontSize: 14,
  },
  historyButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  approveButton: {
    backgroundColor: '#D1FAE5',
  },
  approveButtonText: {
    color: '#065F46',
    fontWeight: 'bold',
  },
});

export default EmployeeDetailScreen;
