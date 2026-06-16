import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { format, addDays, startOfMonth, getDay, getDaysInMonth, getMonth, getYear, setMonth } from 'date-fns';

const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
};

const DatePickerModal = ({ isVisible, onClose, onConfirm, initialDate }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const [date, setDate] = useState(initialDate || new Date());

  const changeMonth = (offset: number) => {
    setDate(prev => setMonth(prev, getMonth(prev) + offset));
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(date);
    const firstDayOfMonth = getDay(monthStart);
    const daysInMonth = getDaysInMonth(date);
    const grid = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(getYear(date), getMonth(date), day);
      grid.push(
        <TouchableOpacity key={day} style={styles.dayCell} onPress={() => onConfirm(currentDate)}>
          <Text style={styles.dayNumber}>{day}</Text>
        </TouchableOpacity>
      );
    }
    return grid;
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarModalContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={styles.calendarNav}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{`${getYear(date)}년 ${getMonth(date) + 1}월`}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={styles.calendarNav}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {KOREAN_DAYS.map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}
          </View>
          <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: '90%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  calendarNav: {
    fontSize: 20,
    color: colors.primary,
    padding: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 10,
    marginBottom: 5,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: colors.subText,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 15,
    color: colors.text,
  },
});

export default DatePickerModal;