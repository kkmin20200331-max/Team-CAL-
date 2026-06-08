import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { loginAPI } from '../../../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/User';

type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  setIsLoggedIn: (value: boolean) => void;
  setUserStatus: (status: User['status']) => void;
  setHasSelectedBranch: (value: boolean) => void;
  setUserInfo: (value: User) => void;
};

export default function LoginScreen({ navigation, setIsLoggedIn, setUserStatus, setHasSelectedBranch, setUserInfo }: Props) {
  const [inputs, setInputs] = useState({username : "", password : ""});
  const { username, password } = inputs;
  const [loginRole, setLoginRole] = useState<'STAFF' | 'ADMIN'>('STAFF');

  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
  };

  const handleLogin = async () => {
    try {
      const response = await loginAPI(username, password);
      const data = response.data;
      
      // ✅ [수정] .toLowerCase()를 제거하여 백엔드 상태값을 그대로 사용합니다.
      const fetchedUserStatus = data.status;

      setUserStatus(fetchedUserStatus);
      setIsLoggedIn(true);
      
      const savedStore = await AsyncStorage.getItem(`store_${data.username}`);

      console.log("서버 로그인 응답 데이터:", data);

      const finalRole = data.role ? data.role.toUpperCase() : loginRole;
      console.log("최종 부여된 권한(Role):", finalRole);

      if (data.store_id || data.branchName || data.brandName || savedStore) {
        setHasSelectedBranch(true);
        setUserInfo({ ...data, role: finalRole, store_id: data.store_id || savedStore });
      } else {
        setHasSelectedBranch(false);
        setUserInfo({ ...data, role: finalRole });
      }

    } catch (error) {
      console.error("로그인 에러:", error);
      Alert.alert("로그인 실패", "아이디 또는 비밀번호를 확인해주세요.");
    }
  };

  return (
    <View style={styles.container}>
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
        onPress={() => navigation.navigate('Signup')}
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
  logoImage: {
    width: 400,
    height: 150,
    alignSelf: 'center',
    marginBottom: 40,
  },
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
    elevation: 2,
    shadowColor: '#000',
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