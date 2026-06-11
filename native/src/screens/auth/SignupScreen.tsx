import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI } from '../../../api/auth';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 1. AsyncStorage 임포트

type SignupScreenNavigationProp = StackNavigationProp<any, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
  route: { params: { role: 'STAFF' | 'ADMIN' } };
};

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
      }
      
      await signupAPI(signupData);

      Toast.show({
        type: 'success',
        text1: '가입 성공',
        text2: `${name}님 환영합니다!`,
      });

      if (role === 'ADMIN') {
        const branches = [{ id: 'branch_1', brandName, branchName }];
        // 2. 관리자 가입 성공 시, 지점 정보를 AsyncStorage에 저장
        await AsyncStorage.setItem(`admin_branch_info_${id}`, JSON.stringify(branches));

        const userInfoForLogin = {
          ...signupData,
          branches: branches,
          activeBranchId: 'branch_1',
        };
        login(userInfoForLogin, true);
      } else {
        login(signupData, false);
      }

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("가입 실패", `서버 오류: ${error.response.status}`);
      } else if (axios.isAxiosError(error) && error.request) {
        Alert.alert("가입 실패", "백엔드 서버에 연결할 수 없습니다.");
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
          <TextInput style={styles.input} placeholder="아이디" value={inputs.id} onChangeText={(text) => handleInputChange('id', text)} />
          <TextInput style={styles.input} placeholder="비밀번호" value={inputs.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="비밀번호 확인" value={inputs.passwordCheck} onChangeText={(text) => handleInputChange('passwordCheck', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="이름 (예: 김선민)" value={inputs.name} onChangeText={(text) => handleInputChange('name', text)} />
          <TextInput style={styles.input} placeholder="전화번호 (예: 010-1234-5678)" value={inputs.phone} onChangeText={(text) => handleInputChange('phone', text)} keyboardType="phone-pad" />

          {role === 'ADMIN' && (
            <>
              <Text style={styles.sectionTitle}>매장 정보</Text>
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
  }
});