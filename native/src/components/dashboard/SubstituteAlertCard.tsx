import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
<<<<<<< HEAD
import { useTheme } from '../../contexts/ThemeContext';
=======
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

type Props = {
  isAlertVisible: boolean;
  navigation: any;
  handleAcceptSubstitute: () => void;
  setIsAlertVisible: (visible: boolean) => void;
  t: (key: string) => string;
};

const SubstituteAlertCard = ({ isAlertVisible, navigation, handleAcceptSubstitute, setIsAlertVisible, t }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  if (!isAlertVisible) {
    return null;
  }

  const alertColor = isDarkMode ? '#FCD34D' : '#D97706';

  return (
    <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('SubstituteMatching')} activeOpacity={0.8}>
      <View style={styles.alertHeader}> 
        <Ionicons name="alert-circle-outline" size={18} color={alertColor} style={styles.alertIcon} />
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

const getThemedStyles = (colors: any) => StyleSheet.create({
  alertCard: {
<<<<<<< HEAD
    backgroundColor: colors.yellowLight,
=======
    backgroundColor: isDarkMode ? '#2A2010' : '#FFFDF5',
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
    borderWidth: 1,
    borderColor: colors.yellow,
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
    color: colors.yellow,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.yellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.white,
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