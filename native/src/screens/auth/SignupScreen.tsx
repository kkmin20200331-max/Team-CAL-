import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Modal, Pressable, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI } from '../../../api/auth';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';

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
  const [loading, setLoading] = useState(false);

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
    const { username, password, passwordCheck, name, phone, brandName, branchName, address, openTime, closeTime, capacity } = inputs;

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
      const tempUserId = `local-${Date.now()}`;
      const signupData: any = {
        id: tempUserId,
        username,
        password,
        name,
        phone,
        role,
        status: 'ACTIVE', // 가입 시 일단 ACTIVE, 직원은 매장 선택 후 PENDING으로 변경됨
      };

      if (role === 'ADMIN') {
        signupData.brandName = brandName;
        signupData.branchName = branchName;
        signupData.address = address;
        signupData.type = storeCategory;
        signupData.open_time = formatTime(openTime);
        signupData.close_time = formatTime(closeTime);
        signupData.capacity = parseInt(capacity, 10) || 0;
      }
      
      const response = await signupAPI(signupData);

      Toast.show({ type: 'success', text1: '가입 성공', text2: `${name}님 환영합니다!` });

      if (role === 'ADMIN') {
        const userInfoForLogin = { ...signupData, store_id: response.data?.store_id };
        login(userInfoForLogin, true);
      } else { // role === 'STAFF'
        Alert.alert("가입 완료", "이제 로그인 후 근무할 매장을 선택해주세요.");
        navigation.navigate('Login');
      }

    } catch (error) {
      console.error('회원가입 에러:', error);
      const errorMessage = error instanceof Error ? error.message : 
                         axios.isAxiosError(error) && error.response ? `서버 오류: ${error.response.status}` : 
                         "알 수 없는 오류가 발생했습니다.";
      Alert.alert("가입 실패", `${errorMessage}\n\n문제가 지속되면 관리자에게 문의하세요.`);
    } finally {
      setLoading(false);
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
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{role === 'ADMIN' ? '관리자 회원가입' : '직원 회원가입'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingContainer}>
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <TextInput style={styles.input} placeholder="아이디 (이메일 형식)" placeholderTextColor={colors.subText} value={inputs.username} onChangeText={(text) => handleInputChange('username', text)} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor={colors.subText} value={inputs.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="비밀번호 확인" placeholderTextColor={colors.subText} value={inputs.passwordCheck} onChangeText={(text) => handleInputChange('passwordCheck', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="이름 (예: 김선민)" placeholderTextColor={colors.subText} value={inputs.name} onChangeText={(text) => handleInputChange('name', text)} />
          <TextInput style={styles.input} placeholder="전화번호 (예: 010-1234-5678)" placeholderTextColor={colors.subText} value={inputs.phone} onChangeText={(text) => handleInputChange('phone', text)} keyboardType="phone-pad" />

          {role === 'ADMIN' && (
            <><Text style={styles.sectionTitle}>매장 정보</Text><Text style={styles.label}>업종 카테고리</Text><TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}><Text style={styles.pickerButtonText}>{storeCategory}</Text><Text style={styles.pickerButtonIcon}>▼</Text></TouchableOpacity><TextInput style={styles.input} placeholder="브랜드명 (예: 컴포즈커피)" placeholderTextColor={colors.subText} value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} /><TextInput style={styles.input} placeholder="지점명 (예: 미금점)" placeholderTextColor={colors.subText} value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} /><TextInput style={styles.input} placeholder="매장 주소" placeholderTextColor={colors.subText} value={inputs.address} onChangeText={(text) => handleInputChange('address', text)} /><View style={styles.timeContainer}><View style={styles.timeInputWrapper}><Text style={styles.label}>오픈 시간</Text><TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('openTime')}><Text style={styles.timeText}>{formatTime(inputs.openTime)}</Text></TouchableOpacity></View><View style={styles.timeInputWrapper}><Text style={styles.label}>마감 시간</Text><TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('closeTime')}><Text style={styles.timeText}>{formatTime(inputs.closeTime)}</Text></TouchableOpacity></View></View><Text style={styles.label}>최대 수용 인원 (선택)</Text><TextInput style={styles.input} placeholder="숫자만 입력" placeholderTextColor={colors.subText} value={inputs.capacity} onChangeText={(text) => handleInputChange('capacity', text)} keyboardType="number-pad" /></>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}><Text style={styles.buttonText}>가입 완료</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent={true} visible={isCategoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}><Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}><View style={styles.modalContent}><Text style={styles.modalTitle}>업종 선택</Text>{STORE_CATEGORIES.map((cat) => (<TouchableOpacity key={cat} style={[styles.modalOption, storeCategory === cat && styles.modalOptionSelected]} onPress={() => { setStoreCategory(cat); setCategoryModalVisible(false); }}><Text style={[styles.modalOptionText, storeCategory === cat && styles.modalOptionTextSelected]}>{cat}</Text></TouchableOpacity>))}</View></Pressable></Modal>
      {isTimePickerVisible && (<TimePickerModal isVisible={isTimePickerVisible} initialDate={pickerTarget === 'openTime' ? inputs.openTime : inputs.closeTime} onClose={() => setTimePickerVisible(false)} onConfirm={handleTimeConfirm} />)}
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: colors.text },
  keyboardAvoidingContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  formContainer: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12 },
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
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.text },
  modalOption: { paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalOptionSelected: { backgroundColor: colors.primaryLight },
  modalOptionText: { fontSize: 16, color: colors.text },
  modalOptionTextSelected: { color: colors.primary, fontWeight: 'bold' },
});
