import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

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
    case 'SCHEDULED': return { bg: colors.skyLight, text: colors.sky };
    case 'IN_PROGRESS': return { bg: colors.greenLight, text: colors.green };
    case 'COMPLETED': return { bg: colors.gray, text: colors.subText };
    case 'SUBSTITUTE_REQ': return { bg: colors.yellowLight, text: colors.yellow };
    case 'OFF': return { bg: colors.redLight, text: colors.red };
    default: return { bg: colors.gray, text: colors.subText };
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
          </View>
        </Animated.View>
      ) : todayShift ? (
        <>
          <View style={styles.workInfoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <Text style={styles.infoText}>{todayShift.time}</Text>
          </View>
          {todayShift.status !== 'OFF' && (
            <View style={styles.workInfoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{todayShift.storeName}</Text>
            </View>
          )}
          {todayShift.checkInTime && (
            <View style={styles.workInfoRow}>
              <Text style={styles.infoIcon}>▶️</Text>
              <Text style={styles.infoText}>{t('checkIn')}: {todayShift.checkInTime}</Text>
            </View>
          )}
          {todayShift.checkOutTime && (
            <View style={styles.workInfoRow}>
              <Text style={styles.infoIcon}>⏹️</Text>
              <Text style={styles.infoText}>{t('checkOut')}: {todayShift.checkOutTime}</Text>
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
          <Text style={styles.emptyIcon}>🏖️</Text>
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
    fontSize: 16,
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
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.subText, fontWeight: '500' },
  skeleton: {
    backgroundColor: colors.gray,
    borderRadius: 6,
  },
});

export default TodayShiftCard;