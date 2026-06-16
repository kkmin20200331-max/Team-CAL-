import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  isVisible: boolean;
  initialDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

const TimePickerModal = ({ isVisible, initialDate, onClose, onConfirm }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const [tempDate, setTempDate] = useState(initialDate);

  useEffect(() => {
    if (isVisible) {
      setTempDate(initialDate);
    }
  }, [isVisible, initialDate]);

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        onConfirm(selectedDate);
      }
      onClose();
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirmIOS = () => {
    onConfirm(tempDate);
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <Text style={styles.modalTitle}>시간 선택</Text>
          <DateTimePicker
            value={tempDate}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={handleTimeChange}
            textColor={colors.text}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirmIOS}>
                <Text style={[styles.buttonText, styles.confirmButtonText]}>확인</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: colors.card, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  button: { paddingHorizontal: 16, paddingVertical: 8 },
  confirmButton: { marginLeft: 8 },
  buttonText: { fontSize: 16, color: colors.subText },
  confirmButtonText: { color: colors.primary, fontWeight: 'bold' },
});

export default TimePickerModal;