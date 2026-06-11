import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { loginAPI } from '../../../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/User';
import { useApp } from '../../contexts/AppContext';

type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [inputs, setInputs] = useState({username : "", password : ""});
  const { username, password } = inputs;
  const [loginRole, setLoginRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  
  const { login } = useApp();

  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("입력 오류", "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    try {
      const response = await loginAPI(username, password);
      const data = response.data;

      const serverRole = data.role ? data.role.toUpperCase() : null;
      
      if (serverRole && serverRole !== loginRole) {
        Alert.alert("로그인 실패", "선택하신 로그인 유형과 계정의 실제 권한이 일치하지 않습니다.");
        return;
      }

      const finalRole = serverRole || loginRole;
      let finalUserInfo: any = { ...data, role: finalRole };
      let hasBranch = false;

      if (finalRole === 'ADMIN') {
        hasBranch = true;
        if (data.branches && data.branches.length > 0) {
          finalUserInfo.branches = data.branches;
          finalUserInfo.activeBranchId = data.branches[0].id;
        } else if (data.brandName && data.branchName) {
          finalUserInfo.branches = [{ id: 'branch_1', brandName: data.brandName, branchName: data.branchName }];
          finalUserInfo.activeBranchId = 'branch_1';
        }
      } else { // 직원일 경우
        // TODO: [미래 구현] 백엔드 연동 시, 아래 주석을 해제하여 최초 로그인이 아닐 경우 지점 선택 화면을 건너뛰게 합니다.
        // 1. 백엔드 API 응답(data)에 사용자가 속한 지점 정보(예: store_id)가 있는지 확인합니다.
        // 2. 지점 정보가 있다면, 이미 지점을 선택한 사용자이므로 hasBranch를 true로 설정합니다.
        //
        // 예시:
        // if (data.store_id) {
        //   hasBranch = true;
        // } else {
        //   hasBranch = false;
        // }

        // 현재는 개발 중이므로, 테스트를 위해 항상 지점 선택 화면으로 이동하도록 false로 설정합니다.
        hasBranch = false;
      }

      login(finalUserInfo, hasBranch);

    } catch (error) {
      console.error("로그인 에러:", error);
      Alert.alert("로그인 실패", "아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
            source={require('../../../assets/img/logo_3.png')}
            style={styles.logoImage}
            resizeMode="contain"
        />
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
              style={[styles.roleButton, loginRole === 'STAFF' && styles.roleButtonActive]}
              onPress={() => setLoginRole('STAFF')}
              activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, loginRole === 'STAFF' && styles.roleButtonTextActive]}>직원</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.roleButton, loginRole === 'ADMIN' && styles.roleButtonActive]}
              onPress={() => setLoginRole('ADMIN')}
              activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, loginRole === 'ADMIN' && styles.roleButtonTextActive]}>관리자 (점주)</Text>
          </TouchableOpacity>
        </View>
        <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            value={username}
            onChangeText={(text) => handleInputChange('username', text)}
        />
        <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry={true}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SignupChoice')}
        >
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  logoImage: { width: 400, height: 150, alignSelf: 'center', marginBottom: 40 },
  roleToggleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  roleButtonActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  roleButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  roleButtonTextActive: { color: '#6EE7B7' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#6EE7B7', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#064E3B', fontSize: 16, fontWeight: 'bold' }
});