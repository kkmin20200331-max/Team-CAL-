import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { updateStoreAPI } from '../../../api/auth'; // API 함수 변경

const STORE_CATEGORIES = ["카페", "음식점", "패스트푸드", "의류/잡화", "서비스", "기타"];

const parseTime = (timeStr: string, date = new Date()): Date => {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return date;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes);
  return newDate;
};

export default function StoreEditScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo, login } = useApp();

  const activeBranch = useMemo(() => 
    userInfo?.branches?.find(b => b.id === userInfo.activeBranchId),
  [userInfo]);

  const [inputs, setInputs] = useState({
    brandName: activeBranch?.brandName || "",
    branchName: activeBranch?.branchName || "",
    address: activeBranch?.address || "",
    openTime: parseTime(activeBranch?.openTime || '09:00'),
    closeTime: parseTime(activeBranch?.closeTime || '22:00'),
    capacity: activeBranch?.capacity?.toString() || "",
  });
  const [storeCategory, setStoreCategory] = useState(activeBranch?.storeCategory || STORE_CATEGORIES[0]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'openTime' | 'closeTime'>('openTime');

  const handleInputChange = (name: string, value: any) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const showTimepicker = (target: 'openTime' | 'closeTime') => {
    setPickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (selectedDate: Date) => {
    handleInputChange(pickerTarget, selectedDate);
    setTimePickerVisible(false);
  };

  const handleSave = async () => {
    if (!activeBranch) {
      Alert.alert("오류", "수정할 매장 정보를 찾을 수 없습니다.");
      return;
    }

    const storeData = {
      id: activeBranch.id,
      name: `${inputs.brandName} ${inputs.branchName}`,
      type: storeCategory,
      address: inputs.address,
      capacity: parseInt(inputs.capacity, 10) || 0,
      open_time: formatTime(inputs.openTime),
      close_time: formatTime(inputs.closeTime),
    };

    try {
      await updateStoreAPI(storeData);

      // TODO: AppContext의 branches 상태 업데이트 로직 개선 필요
      // const updatedBranches = userInfo?.branches?.map(b =>
      //   b.id === activeBranch.id ? { ...b, ...storeData } : b
      // );
      // login({ ...userInfo, branches: updatedBranches }, true);

      Toast.show({
        type: 'success',
        text1: '저장 완료',
        text2: '매장 정보가 성공적으로 수정되었습니다.',
      });
      navigation.goBack();
    } catch (error) {
      console.error("Store info update error:", error);
      Alert.alert("오류", "매장 정보 수정 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매장 정보 수정</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.inputLabel}>업종 카테고리</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
            <Text style={styles.pickerButtonText}>{storeCategory}</Text>
            <Text style={styles.pickerButtonIcon}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>브랜드명</Text>
          <TextInput style={styles.input} placeholder="예: 컴포즈커피" value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} />
          
          <Text style={styles.inputLabel}>지점명</Text>
          <TextInput style={styles.input} placeholder="예: 미금점" value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} />

          <Text style={styles.inputLabel}>주소</Text>
          <TextInput style={styles.input} placeholder="매장 주소를 입력하세요" value={inputs.address} onChangeText={(text) => handleInputChange('address', text)} />
          
          <View style={styles.timeContainer}>
            <View style={styles.timeInputWrapper}>
              <Text style={styles.inputLabel}>오픈 시간</Text>
              <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('openTime')}>
                <Text style={styles.timeText}>{formatTime(inputs.openTime)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeInputWrapper}>
              <Text style={styles.inputLabel}>마감 시간</Text>
              <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('closeTime')}>
                <Text style={styles.timeText}>{formatTime(inputs.closeTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.inputLabel}>최대 수용 인원 (선택)</Text>
          <TextInput style={styles.input} placeholder="숫자만 입력" value={inputs.capacity} onChangeText={(text) => handleInputChange('capacity', text)} keyboardType="number-pad" />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>저장하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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

      {isTimePickerVisible && (
        <TimePickerModal
          isVisible={isTimePickerVisible}
          initialDate={pickerTarget === 'openTime' ? inputs.openTime : inputs.closeTime}
          onClose={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
        />
      )}
    </SafeAreaView>
  );
}

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
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  formContainer: { padding: 20, paddingBottom: 40 },
  input: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: colors.card, color: colors.text, fontSize: 16 },
  inputLabel: { fontSize: 16, color: colors.subText, marginBottom: 8 },
  button: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 16 },
  timeInputWrapper: { flex: 1 },
  timeButton: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, backgroundColor: colors.card, alignItems: 'center' },
  timeText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  pickerButton: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerButtonText: { fontSize: 16, color: colors.text },
  pickerButtonIcon: { fontSize: 16, color: colors.subText },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.text },
  modalOption: { paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalOptionSelected: { backgroundColor: colors.primaryLight },
  modalOptionText: { fontSize: 16, color: colors.text },
  modalOptionTextSelected: { color: colors.primary, fontWeight: 'bold' },
});
