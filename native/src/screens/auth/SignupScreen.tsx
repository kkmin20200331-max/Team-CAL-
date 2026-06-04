import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI } from '../../../api/auth';
import axios from 'axios';

// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type SignupScreenNavigationProp = StackNavigationProp<any, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

export default function SignupScreen({ navigation }: Props) {
  // [퀴즈 1] 상태 초기화
  const [inputs, setInputs] = useState({id : "", password : "", passwordCheck : "", name : "", phone: ""});
  
  // 비구조화 할당
  const { id, password, passwordCheck, name, phone } = inputs;

  // [퀴즈 2] 입력 핸들러
  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
  };

  // 회원가입 버튼 로직
  const handleSignup = async () => {
    if (!id || !password || !passwordCheck || !name || !phone) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return; 
    }

    if (password !== passwordCheck) {
      Alert.alert("비밀번호 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
    // 2. 백엔드로 보낼 데이터 조립
    // 백엔드의 UserVo(username)와 프론트의 변수(id) 이름을 맞춰줍니다.
    // 메모: 백엔드는 id/status를 자동 생성하지 않으므로 RN에서 함께 전달합니다.
    const signupData = {
      id: `U_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`.slice(0, 21),
      username: id,
      password,
      name,
      phone,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    };
    
    // 3. 백엔드 API 호출!
    await signupAPI(signupData);

    // 4. 통신 성공 시 화면 이동 및 알림
    Alert.alert("가입 성공", `${name}님 환영합니다!`, [
      { text: "확인", onPress: () => navigation.goBack() }
    ]);

  } catch (error) {
  if (axios.isAxiosError(error) && error.response) {
    Alert.alert("가입 실패", `서버 오류: ${error.response.status}`);
  } else if (axios.isAxiosError(error) && error.request) {
    Alert.alert("가입 실패", "백엔드 서버에 연결할 수 없습니다.");
  } else {
    Alert.alert("가입 실패", "알 수 없는 오류가 발생했습니다.");
  }
}
  }; // handleSignup 끝

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입 화면</Text>
      
      <TextInput
        style={styles.input}
        placeholder="아이디"
        value={id}
        onChangeText={(text) => handleInputChange('id', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry={true}
      />

      {/* [퀴즈 3] */}
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        value={passwordCheck}
        onChangeText={(text)=> handleInputChange('passwordCheck', text)}
        secureTextEntry={true} 
      />

      <TextInput
        style={styles.input}
        placeholder="이름 (예: 김선민)"
        value={name}
        onChangeText={(text)=> handleInputChange('name', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="전화번호 (예: 010-1234-5678)"
        value={phone}
        onChangeText={(text)=> handleInputChange('phone', text)}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>가입 완료</Text>
      </TouchableOpacity>
      
      {/* [퀴즈 4] */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>로그인으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
} // SignupScreen 컴포넌트 끝 (여기도 ; 빼는 것이 더 깔끔합니다)

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
