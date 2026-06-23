import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoresAPI, loginAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';

type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

type LoginRole = 'STAFF' | 'ADMIN';

export default function LoginScreen({ navigation }: Props) {
  const [inputs, setInputs] = useState({ username: '', password: '' });
  const { username, password } = inputs;
  const [loginRole, setLoginRole] = useState<LoginRole>('STAFF');
  const { login } = useApp();

  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await loginAPI(username, password);
      const data = response.data;
      const serverRole = data.role ? String(data.role).toUpperCase() as LoginRole : null;
      const isRoleMatched =
        loginRole === 'ADMIN'
          ? serverRole === 'ADMIN'
          : serverRole === 'STAFF';

      if (serverRole && !isRoleMatched) {
        Alert.alert('로그인 실패', '선택한 로그인 유형과 계정 권한이 일치하지 않습니다.');
        return;
      }

      const finalRole = (serverRole || loginRole) as LoginRole;
      const finalUserInfo: any = { ...data, role: finalRole };
      let hasBranch = false;

      if (finalRole === 'ADMIN') {
        const storesResponse = await getStoresAPI(data.id);
        const stores = Array.isArray(storesResponse.data) ? storesResponse.data : [];
        const branches = stores.map((store: any) => ({
          id: store.id,
          brandName: store.name || store.store_name || '매장',
          branchName: store.address || store.location || store.id,
        }));

        finalUserInfo.branches = branches;
        finalUserInfo.activeBranchId = branches[0]?.id;
        finalUserInfo.store_id = branches[0]?.id;
        hasBranch = branches.length > 0;
      }

      login(finalUserInfo, hasBranch);
    } catch (error: any) {
      console.error('로그인 오류:', error);
      const message =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : error?.response?.data?.message;
      Alert.alert('로그인 실패', message || '아이디 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text style={[styles.roleButtonText, loginRole === 'STAFF' && styles.roleButtonTextActive]}>
              직원
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, loginRole === 'ADMIN' && styles.roleButtonActive]}
            onPress={() => setLoginRole('ADMIN')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, loginRole === 'ADMIN' && styles.roleButtonTextActive]}>
              관리자
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={(text) => handleInputChange('username', text)}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('SignupChoice')}>
          <Text style={styles.secondaryButtonText}>회원가입</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  logoImage: { width: 360, height: 140, alignSelf: 'center', marginBottom: 36 },
  roleToggleContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#10B981' },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9 },
  roleButtonActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  roleButtonText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  roleButtonTextActive: { color: '#059669' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 16,
  },
  primaryButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: '#475569', fontSize: 16, fontWeight: 'bold' },
});
