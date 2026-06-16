import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { loginAPI } from '../../../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/User';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

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

      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (supabaseError) {
        console.error('Supabase login failed:', supabaseError.message);
        Alert.alert("참고", "Supabase 세션 연결에 실패했습니다. 일부 기능(파일 업로드 등)이 제한될 수 있습니다.");
      }

      const serverRole = data.role ? data.role.toUpperCase() : 'GUEST';
      const serverStatus = data.status || 'PENDING'; // ✅ [수정] status가 없으면 PENDING으로 간주

      const isRoleMismatch = 
        (loginRole === 'ADMIN' && serverRole !== 'ADMIN') || 
        (loginRole === 'STAFF' && serverRole === 'ADMIN');

      if (isRoleMismatch) {
        Alert.alert("로그인 실패", "선택하신 로그인 유형과 계정의 실제 권한이 일치하지 않습니다.");
        return;
      }

      const finalRole = serverRole;
      // ✅ [수정] finalUserInfo에 serverStatus를 명시적으로 포함
      let finalUserInfo: any = { ...data, role: finalRole, status: serverStatus };
      let hasBranch = false;

      if (finalRole === 'ADMIN') {
        hasBranch = true;
        if (data.branches && data.branches.length > 0) {
          finalUserInfo.branches = data.branches;
          finalUserInfo.activeBranchId = data.branches[0].id;
        } else {
          const storedBranchInfo = await AsyncStorage.getItem(`admin_branch_info_${username}`);
          if (storedBranchInfo) {
            const branches = JSON.parse(storedBranchInfo);
            finalUserInfo.branches = branches;
            finalUserInfo.activeBranchId = branches[0]?.id;
          }
        }
      } else {
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
            placeholder="아이디 (이메일 형식)"
            value={username}
            onChangeText={(text) => handleInputChange('username', text)}
            autoCapitalize="none"
            keyboardType="email-address"
        />
        <TextInput
            style={styles.input}
            placeholder="비밀번호"
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