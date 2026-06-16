import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  isAlertVisible: boolean;
  navigation: any;
  handleAcceptSubstitute: () => void;
  setIsAlertVisible: (visible: boolean) => void;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
};

const SubstituteAlertCard = ({ isAlertVisible, navigation, handleAcceptSubstitute, setIsAlertVisible, colors, isDarkMode, t }: Props) => {
  const styles = getThemedStyles(colors, isDarkMode);

  if (!isAlertVisible) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('SubstituteMatching')} activeOpacity={0.8}>
      <View style={styles.alertHeader}> 
        <Text style={styles.alertIcon}>🚨</Text>
        <Text style={styles.alertTitle}>{t('subReqAlertTitle')} 〉</Text>
      </View>
      <Text style={styles.alertDescription}>
        {t('subReqAlertDesc')}
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
    backgroundColor: isDarkMode ? '#3F3119' : '#FFFBEB',
    borderWidth: 1,
    borderColor: isDarkMode ? '#92400E' : '#FDE68A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
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