import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import EmployeePickerModal from '../../components/common/EmployeePickerModal';
import TimePickerModal from '../../components/common/TimePickerModal';

type User = {
  id: string;
  name: string;
};

type ShiftData = {
  userId: string;
  time: string;
  user: User;
} | null;

type Props = {
  navigation: any;
  route: {
    params: {
      shiftData: ShiftData;
      employees: User[];
      date: string;
      onSave: (shift: any) => void;
      onDelete: (shift: any) => void;
    };
  };
};

const ShiftEditorScreen = ({ navigation, route }: Props) => {
  const { shiftData, employees, date, onSave, onDelete } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [isEmployeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');

  useEffect(() => {
    const now = new Date(date);
    if (shiftData) {
      setSelectedUser(employees.find(e => e.id === shiftData.userId) || null);
      const [startStr, endStr] = shiftData.time.split('-');
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      now.setHours(startH, startM, 0, 0);
      setStartTime(new Date(now));
      now.setHours(endH, endM, 0, 0);
      setEndTime(new Date(now));
    } else {
      setSelectedUser(employees[0] || null);
      now.setHours(9, 0, 0, 0);
      setStartTime(new Date(now));
      now.setHours(17, 0, 0, 0);
      setEndTime(new Date(now));
    }
  }, [shiftData, employees, date]);

  const formatTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

  const handleSave = () => {
    if (!selectedUser) {
      Alert.alert("오류", "직원을 선택해주세요.");
      return;
    }
    if (startTime >= endTime) {
      Alert.alert("시간 오류", "시작 시간은 종료 시간보다 빨라야 합니다.");
      return;
    }
    const newShift = {
      userId: selectedUser.id,
      time: `${formatTime(startTime)}-${formatTime(endTime)}`,
      original: shiftData 
    };
    onSave(newShift);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (shiftData) {
      Alert.alert("근무 삭제", "정말로 이 근무를 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => {
            onDelete(shiftData);
            navigation.goBack();
          }
        }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shiftData ? '근무 수정' : '근무 추가'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>직원 선택</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setEmployeePickerVisible(true)}>
          <Text style={styles.pickerButtonText}>{selectedUser ? selectedUser.name : '직원을 선택하세요'}</Text>
          <Text style={styles.pickerButtonIcon}>▼</Text>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Text style={styles.label}>시작 시간</Text>
            <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('start')}>
              <Text style={styles.timeText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeInput}>
            <Text style={styles.label}>종료 시간</Text>
            <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('end')}>
              <Text style={styles.timeText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        {shiftData && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <EmployeePickerModal
        isVisible={isEmployeePickerVisible}
        employees={employees}
        onClose={() => setEmployeePickerVisible(false)}
        onSelect={(employee) => setSelectedUser(employee)}
      />

      {isTimePickerVisible && (
        <TimePickerModal
          isVisible={isTimePickerVisible}
          initialDate={pickerTarget === 'start' ? startTime : endTime}
          onClose={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  formContainer: { padding: 20 },
  label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    backgroundColor: colors.card,
  },
  pickerButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  pickerButtonIcon: {
    fontSize: 14,
    color: colors.subText,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  timeInput: { width: '48%' },
  timeButton: { borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 8, alignItems: 'center', backgroundColor: colors.card },
  timeText: { fontSize: 20, color: colors.text, fontWeight: '600' },
  saveButton: { 
    backgroundColor: '#34D399', // ★★★ 수정된 부분 ★★★
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: colors.notification, padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default ShiftEditorScreen;