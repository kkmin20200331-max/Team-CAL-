import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import TimePickerModal from '../../components/common/TimePickerModal';
import DatePickerModal from '../../components/common/DatePickerModal'; // 1. DatePickerModal 임포트

const ShiftEditorScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isEdit, shift: shiftToEdit } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees, addShift, updateShift, deleteShift } = useSchedule();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false); // 2. 날짜 모달 상태 추가

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
      Alert.alert("오류", "직원을 선택해주세요.");
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
      Toast.show({ type: 'success', text1: '근무 수정 완료' });
    } else {
      addShift(shiftData);
      Toast.show({ type: 'success', text1: '새 근무 추가 완료' });
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert("삭제 확인", "이 근무를 정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => {
        deleteShift(shiftToEdit.id);
        Toast.show({ type: 'info', text1: '근무 삭제 완료' });
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
  
  // 3. 날짜 선택 확인 함수 추가
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
        <Text style={styles.headerTitle}>{isEdit ? "근무 수정" : "새 근무 추가"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>직원 선택</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={userId} onValueChange={(itemValue) => setUserId(itemValue)} style={styles.picker}>
            <Picker.Item label="직원을 선택하세요..." value={undefined} />
            {employees.filter(e => e.status === 'ACTIVE').map(e => (
              <Picker.Item key={e.id} label={e.name} value={e.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)}>
          <Text style={styles.dateButtonText}>{format(date, 'yyyy년 M월 d일')}</Text>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>시작 시간</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showTimepicker('start')}>
              <Text style={styles.dateButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>종료 시간</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showTimepicker('end')}>
              <Text style={styles.dateButtonText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 4. DatePickerModal 및 TimePickerModal 렌더링 */}
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
    backButton: { fontSize: 24, color: colors.primary, width: 40 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    content: { padding: 20 },
    label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card },
    picker: { color: colors.text },
    dateButton: { borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8, marginBottom: 24, backgroundColor: colors.card, alignItems: 'center' },
    dateButtonText: { fontSize: 18, color: colors.text },
    timeContainer: { flexDirection: 'row', gap: 16 },
    saveButton: { backgroundColor: '#6EE7B7', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    saveButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
    deleteButton: { backgroundColor: '#EF4444', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default ShiftEditorScreen;