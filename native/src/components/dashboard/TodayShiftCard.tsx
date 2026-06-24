import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
<<<<<<< HEAD
import { useTheme } from '../../contexts/ThemeContext';
=======
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

type Props = {
  loading: boolean;
  todayShift: any;
  fadeAnim: Animated.Value;
  t: (key: string) => string;
};

const getStatusText = (status: string, t: (key: string) => string) => {
  switch(status) {
    case 'SCHEDULED': return t('scheduled');
    case 'IN_PROGRESS': return t('inProgress');
    case 'COMPLETED': return t('completed');
    case 'SUBSTITUTE_REQ': return t('substituteReq');
    case 'OFF': return t('offDay');
    default: return '';
  }
};

const getStatusStyles = (status: string, colors: any) => {
  switch(status) {
<<<<<<< HEAD
    case 'SCHEDULED': return { bg: colors.skyLight, text: colors.sky };
    case 'IN_PROGRESS': return { bg: colors.greenLight, text: colors.green };
    case 'COMPLETED': return { bg: colors.gray, text: colors.subText };
    case 'SUBSTITUTE_REQ': return { bg: colors.yellowLight, text: colors.yellow };
    case 'OFF': return { bg: colors.redLight, text: colors.red };
    default: return { bg: colors.gray, text: colors.subText };
=======
    case 'SCHEDULED': return { bg: isDarkMode ? 'rgba(0,162,0,0.16)' : '#EEF5DD', text: isDarkMode ? '#00A200' : '#008200' };
    case 'IN_PROGRESS': return { bg: isDarkMode ? '#004D00' : '#D6F2C5', text: isDarkMode ? '#00A200' : '#008200' };
    case 'COMPLETED': return { bg: isDarkMode ? '#1F293D' : '#F3F4F6', text: isDarkMode ? '#94A3B8' : '#4B5563' };
    case 'SUBSTITUTE_REQ': return { bg: isDarkMode ? '#78350F' : '#FEF3C7', text: isDarkMode ? '#FDE68A' : '#D97706' };
    case 'OFF': return { bg: isDarkMode ? '#7F1D1D' : '#FEE2E2', text: isDarkMode ? '#FECACA' : '#DC2626' };
    default: return { bg: isDarkMode ? '#1F293D' : '#F3F4F6', text: isDarkMode ? '#94A3B8' : '#4B5563' };
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
  }
};

const TodayShiftCard = ({ loading, todayShift, fadeAnim, t }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const statusStyles = todayShift ? getStatusStyles(todayShift.status, colors) : getStatusStyles('', colors);
  const statusText = todayShift ? getStatusText(todayShift.status, t) : '';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t('todayWork')}</Text>
        {todayShift && (
          <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyles.text }]}>{statusText}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <Animated.View style={{ opacity: fadeAnim, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
<<<<<<< HEAD
            <View style={[styles.skeleton, { width: 20, height: 20, borderRadius: 10, marginRight: 8 }]} />
            <View style={[styles.skeleton, { width: '50%', height: 18 }]} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.skeleton, { width: 20, height: 20, borderRadius: 10, marginRight: 8 }]} />
            <View style={[styles.skeleton, { width: '70%', height: 18 }]} />
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={[styles.skeleton, { width: '30%', height: 18 }]} />
            <View style={[styles.skeleton, { width: '40%', height: 24 }]} />
=======
            <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
            <View style={{ width: '50%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
            <View style={{ width: '70%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '30%', height: 18, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
            <View style={{ width: '40%', height: 24, backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB', borderRadius: 6 }} />
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
          </View>
        </Animated.View>
      ) : todayShift ? (
        <>
          <View style={styles.workInfoRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>{todayShift.time}</Text>
          </View>
          {todayShift.status !== 'OFF' && (
            <View style={styles.workInfoRow}>
              <Ionicons name="location-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>{todayShift.storeName}</Text>
            </View>
          )}
          {todayShift.checkInTime && (
            <View style={styles.workInfoRow}>
<<<<<<< HEAD
              <Text style={styles.infoIcon}>▶️</Text>
              <Text style={styles.infoText}>{t('checkIn')}: {todayShift.checkInTime}</Text>
=======
              <Ionicons name="log-in-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>출근: {todayShift.checkInTime}</Text>
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
            </View>
          )}
          {todayShift.checkOutTime && (
            <View style={styles.workInfoRow}>
<<<<<<< HEAD
              <Text style={styles.infoIcon}>⏹️</Text>
              <Text style={styles.infoText}>{t('checkOut')}: {todayShift.checkOutTime}</Text>
=======
              <Ionicons name="log-out-outline" size={16} color={colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>퇴근: {todayShift.checkOutTime}</Text>
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>{t('expectedDailyWage')}</Text>
            <Text style={styles.salaryValue}>72,000{t('currency')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={40} color={colors.subText} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>{t('noScheduleToday')}</Text>
        </View>
      )}
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyIcon: { marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.subText, fontWeight: '500' },
  skeleton: {
    backgroundColor: colors.gray,
    borderRadius: 6,
  },
});

export default TodayShiftCard;