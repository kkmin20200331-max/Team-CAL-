import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Modal, Pressable, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI, registerStoreAPI } from '../../../api/auth';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';
<<<<<<< HEAD
import { format } from 'date-fns';
=======
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

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
    username: "",
    password: "",
    passwordCheck: "",
    name: "",
    phone: "",
    brandName: "",
    branchName: "",
    address: "",
    openTime: new Date(),
    closeTime: new Date(),
    capacity: "",
  });
  const [storeCategory, setStoreCategory] = useState(STORE_CATEGORIES[0]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'openTime' | 'closeTime'>('openTime');
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
=======
  const [isSubmitting, setIsSubmitting] = useState(false);
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

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
<<<<<<< HEAD
    const { username, password, passwordCheck, name, phone, brandName, branchName, address, openTime, closeTime, capacity } = inputs;
=======
    if (isSubmitting) return;

    const { id, password, passwordCheck, name, phone, isFranchise, brandName, branchName, openTime, closeTime, maxCapacity } = inputs;
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

    if (!username || !password || !passwordCheck || !name || !phone) {
      Alert.alert("입력 오류", "모든 필수 항목을 입력해주세요.");
      return;
    }
    if (role === 'ADMIN' && (!brandName || !branchName || !address)) {
      Alert.alert("입력 오류", "브랜드명, 지점명, 주소는 필수 항목입니다.");
      return;
    }
    if (password !== passwordCheck) {
      Alert.alert("비밀번호 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
<<<<<<< HEAD
      // 1. 사용자 정보 생성
      const tempUserId = `local-${Date.now()}`;
      const signupData = { id: tempUserId, username, password, name, phone, role, status: 'ACTIVE' };
      
      await signupAPI(signupData);

      // 2. 역할에 따른 후속 처리
      if (role === 'ADMIN') {
        // 2-1. 관리자: 매장 생성 API를 별도로 호출
        const storeId = `store-${Date.now()}`;
        const storeData = {
          id: storeId,
          name: `${brandName} ${branchName}`,
          type: storeCategory,
          address,
          capacity: parseInt(capacity, 10) || 0,
          open_time: formatTime(openTime),
          close_time: formatTime(closeTime),
          user_id: tempUserId,
        };
        await registerStoreAPI(storeData);
        
        const userInfoForLogin = { ...signupData, store_id: storeId };
        login(userInfoForLogin, true);

      } else { // role === 'STAFF'
        // 2-2. 직원: 가입 완료 후 로그인 화면으로 이동
        Alert.alert("가입 완료", "이제 로그인 후 근무할 매장을 선택해주세요.");
        navigation.navigate('Login');
      }
      Toast.show({ type: 'success', text1: '가입 성공', text2: `${name}님 환영합니다!` });

    } catch (error) {
      console.error('회원가입 에러:', error);
      const errorMessage = error instanceof Error ? error.message : 
                         axios.isAxiosError(error) && error.response ? `서버 오류: ${error.response.status}` : 
                         "알 수 없는 오류가 발생했습니다.";
      Alert.alert("가입 실패", `${errorMessage}\n\n문제가 지속되면 관리자에게 문의하세요.`);
    } finally {
      setLoading(false);
=======
      setIsSubmitting(true);
      const userId = `U_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`.slice(0, 21);
      const signupData: any = {
        id: userId,
        username: id,
        password,
        name,
        phone,
        role,
        status: "ACTIVE",
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

      login(
        {
          ...signupData,
          role,
        },
        false,
      );

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const serverMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.message;

        if (status === 409) {
          Alert.alert('가입 실패', serverMessage || '이미 사용 중인 정보입니다.');
        } else if (status === 403) {
          Alert.alert(
            '가입 실패',
            '요청이 차단되었습니다. 백엔드 서버를 재시작하고 CORS 설정이 적용됐는지 확인해주세요.',
          );
        } else {
          Alert.alert('가입 실패', serverMessage || `서버 오류: ${status}`);
        }
      } else if (axios.isAxiosError(error) && error.request) {
        Alert.alert('가입 실패', '백엔드 서버에 연결할 수 없습니다.');
      } else {
        Alert.alert('가입 실패', '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>처리 중...</Text></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
<<<<<<< HEAD
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{role === 'ADMIN' ? '관리자 회원가입' : '직원 회원가입'}</Text>
=======
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === 'ADMIN' ? '관리자 회원가입' : '직원 회원가입'}
        </Text>
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer}>
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>기본 정보</Text>
<<<<<<< HEAD
          <TextInput style={styles.input} placeholder="아이디 (이메일 형식)" placeholderTextColor={colors.subText} value={inputs.username} onChangeText={(text) => handleInputChange('username', text)} autoCapitalize="none" keyboardType="email-address" />
=======
          <TextInput style={styles.input} placeholder="아이디" placeholderTextColor={colors.subText} value={inputs.id} onChangeText={(text) => handleInputChange('id', text)} />
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
          <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor={colors.subText} value={inputs.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="비밀번호 확인" placeholderTextColor={colors.subText} value={inputs.passwordCheck} onChangeText={(text) => handleInputChange('passwordCheck', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="이름 (예: 김선민)" placeholderTextColor={colors.subText} value={inputs.name} onChangeText={(text) => handleInputChange('name', text)} />
          <TextInput style={styles.input} placeholder="전화번호 (예: 010-1234-5678)" placeholderTextColor={colors.subText} value={inputs.phone} onChangeText={(text) => handleInputChange('phone', text)} keyboardType="phone-pad" />

          {role === 'ADMIN' && (
<<<<<<< HEAD
            <><Text style={styles.sectionTitle}>매장 정보</Text><Text style={styles.label}>업종 카테고리</Text><TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}><Text style={styles.pickerButtonText}>{storeCategory}</Text><Text style={styles.pickerButtonIcon}>▼</Text></TouchableOpacity><TextInput style={styles.input} placeholder="브랜드명 (예: 컴포즈커피)" placeholderTextColor={colors.subText} value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} /><TextInput style={styles.input} placeholder="지점명 (예: 미금점)" placeholderTextColor={colors.subText} value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} /><TextInput style={styles.input} placeholder="매장 주소" placeholderTextColor={colors.subText} value={inputs.address} onChangeText={(text) => handleInputChange('address', text)} /><View style={styles.timeContainer}><View style={styles.timeInputWrapper}><Text style={styles.label}>오픈 시간</Text><TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('openTime')}><Text style={styles.timeText}>{formatTime(inputs.openTime)}</Text></TouchableOpacity></View><View style={styles.timeInputWrapper}><Text style={styles.label}>마감 시간</Text><TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('closeTime')}><Text style={styles.timeText}>{formatTime(inputs.closeTime)}</Text></TouchableOpacity></View></View><Text style={styles.label}>최대 수용 인원 (선택)</Text><TextInput style={styles.input} placeholder="숫자만 입력" placeholderTextColor={colors.subText} value={inputs.capacity} onChangeText={(text) => handleInputChange('capacity', text)} keyboardType="number-pad" /></>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}><Text style={styles.buttonText}>가입 완료</Text></TouchableOpacity>
=======
            <>
              <Text style={styles.sectionTitle}>매장 정보</Text>
              
              <Text style={styles.inputLabel}>업종 카테고리</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
                <Text style={styles.pickerButtonText}>{storeCategory}</Text>
                <Ionicons name="chevron-down-outline" size={16} color={colors.subText} />
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
              <TextInput style={styles.input} placeholder="브랜드명 (예: 컴포즈커피)" placeholderTextColor={colors.subText} value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} />
              <TextInput style={styles.input} placeholder="지점명 (예: 미금점)" placeholderTextColor={colors.subText} value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} />
              
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
              <TextInput style={styles.input} placeholder="숫자만 입력" placeholderTextColor={colors.subText} value={inputs.maxCapacity} onChangeText={(text) => handleInputChange('maxCapacity', text)} keyboardType="number-pad" />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? '가입 처리 중...' : '가입 완료'}
            </Text>
          </Pressable>
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent={true} visible={isCategoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}><Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}><View style={styles.modalContent}><Text style={styles.modalTitle}>업종 선택</Text>{STORE_CATEGORIES.map((cat) => (<TouchableOpacity key={cat} style={[styles.modalOption, storeCategory === cat && styles.modalOptionSelected]} onPress={() => { setStoreCategory(cat); setCategoryModalVisible(false); }}><Text style={[styles.modalOptionText, storeCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text></TouchableOpacity>))}</View></Pressable></Modal>
      {isTimePickerVisible && (<TimePickerModal isVisible={isTimePickerVisible} initialDate={pickerTarget === 'openTime' ? inputs.openTime : inputs.closeTime} onClose={() => setTimePickerVisible(false)} onConfirm={handleTimeConfirm} />)}
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
<<<<<<< HEAD
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: colors.text },
  keyboardAvoidingContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
=======
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
    backgroundColor: colors.card,
  },
  backButtonContainer: { width: 40, justifyContent: 'center' },
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  formContainer: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: colors.card, color: colors.text, fontSize: 16 },
  inputLabel: { fontSize: 16, color: colors.subText, marginBottom: 8 },
<<<<<<< HEAD
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
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.text },
  modalOption: { paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalOptionSelected: { backgroundColor: colors.primaryLight },
  modalOptionText: { fontSize: 16, color: colors.text },
  modalOptionTextSelected: { color: colors.primary, fontWeight: 'bold' },
=======
  button: { 
    backgroundColor: colors.primary,
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: { 
    color: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: colors.border,
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
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
});
