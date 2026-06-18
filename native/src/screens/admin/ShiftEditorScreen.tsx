import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import TimePickerModal from '../../components/common/TimePickerModal';
import DatePickerModal from '../../components/common/DatePickerModal';
import { useLanguage } from '../../contexts/LanguageContext';

const ShiftEditorScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isEdit, shift: shiftToEdit } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);
  const { employees, addShift, updateShift, deleteShift } = useSchedule();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    if (isEdit && shiftToEdit) {
      setUserId(shiftToEdit.userId);
      setDate(new Date(shiftToEdit.date));
      if (shiftToEdit.time && shiftToEdit.time.includes(' - ')) {
        const [startStr, endStr] = shiftToEdit.time.split(' - ');
        const [startH, startM] = startStr.split(':');
        const [endH, endM] = endStr.split(':');
        const newStart = new Date();
        newStart.setHours(parseInt(startH), parseInt(startM));
        setStartTime(newStart);
        const newEnd = new Date();
        newEnd.setHours(parseInt(endH), parseInt(endM));
        setEndTime(newEnd);
      }
    }
  }, [isEdit, shiftToEdit]);

  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const handleSave = () => {
    if (!userId) {
      Alert.alert(t('error'), t('selectEmployee'));
      return;
    }

    const shiftData = {
      userId,
      date: format(date, 'yyyy-MM-dd'),
      time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      status: 'CONFIRMED',
      reason: '',
    };

    if (isEdit) {
      updateShift({ ...shiftToEdit, ...shiftData });
      Toast.show({ type: 'success', text1: t('editShiftSuccess') });
    } else {
      addShift(shiftData);
      Toast.show({ type: 'success', text1: t('addShiftSuccess') });
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmMsg'), [
      { text: t('cancel'), style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => {
        deleteShift(shiftToEdit.id);
        Toast.show({ type: 'info', text1: t('deleteShiftSuccess') });
        navigation.goBack();
      }}
    ]);
  };

  const showTimepicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (selectedDate: Date) => {
    if (pickerTarget === 'start') {
      setStartTime(selectedDate);
    } else {
      setEndTime(selectedDate);
    }
    setTimePickerVisible(false);
  };
  
  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate);
    setDatePickerVisible(false);
  };

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
            {employees.filter(e => e.status === 'ACTIVE').map(e => (
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
              <Text style={styles.dateButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('endTime')}</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showTimepicker('end')}>
              <Text style={styles.dateButtonText}>{formatTime(endTime)}</Text>
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

      <DatePickerModal
        isVisible={isDatePickerVisible}
        initialDate={date}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={handleDateConfirm}
      />

      <TimePickerModal
        isVisible={isTimePickerVisible}
        initialDate={pickerTarget === 'start' ? startTime : endTime}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={handleTimeConfirm}
      />
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
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card },
    picker: Platform.OS === 'ios' ? {} : { color: colors.text },
    pickerItem: Platform.OS === 'ios' ? { color: colors.text } : {},
    dateButton: { borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card, alignItems: 'center' },
    dateButtonText: { fontSize: 18, color: colors.text },
    timeContainer: { flexDirection: 'row', gap: 16 },
    saveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
    deleteButton: { backgroundColor: colors.red, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    deleteButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});

export default ShiftEditorScreen;