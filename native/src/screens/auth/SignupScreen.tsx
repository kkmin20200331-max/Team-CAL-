import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI } from '../../../api/auth';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

type SignupScreenNavigationProp = StackNavigationProp<any, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
  route: { params: { role: 'STAFF' | 'ADMIN' } };
};

const STORE_CATEGORIES = ["카페", "음식점", "패스트푸드", "의류/잡화", "서비스", "기타"];

export default function SignupScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { login } = useApp();

  const [inputs, setInputs] = useState({
    id: "",
    password: "",
    passwordCheck: "",
    name: "",
    phone: "",
    isFranchise: true,
    brandName: "",
    branchName: "",
    openTime: new Date(),
    closeTime: new Date(),
    maxCapacity: "",
  });
  const [storeCategory, setStoreCategory] = useState(STORE_CATEGORIES[0]);
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

  const handleSignup = async () => {
    const { id, password, passwordCheck, name, phone, isFranchise, brandName, branchName, openTime, closeTime, maxCapacity } = inputs;

    if (!id || !password || !passwordCheck || !name || !phone) {
      Alert.alert("입력 오류", "모든 필수 항목을 입력해주세요.");
      return;
    }
    if (role === 'ADMIN' && (!brandName || !branchName)) {
      Alert.alert("입력 오류", "브랜드명과 지점명을 모두 입력해주세요.");
      return;
    }
    if (password !== passwordCheck) {
      Alert.alert("비밀번호 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.signUp({
        email: id,
        password: password,
        options: {
          data: {
            full_name: name,
            phone: phone,
            role: role,
          }
        }
      });

      if (supabaseError) throw new Error(`Supabase 회원가입 실패: ${supabaseError.message}`);
      if (!supabaseUser) throw new Error("Supabase 사용자가 생성되지 않았습니다.");

      // ✅ [수정] 역할에 따라 status를 다르게 설정
      const signupData: any = {
        id: supabaseUser.id,
        username: id,
        password,
        name,
        phone,
        role,
        status: role === 'ADMIN' ? 'ACTIVE' : 'PENDING', // 관리자는 즉시 활성, 직원은 승인 대기
      };

      if (role === 'ADMIN') {
        signupData.isFranchise = isFranchise;
        signupData.brandName = brandName;
        signupData.branchName = branchName;
        signupData.openTime = formatTime(openTime);
        signupData.closeTime = formatTime(closeTime);
        signupData.maxCapacity = parseInt(maxCapacity, 10) || 0;
        signupData.storeCategory = storeCategory;
      }
      
      await signupAPI(signupData);

      Toast.show({
        type: 'success',
        text1: '가입 성공',
        text2: `${name}님 환영합니다!`,
      });

      const userInfoForLogin = { ...signupData, id: supabaseUser.id };
      if (role === 'ADMIN') {
        const branches = [{ id: 'branch_1', brandName, branchName }];
        await AsyncStorage.setItem(`admin_branch_info_${id}`, JSON.stringify(branches));
        login({ ...userInfoForLogin, branches, activeBranchId: 'branch_1' }, true);
      } else {
        // 직원은 가입 후, 지점 선택을 하지 않은 상태로 로그인
        login(userInfoForLogin, false);
      }

    } catch (error) {
      console.error('회원가입 에러:', error);
      if (error instanceof Error) {
        Alert.alert("가입 실패", error.message);
      } else if (axios.isAxiosError(error) && error.response) {
        Alert.alert("가입 실패", `서버 오류: ${error.response.status}`);
      } else {
        Alert.alert("가입 실패", "알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === 'ADMIN' ? '관리자 회원가입' : '직원 회원가입'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <TextInput style={styles.input} placeholder="아이디 (이메일 형식)" value={inputs.id} onChangeText={(text) => handleInputChange('id', text)} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="비밀번호" value={inputs.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="비밀번호 확인" value={inputs.passwordCheck} onChangeText={(text) => handleInputChange('passwordCheck', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="이름 (예: 김선민)" value={inputs.name} onChangeText={(text) => handleInputChange('name', text)} />
          <TextInput style={styles.input} placeholder="전화번호 (예: 010-1234-5678)" value={inputs.phone} onChangeText={(text) => handleInputChange('phone', text)} keyboardType="phone-pad" />

          {role === 'ADMIN' && (
            <>
              <Text style={styles.sectionTitle}>매장 정보</Text>
              
              <Text style={styles.inputLabel}>업종 카테고리</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
                <Text style={styles.pickerButtonText}>{storeCategory}</Text>
                <Text style={styles.pickerButtonIcon}>▼</Text>
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <Text style={styles.inputLabel}>프랜차이즈 매장인가요?</Text>
                <Switch
                  trackColor={{ false: "#767577", true: colors.primary }}
                  thumbColor={inputs.isFranchise ? "#f4f3f4" : "#f4f3f4"}
                  onValueChange={(value) => handleInputChange('isFranchise', value)}
                  value={inputs.isFranchise}
                />
              </View>
              <TextInput style={styles.input} placeholder="브랜드명 (예: 컴포즈커피)" value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} />
              <TextInput style={styles.input} placeholder="지점명 (예: 미금점)" value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} />
              
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
              <TextInput style={styles.input} placeholder="숫자만 입력" value={inputs.maxCapacity} onChangeText={(text) => handleInputChange('maxCapacity', text)} keyboardType="number-pad" />
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>가입 완료</Text>
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
  keyboardAvoidingContainer: {
    flex: 1,
  },
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
  formContainer: { 
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: colors.card, color: colors.text, fontSize: 16 },
  inputLabel: { fontSize: 16, color: colors.subText, marginBottom: 8 },
  button: { 
    backgroundColor: '#6EE7B7',
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },
  buttonText: { 
    color: '#064E3B',
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeInputWrapper: {
    width: '48%',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  timeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
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