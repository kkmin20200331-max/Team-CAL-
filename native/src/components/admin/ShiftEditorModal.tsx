import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import TimePickerModal from '../common/TimePickerModal';

type User = {
  id: string;
  name: string;
};

type ShiftData = {
  userId: string;
  time: string;
} | null;

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSave: (shift: { userId: string; time: string }) => void;
  onDelete: (shift: { userId: string; time: string }) => void;
  shiftData: ShiftData;
  employees: User[];
};

const ShiftEditorModal = ({ isVisible, onClose, onSave, onDelete, shiftData, employees }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [selectedUser, setSelectedUser] = useState(employees[0]?.id || '');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (isVisible) {
      const now = new Date();
      if (shiftData) {
        setSelectedUser(shiftData.userId);
        const [startStr, endStr] = shiftData.time.split('-');
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);
        now.setHours(startH, startM, 0, 0);
        setStartTime(new Date(now));
        now.setHours(endH, endM, 0, 0);
        setEndTime(new Date(now));
      } else {
        setSelectedUser(employees[0]?.id || '');
        now.setHours(9, 0, 0, 0);
        setStartTime(new Date(now));
        now.setHours(17, 0, 0, 0);
        setEndTime(new Date(now));
      }
    }
  }, [isVisible, shiftData, employees]);

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
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
    if (startTime >= endTime) {
      Alert.alert("시간 오류", "시작 시간은 종료 시간보다 빨라야 합니다.");
      return;
    }
    onSave({ userId: selectedUser, time: `${formatTime(startTime)}-${formatTime(endTime)}` });
  };

  const handleDelete = () => {
    if (shiftData) {
      Alert.alert("근무 삭제", "정말로 이 근무를 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => onDelete(shiftData as any) }
      ]);
    }
  };

  return (
    <>
      <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{shiftData ? '근무 수정' : '근무 추가'}</Text>

            <Text style={styles.label}>직원 선택</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedUser} onValueChange={(itemValue) => setSelectedUser(itemValue)} style={styles.picker} itemStyle={styles.pickerItem}>
                {employees.map(user => (
                  <Picker.Item key={user.id} label={user.name} value={user.id} />
                ))}
              </Picker>
            </View>

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
              <Text style={styles.saveButtonText}>확인</Text>
            </TouchableOpacity>

            {shiftData && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isTimePickerVisible && (
        <TimePickerModal
          isVisible={isTimePickerVisible}
          initialDate={pickerTarget === 'start' ? startTime : endTime}
          onClose={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
        />
      )}
    </>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: colors.card, borderRadius: 16, padding: 24 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 24 },
    label: { fontSize: 16, color: colors.subText, marginBottom: 8 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 16 },
    picker: { color: colors.text, height: Platform.OS === 'ios' ? 120 : 60 },
    pickerItem: { color: colors.text, fontSize: 18 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    timeInput: { width: '48%' },
    timeButton: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, alignItems: 'center' },
    timeText: { fontSize: 18, color: colors.text, fontWeight: '600' },
    saveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    deleteButton: { backgroundColor: colors.notification, padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    closeButton: { padding: 10, alignItems: 'center' },
    closeButtonText: { fontSize: 16, color: colors.subText },
});

export default ShiftEditorModal;