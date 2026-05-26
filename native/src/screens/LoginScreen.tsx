import { StackNavigationProp } from '@react-navigation/stack';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  // [퀴즈 1] 이메일(email)과 비밀번호(password)를 초기값 빈 문자열("")로 가지는 객체 상태(inputs)를 만들어보세요.
  const [inputs, setInputs] = useState({email : "", password : ""});
  
  // 비구조화 할당으로 inputs에서 값을 뽑아둡니다.
  const { email, password } = inputs;

  // [퀴즈 2] 텍스트가 입력될 때마다 상태를 업데이트해주는 함수를 완성해보세요.
  // 힌트: 기존 객체를 복사하고, name 키를 가진 값을 text로 덮어씌워야 합니다.
  const handleInputChange = (name: string, text: string) => {
    // 빈칸
    setInputs({ ...inputs, [name]: text });
    console.log(`${name} 항목에 입력된 값:`, text);
  };

  const handleLogin = () => {
    console.log("로그인 시도 데이터:", inputs);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CAL 로그인</Text>

      {/* [퀴즈 3] 이메일 입력창: value와 onChangeText 속성을 알맞게 연결해보세요. */}
      <TextInput
        style={styles.input}
        placeholder="이메일을 입력하세요"
        value={email}
        onChangeText={(text) => handleInputChange('email', text)}
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
    // [퀴즈 5] 모바일에서는 텍스트가 기본적으로 왼쪽으로 어색하게 쏠릴 수 있습니다.
    // 타이틀 텍스트가 화면 가로 중앙에 예쁘게 배치되도록 정렬 속성을 추가해보세요.
    textAlign: 'center' // <-- 텍스트 중앙 정렬 속성
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15 
  },
  button: { 
    backgroundColor: '#28a745', 
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