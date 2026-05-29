import { StackNavigationProp } from '@react-navigation/stack';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loginAPI } from '../../api/auth';

// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

// 👇 [수정 1] Props 타입에 상태 변경 함수 2개를 추가합니다.
type Props = {
  navigation: LoginScreenNavigationProp;
  setIsLoggedIn: (value: boolean) => void;
  setUserStatus: (status: string) => void;
  setHasSelectedBranch: (value: boolean) => void;
  setUserInfo: (value: any) => void;
};

export default function LoginScreen({ navigation, setIsLoggedIn, setUserStatus, setHasSelectedBranch, setUserInfo }: Props) {
  // [퀴즈 1] 이메일(email)과 비밀번호(password)를 초기값 빈 문자열("")로 가지는 객체 상태(inputs)를 만들어보세요.
  
  // 비구조화 할당으로 inputs에서 값을 뽑아둡니다.
  const [inputs, setInputs] = useState({username : "", password : ""});
  const { username, password } = inputs;

  // ✅ [추가] 관리자/직원 로그인 선택 상태 (기본값: 직원)
  const [loginRole, setLoginRole] = useState<'STAFF' | 'ADMIN'>('STAFF');

  // [퀴즈 2] 텍스트가 입력될 때마다 상태를 업데이트해주는 함수를 완성해보세요.
  // 힌트: 기존 객체를 복사하고, name 키를 가진 값을 text로 덮어씌워야 합니다.
  const handleInputChange = (name: string, text: string) => {
    // 빈칸
    setInputs({ ...inputs, [name]: text });
  };

const handleLogin = async () => {
  try {
    const response = await loginAPI(username, password);
    const data = response.data;
    // 메모: App.tsx의 분기값이 소문자(active/pending)이므로 백엔드 상태값을 맞춰줍니다.
    const fetchedUserStatus = (data.status ?? '').toLowerCase();

    setUserStatus(fetchedUserStatus);
    setIsLoggedIn(true);
    setHasSelectedBranch(false);

    // ✅ [수정] 로그인 시 토글에서 선택한 권한(role)을 강제로 덮어씌워 App.tsx로 전달합니다.
    setUserInfo({ ...data, role: loginRole });

  } catch (error) {
    console.error("로그인 에러:", error);
    Alert.alert("로그인 실패", "아이디 또는 비밀번호를 확인해주세요.");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>バイトメート</Text>

      {/* ✅ [추가] 관리자 / 직원 선택 토글 UI */}
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

      {/* [퀴즈 3] 이메일 입력창: value와 onChangeText 속성을 알맞게 연결해보세요. */}
      <TextInput
        style={styles.input}
        placeholder="아이디를 입력하세요"
        value={username}
        onChangeText={(text) => handleInputChange('username', text)}
      />

      {/* [퀴즈 4] 비밀번호 입력창: 연결은 이메일과 동일합니다. 
          추가로, 입력한 비밀번호 글자가 보이지 않게(***) 가려주는 옵션 속성을 찾아서 넣어보세요! */}
      <TextInput
        style={styles.input}
        placeholder="비밀번호를 입력하세요"
        value={password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry={true} // <-- 비밀번호 가리기 속성
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Signup')} // 회원가입 화면으로 이동
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 40,
    // 타이틀 텍스트가 화면 가로 중앙에 예쁘게 배치되도록 정렬 속성을 추가해보세요.
    textAlign: 'center' // <-- 텍스트 중앙 정렬 속성
  },
  // --- 토글 버튼 스타일 ---
  roleToggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#8B5CF6',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
  },
  button: { 
    backgroundColor: '#8B5CF6', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
