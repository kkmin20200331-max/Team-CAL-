import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { Shift } from '../../types/Schedule';
import { format, addDays, startOfWeek, getDay, getDaysInMonth, getMonth, getYear, setMonth, startOfMonth, lastDayOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getShiftListAPI, getMyShiftListAPI, requestLeaveAPI, createSubstitutePostAPI } from '../../../api/auth';
import { useFocusEffect } from '@react-navigation/native';

const today = new Date();
const formatDate = (d: Date, formatStr = 'yyyy-MM-dd') => format(d, formatStr, { locale: ko });

const ScheduleScreen = ({ navigation }: { navigation: any }) => {
  const { userInfo } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Modal State ---
  const [isReqModalVisible, setReqModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'LEAVE' | 'SUBSTITUTE'>('LEAVE');
  const [reason, setReason] = useState('');
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const fetchShifts = async (date: Date) => {
    if (!userInfo || !userInfo.id || (userInfo.role === 'ADMIN' && !userInfo.store_id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const startDate = formatDate(startOfMonth(date));
    const endDate = formatDate(lastDayOfMonth(date));
    try {
      const response = userInfo.role === 'ADMIN'
        ? await getShiftListAPI(userInfo.store_id, startDate, endDate)
        : await getMyShiftListAPI(userInfo.id, startDate, endDate);
      setShifts(response.data);
    } catch (error) {
      console.error("스케줄 조회 오류:", error);
      Toast.show({ type: 'error', text1: '오류', text2: '스케줄을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      fetchShifts(currentMonth);
    }, [userInfo, currentMonth])
  );

  const dailyShifts = useMemo(() => 
    shifts.filter(shift => formatDate(new Date(shift.start_time)) === selectedDate)
  , [shifts, selectedDate]);

  const handleOpenModal = (item: any, type: 'LEAVE' | 'SUBSTITUTE') => {
    setSelectedShift(item);
    setModalType(type);
    setReason('');
    setReqModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim() || !selectedShift || !userInfo?.id) {
      Alert.alert("오류", "신청 사유를 입력해주세요.");
      return;
    }

    try {
      if (modalType === 'LEAVE') {
        await requestLeaveAPI({
          shift_id: selectedShift.id,
          user_id: userInfo.id,
          reason: reason,
          status: 'PENDING',
        });
      } else { // modalType === 'SUBSTITUTE'
        await createSubstitutePostAPI({
          shift_id: selectedShift.id,
          requester_id: userInfo.id,
          reason: reason,
          status: 'OPEN', // 대타 모집글의 최초 상태는 '모집중'
        });
      }
      
      Toast.show({ type: 'success', text1: t('requestComplete'), text2: t('requestSentToAdmin') });
      setReqModalVisible(false);
      setSelectedShift(null);
      fetchShifts(currentMonth); // 목록 새로고침
    } catch (error) {
      console.error(`${modalType} 신청 오류:`, error);
      Alert.alert("오류", "신청 중 문제가 발생했습니다.");
    }
  };

  const renderShiftCard = ({ item }: { item: any }) => {
    const startTime = format(new Date(item.start_time), 'HH:mm');
    const endTime = format(new Date(item.end_time), 'HH:mm');

    const cardContent = (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
           <Text style={styles.cardDate}>{format(new Date(item.start_time), "M월 d일 (eee)")}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>🕒</Text><Text style={styles.infoText}>{`${startTime} - ${endTime}`}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoIcon}>👤</Text><Text style={styles.infoText}>{item.user_name || t('unassigned')}</Text></View>
        </View>
        {userInfo?.role === 'STAFF' && item.user_id === userInfo.id && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenModal(item, 'LEAVE')}><Text style={styles.actionButtonText}>{t('requestLeave')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.substituteButton]} onPress={() => handleOpenModal(item, 'SUBSTITUTE')}><Text style={styles.actionButtonText}>{t('requestSubstitute')}</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );

    if (userInfo?.role === 'ADMIN') {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('ShiftEditor', { isEdit: true, shift: item, onGoBack: () => fetchShifts(currentMonth) })}>
          {cardContent}
        </TouchableOpacity>
      );
    }
    return cardContent;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {userInfo?.role === 'ADMIN' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{width: 40}}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{format(currentMonth, "yyyy년 M월")}</Text>
        <View style={styles.headerButtons}>
          {userInfo?.role === 'ADMIN' && (
            <TouchableOpacity onPress={() => navigation.navigate('ShiftEditor', { isEdit: false, date: selectedDate, onGoBack: () => fetchShifts(currentMonth) })}>
              <Text style={styles.addButton}>{t('newShift')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
      ) : (
        <FlatList 
          data={dailyShifts} 
          renderItem={renderShiftCard} 
          keyExtractor={item => item.id.toString()} 
          contentContainerStyle={styles.listContainer} 
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyIcon}>🏖️</Text><Text style={styles.emptyText}>{t('noSchedule')}</Text></View>} 
        />
      )}

      <Modal animationType="fade" transparent={true} visible={isReqModalVisible} onRequestClose={() => setReqModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'LEAVE' ? t('requestLeave') : t('requestSubstitute')}</Text>
            {selectedShift && <Text style={styles.modalSubtitle}>{format(new Date(selectedShift.start_time), "M월 d일 (eee)")} {format(new Date(selectedShift.start_time), 'HH:mm')} - {format(new Date(selectedShift.end_time), 'HH:mm')}</Text>}
            <TextInput style={styles.reasonInput} placeholder={modalType === 'LEAVE' ? t('leaveReasonPlaceholder') : t('substituteReasonPlaceholder')} placeholderTextColor={colors.subText} value={reason} onChangeText={setReason} multiline={true} textAlignVertical="top" />
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setReqModalVisible(false)}><Text style={styles.modalCancelText}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSubmitRequest}><Text style={styles.modalSubmitText}>{t('applyBtn')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 16, width: 80, justifyContent: 'flex-end' },
  addButton: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  listContainer: { padding: 16, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardDate: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { fontSize: 16, marginRight: 8, color: colors.subText },
  infoText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  actionButton: { flex: 1, backgroundColor: colors.gray, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  substituteButton: { backgroundColor: colors.purpleLight },
  actionButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16, opacity: 0.5 },
  emptyText: { fontSize: 16, color: colors.subText, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: colors.card, borderRadius: 16, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: colors.subText, marginBottom: 20, textAlign: 'center' },
  reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, height: 100, fontSize: 15, color: colors.text, backgroundColor: colors.background, marginBottom: 20 },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, backgroundColor: colors.gray, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modalSubmitButton: { flex: 1, backgroundColor: colors.blue, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});

export default ScheduleScreen;
