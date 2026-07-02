import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import TimePickerModal from '../../components/common/TimePickerModal';
import DatePickerModal from '../../components/common/DatePickerModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { getStaffListAPI, registerShiftAPI, updateShiftAPI, deleteShiftAPI } from '../../../api/auth';

const ShiftEditorScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isEdit, shift: shiftToEdit, date: initialDate, onGoBack } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { userInfo } = useApp();
  const styles = getThemedStyles(colors);

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date(initialDate || new Date()));
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    const fetchActiveEmployees = async () => {
      if (!userInfo?.store_id) return;
      try {
        const res = await getStaffListAPI(userInfo.store_id);
        setEmployees(res.data);
      } catch (error) {
        console.error("활동중인 직원 목록 조회 실패:", error);
        Alert.alert(t('error'), "직원 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEmployees();

    if (isEdit && shiftToEdit) {
      setUserId(shiftToEdit.user_id);
      const shiftDate = new Date(shiftToEdit.start_time);
      setDate(shiftDate);
      setStartTime(shiftDate);
      setEndTime(new Date(shiftToEdit.end_time));
    } else {
      const defaultStart = new Date();
      defaultStart.setHours(9, 0, 0, 0);
      setStartTime(defaultStart);
      const defaultEnd = new Date();
      defaultEnd.setHours(18, 0, 0, 0);
      setEndTime(defaultEnd);
    }
  }, [isEdit, shiftToEdit, userInfo]);

  const combineDateAndTime = (datePart: Date, timePart: Date) => {
    const newDate = new Date(datePart);
    newDate.setHours(timePart.getHours());
    newDate.setMinutes(timePart.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert(t('error'), t('selectEmployee'));
      return;
    }
    if (!userInfo?.store_id) {
      Alert.alert(t('error'), "매장 정보가 없습니다.");
      return;
    }

    const finalStartTime = combineDateAndTime(date, startTime);
    const finalEndTime = combineDateAndTime(date, endTime);

    if (finalEndTime <= finalStartTime) {
      Alert.alert(t('error'), "마감 시간은 시작 시간보다 이후여야 합니다.");
      return;
    }

    const shiftData = {
      id: isEdit ? shiftToEdit.id : undefined,
      store_id: userInfo.store_id,
      user_id: userId,
      work_date: format(date, 'yyyy-MM-dd'),
      start_at: format(finalStartTime, 'yyyy-MM-dd HH:mm:ss'),
      end_at: format(finalEndTime, 'yyyy-MM-dd HH:mm:ss'),
      status: isEdit ? shiftToEdit.status : 'SCHEDULED',
    };

    try {
      if (isEdit) {
        await updateShiftAPI(shiftData);
        Toast.show({ type: 'success', text1: t('editShiftSuccess') });
      } else {
        await registerShiftAPI(shiftData);
        Toast.show({ type: 'success', text1: t('addShiftSuccess') });
      }
      if (onGoBack) onGoBack();
      navigation.goBack();
    } catch (error) {
      console.error("스케줄 저장 실패:", error);
      Alert.alert(t('error'), "스케줄 저장에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmMsg'), [
      { text: t('cancel'), style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
        try {
          await deleteShiftAPI(shiftToEdit.id);
          Toast.show({ type: 'info', text1: t('deleteShiftSuccess') });
          if (onGoBack) onGoBack();
          navigation.goBack();
        } catch (error) {
          console.error("스케줄 삭제 실패:", error);
          Alert.alert(t('error'), "스케줄 삭제에 실패했습니다.");
        }
      }}
    ]);
  };

  const showTimepicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (selectedDate: Date) => {
    if (pickerTarget === 'start') setStartTime(selectedDate);
    else setEndTime(selectedDate);
    setTimePickerVisible(false);
  };
  
  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setDatePickerVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? t('editShift') : t('addShift')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t('selectEmployee')}</Text>
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={userId} 
            onValueChange={(itemValue) => setUserId(itemValue)} 
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={t('selectEmployeePlaceholder')} value={undefined} color={colors.subText} />
            {employees.map(e => (
              <Picker.Item key={e.id} label={e.name} value={e.id} color={colors.text} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>{t('date')}</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)}>
          <Text style={styles.dateButtonText}>{format(date, 'yyyy년 M월 d일')}</Text>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('startTime')}</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showTimepicker('start')}>
              <Text style={styles.dateButtonText}>{format(startTime, 'HH:mm')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('endTime')}</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showTimepicker('end')}>
              <Text style={styles.dateButtonText}>{format(endTime, 'HH:mm')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>{t('delete')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DatePickerModal isVisible={isDatePickerVisible} initialDate={date} onClose={() => setDatePickerVisible(false)} onConfirm={handleDateConfirm} />
      <TimePickerModal isVisible={isTimePickerVisible} initialDate={pickerTarget === 'start' ? startTime : endTime} onClose={() => setTimePickerVisible(false)} onConfirm={handleTimeConfirm} />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    backButton: { fontSize: 24, color: colors.text, width: 40 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    content: { padding: 20 },
    label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card, justifyContent: 'center' },
    picker: Platform.OS === 'ios' ? { height: 200 } : { color: colors.text },
    pickerItem: Platform.OS === 'ios' ? { color: colors.text } : {},
    dateButton: { borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card, alignItems: 'center' },
    dateButtonText: { fontSize: 18, color: colors.text, fontWeight: '600' },
    timeContainer: { flexDirection: 'row', gap: 16 },
    saveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    deleteButton: { backgroundColor: colors.red, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    deleteButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});

export default ShiftEditorScreen;
