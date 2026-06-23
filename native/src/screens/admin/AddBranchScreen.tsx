import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { createStoreAPI, getStoresAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

const STORE_CATEGORIES = ['카페', '음식점', '편의점', '의류/잡화', '서비스', '기타'];

const AddBranchScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo, login } = useApp();

  const [brandName, setBrandName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [storeCategory, setStoreCategory] = useState(STORE_CATEGORIES[0]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userInfo?.id) {
      Alert.alert('오류', '로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    if (!brandName.trim() || !branchName.trim()) {
      Alert.alert('입력 오류', '브랜드명과 지점명을 모두 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const storeId = `S_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

      await createStoreAPI({
        id: storeId,
        name: brandName.trim(),
        type: storeCategory,
        address: branchName.trim(),
        capacity: 0,
        owner_user_id: userInfo.id,
      });

      const storesResponse = await getStoresAPI(userInfo.id);
      const stores = Array.isArray(storesResponse.data) ? storesResponse.data : [];
      const branches = stores.map((store: any) => ({
        id: store.id,
        brandName: store.name || '매장',
        branchName: store.address || store.id,
      }));

      login(
        {
          ...userInfo,
          branches,
          activeBranchId: storeId,
          store_id: storeId,
        } as any,
        branches.length > 0,
      );

      Toast.show({
        type: 'success',
        text1: '지점 등록 완료',
        text2: `${brandName.trim()} ${branchName.trim()} 지점이 등록되었습니다.`,
      });

      navigation.goBack();
    } catch (error) {
      console.error('지점 등록 오류:', error);
      Alert.alert('저장 실패', '지점 등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지점 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>브랜드명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 시프트 커피"
          value={brandName}
          onChangeText={setBrandName}
        />

        <Text style={styles.label}>지점명 또는 주소</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 강남점"
          value={branchName}
          onChangeText={setBranchName}
        />

        <Text style={styles.label}>업종 카테고리</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.pickerButtonText}>{storeCategory}</Text>
          <Text style={styles.pickerButtonIcon}>⌄</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#064E3B" /> : <Text style={styles.saveButtonText}>저장</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
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
                <Text style={[styles.modalOptionText, storeCategory === cat && styles.modalOptionTextSelected]}>
                  {cat}
                </Text>
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
    borderBottomColor: colors.primaryLight,
    backgroundColor: colors.card,
  },
  backButton: { fontSize: 28, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: colors.card,
    fontSize: 18,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.primaryLight,
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
    fontSize: 18,
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
