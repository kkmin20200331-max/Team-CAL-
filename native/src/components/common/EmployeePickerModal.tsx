import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type User = {
  id: string;
  name: string;
};

type Props = {
  isVisible: boolean;
  employees: User[];
  onClose: () => void;
  onSelect: (employee: User) => void;
};

const EmployeePickerModal = ({ isVisible, employees, onClose, onSelect }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const handleSelect = (employee: User) => {
    onSelect(employee);
    onClose();
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>직원 선택</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>닫기</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={employees}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      </SafeAreaView>
    </Modal>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: colors.primary,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: {
    fontSize: 18,
    color: colors.text,
  },
});

export default EmployeePickerModal;