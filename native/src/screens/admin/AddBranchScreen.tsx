import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';

const STORE_CATEGORIES = ["카페", "음식점", "패스트푸드", "의류/잡화", "서비스", "기타"];

const AddBranchScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo, login } = useApp();

  const [brandName, setBrandName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [storeCategory, setStoreCategory] = useState(STORE_CATEGORIES[0]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const handleSave = () => {
    if (!brandName.trim() || !branchName.trim()) {
      Alert.alert("입력 오류", "브랜드명과 지점명을 모두 입력해주세요.");
      return;
    }

    const newBranch = {
      id: `branch_${Date.now()}`,
      brandName,
      branchName,
      storeCategory,
    };

    if (userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        branches: [...(userInfo.branches || []), newBranch],
      };
      login(updatedUserInfo, true);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 지점 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>브랜드명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 컴포즈커피"
          value={brandName}
          onChangeText={setBrandName}
        />

        <Text style={styles.label}>지점명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 서현점"
          value={branchName}
          onChangeText={setBranchName}
        />

        <Text style={styles.label}>업종 카테고리</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.pickerButtonText}>{storeCategory}</Text>
          <Text style={styles.pickerButtonIcon}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>업종 선택</Text>
            {STORE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.modalOption, storeCategory === cat && styles.modalOptionSelected]}
                onPress={() => {
                  setStoreCategory(cat);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, storeCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  content: { padding: 20 },
  label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: colors.card,
    fontSize: 18,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: '#6EE7B7', // 에메랄드 색상
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#000000', // 검은색
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  pickerButtonIcon: {
    fontSize: 16,
    color: colors.subText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text,
  },
  modalOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default AddBranchScreen;