import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  isAlertVisible: boolean;
  navigation: any;
  handleAcceptSubstitute: () => void;
  setIsAlertVisible: (visible: boolean) => void;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
  activeSubPost?: {
    id: string;
    requesterName: string;
    workDate: string;
    workTime: string;
    reason: string;
  } | null;
};

const SubstituteAlertCard = ({ isAlertVisible, navigation, handleAcceptSubstitute, setIsAlertVisible, colors, isDarkMode, t, activeSubPost }: Props) => {
  const styles = getThemedStyles(colors, isDarkMode);

  // 선민 수정 (2026-07-06): 노출 가능한 실제 대타 요청이 없거나 비활성화인 경우 렌더링 생략
  if (!isAlertVisible || !activeSubPost) {
    return null;
  }

  const alertColor = isDarkMode ? '#FCD34D' : '#D97706';

  return (
    <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Substitute')} activeOpacity={0.8}>
      <View style={styles.alertHeader}> 
        <Ionicons name="alert-circle-outline" size={18} color={alertColor} style={styles.alertIcon} />
        <Text style={styles.alertTitle}>{t('subReqAlertTitle')}</Text>
      </View>
      {/* 선민 수정 (2026-07-06): 하드코딩된 대타 알림 설명 대신 실제 접수된 대타 요청자명, 일정 일자 및 사유 동적 바인딩 */}
      <Text style={styles.alertDescription}>
        {activeSubPost.requesterName}님이 {activeSubPost.workDate} ({activeSubPost.workTime}) 대타를 요청했습니다.{"\n"}사유: {activeSubPost.reason}
      </Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptSubstitute}>
          <Text style={styles.acceptButtonText}>{t('applyBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={() => setIsAlertVisible(false)}>
          <Text style={styles.rejectButtonText}>{t('rejectBtn')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  alertCard: {
    backgroundColor: isDarkMode ? '#2A2010' : '#FFFDF5',
    borderWidth: 1,
    borderColor: isDarkMode ? '#92400E' : '#FDE68A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDarkMode ? '#FCD34D' : '#D97706',
  },
  alertDescription: {
    fontSize: 14,
    color: isDarkMode ? '#E5E7EB' : '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default SubstituteAlertCard;