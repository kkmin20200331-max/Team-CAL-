import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../../contexts/LanguageContext';

const SubstituteManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  const { shifts, employees, setShifts } = useSchedule();

  const substituteRequests = useMemo(() => 
    shifts.filter(s => s.status === 'SUBSTITUTE_REQ' || s.status === 'LEAVE_REQ'),
    [shifts]
  );

  const handleApprove = (shiftId: string) => {
    Alert.alert(t('approveRequestTitle'), t('approveRequestMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('approve'), onPress: () => {
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status: 'OFF' } : s));
        Toast.show({ type: 'success', text1: t('approvalComplete') });
      }}
    ]);
  };

  const handleDeny = (shiftId: string) => {
    Alert.alert(t('denyRequestTitle'), t('denyRequestMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deny'), style: 'destructive', onPress: () => {
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, status: 'SCHEDULED' } : s));
        Toast.show({ type: 'info', text1: t('denialComplete') });
      }}
    ]);
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const user = employees.find(e => e.id === item.userId);
    const isLeave = item.status === 'LEAVE_REQ';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.badge, isLeave ? styles.leaveBadge : styles.subBadge]}>
            {isLeave ? t('leave') : t('substitute')}
          </Text>
          <Text style={styles.dateText}>{format(new Date(item.date), 'M월 d일 (eee)', { locale: ko })}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('employee')}</Text>
            <Text style={styles.infoValue}>{user?.name || t('unknown')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('workTime')}</Text>
            <Text style={styles.infoValue}>{item.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('reason')}</Text>
            <Text style={styles.infoValue}>{item.reason}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.denyButton]} onPress={() => handleDeny(item.id)}>
            <Text style={styles.denyButtonText}>{t('deny')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApprove(item.id)}>
            <Text style={styles.approveButtonText}>{t('approve')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('requestManagement')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={substituteRequests}
        renderItem={renderRequestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noRequests')}</Text>}
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.gray },
  badge: { fontSize: 12, fontWeight: 'bold', color: colors.white, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  leaveBadge: { backgroundColor: colors.orange },
  subBadge: { backgroundColor: colors.purple },
  dateText: { fontSize: 14, color: colors.subText },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 15, color: colors.subText },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row' },
  button: { flex: 1, padding: 16, alignItems: 'center' },
  denyButton: { backgroundColor: colors.redLight },
  denyButtonText: { color: colors.red, fontWeight: 'bold' },
  approveButton: { backgroundColor: colors.greenLight },
  approveButtonText: { color: colors.green, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
});

export default SubstituteManagementScreen;