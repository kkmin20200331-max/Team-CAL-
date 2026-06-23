import React, { useState } from 'react';
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
import { approveStoreMemberAPI, rejectStoreMemberAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

const EmployeeDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { employee } = route.params;
  const { userInfo } = useApp();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    if (!storeId) {
      Alert.alert('오류', '선택된 매장 정보가 없습니다.');
      return;
    }

    setProcessing(true);
    try {
      await approveStoreMemberAPI(employee.id, storeId);
      Toast.show({
        type: 'success',
        text1: '승인 완료',
        text2: `${employee.name}님의 근무 요청을 승인했습니다.`,
      });
      navigation.goBack();
    } catch (error) {
      console.error('직원 승인 오류:', error);
      Alert.alert('승인 실패', '직원 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = () => {
    if (!storeId) {
      Alert.alert('오류', '선택된 매장 정보가 없습니다.');
      return;
    }

    Alert.alert('요청 거절', `${employee.name}님의 근무 요청을 거절하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '거절',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await rejectStoreMemberAPI(employee.id, storeId);
            Toast.show({
              type: 'info',
              text1: '요청 거절',
              text2: `${employee.name}님의 근무 요청을 거절했습니다.`,
            });
            navigation.goBack();
          } catch (error) {
            console.error('직원 거절 오류:', error);
            Alert.alert('거절 실패', '직원 요청 거절 중 오류가 발생했습니다.');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const isPending = employee.sectionStatus === 'PENDING' || employee.status === 'PENDING';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 상세 정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{employee.name}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>아이디</Text>
          <Text style={styles.value}>{employee.username || employee.id}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>연락처</Text>
          <Text style={styles.value}>{employee.phone || '-'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>역할</Text>
          <Text style={styles.value}>{employee.role || 'STAFF'}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.label}>상태</Text>
          <Text style={[styles.value, isPending && styles.pendingText]}>
            {isPending ? '승인 대기' : '승인됨'}
          </Text>
        </View>
      </ScrollView>

      {isPending && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={processing}
          >
            <Text style={styles.declineButtonText}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? <ActivityIndicator color="#065F46" /> : <Text style={styles.approveButtonText}>승인</Text>}
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
