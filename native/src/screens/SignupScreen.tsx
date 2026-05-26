import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type SignupScreenNavigationProp = StackNavigationProp<any, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

export default function SignupScreen({ navigation }: Props) {
  // [퀴즈 1] 상태 초기화
  const [inputs, setInputs] = useState({email : "", password : "", passwordCheck : "", name : ""});
  
  // 비구조화 할당
  const { email, password, passwordCheck, name } = inputs;

  // [퀴즈 2] 입력 핸들러
  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
    console.log(`${name} 항목에 입력된 값:`, text);
  };

  // 회원가입 버튼 로직
  const handleSignup = () => {
    console.log("가입 버튼 눌림!");
    
    if (!email || !password || !passwordCheck || !name) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return; 
    }

    if (password !== passwordCheck) {
      Alert.alert("비밀번호 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    console.log("백엔드로 보낼 가입 데이터:", inputs);
    
    Alert.alert("가입 성공", `${name}님 환영합니다!`, [
      { text: "확인", onPress: () => navigation.goBack() }
    ]);
  }; // handleSignup 끝

  // 💡 여기서부터 바로 return이 이어져야 합니다!
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입 화면</Text>
      
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={(text) => handleInputChange('email', text)}
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
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#666', fontSize: 14 }
});