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
import { getStoresAPI, loginAPI, getMyStoreAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { colors, isDarkMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const styles = getThemedStyles(colors, isDarkMode);

  const handleInputChange = (name: string, text: string) => {
    setInputs({ ...inputs, [name]: text });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('inputError'), t('loginFieldsRequired'));
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
        Alert.alert(t('loginFailed'), t('loginRoleMismatch'));
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
          brandName: store.name || store.store_name || t('brand'),
          branchName: store.address || store.location || store.id,
        }));

        finalUserInfo.branches = branches;
        finalUserInfo.activeBranchId = branches[0]?.id;
        finalUserInfo.store_id = branches[0]?.id;
        hasBranch = branches.length > 0;
      } else if (finalRole === 'STAFF') {
        try {
          const storeResponse = await getMyStoreAPI(data.id);
          const store = storeResponse.data;
          if (store && store.id) {
            finalUserInfo.store_id = store.id;
            finalUserInfo.activeBranchId = store.id;
            finalUserInfo.brandName = store.name || t('brand');
            finalUserInfo.branchName = store.address || store.id;
            hasBranch = true;
          }
        } catch (err) {
          console.error('직원 매장 정보 가져오기 실패:', err);
        }
      }

      login(finalUserInfo, hasBranch);
    } catch (error: any) {
      console.error('로그인 오류:', error);
      const message =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : error?.response?.data?.message;
      Alert.alert(t('loginFailed'), message || t('loginCredentialsCheck'));
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
              {t('staffLabel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, loginRole === 'ADMIN' && styles.roleButtonActive]}
            onPress={() => setLoginRole('ADMIN')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, loginRole === 'ADMIN' && styles.roleButtonTextActive]}>
              {t('adminLabel')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={colors.subText} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('usernamePlaceholder')}
            placeholderTextColor={colors.subText}
            value={username}
            onChangeText={(text) => handleInputChange('username', text)}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.subText} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('passwordPlaceholder')}
            placeholderTextColor={colors.subText}
            value={password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>{t('loginBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('SignupChoice')}>
          <Text style={styles.secondaryButtonText}>{t('signupBtn')}</Text>
        </TouchableOpacity>

        <View style={styles.languageToggleContainer}>
          <TouchableOpacity 
            style={[styles.languageToggleOption, language === '한국어' && styles.languageToggleOptionActive]} 
            onPress={() => setLanguage('한국어')}
          >
            <Text style={[styles.languageToggleText, language === '한국어' && styles.languageToggleTextActive]}>KO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageToggleOption, language === 'English' && styles.languageToggleOptionActive]} 
            onPress={() => setLanguage('English')}
          >
            <Text style={[styles.languageToggleText, language === 'English' && styles.languageToggleTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageToggleOption, language === '日本語' && styles.languageToggleOptionActive]} 
            onPress={() => setLanguage('日本語')}
          >
            <Text style={[styles.languageToggleText, language === '日本語' && styles.languageToggleTextActive]}>JA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  languageToggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: isDarkMode ? '#2C2C2E' : '#F1F5F9',
    borderRadius: 20,
    padding: 3,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageToggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageToggleOptionActive: {
    backgroundColor: colors.primary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.subText,
  },
  languageToggleTextActive: {
    color: '#FFFFFF',
  },
  logoImage: { width: 320, height: 120, alignSelf: 'center', marginBottom: 36 },
  roleToggleContainer: { 
    flexDirection: 'row', 
    marginBottom: 24, 
    backgroundColor: isDarkMode ? 'rgba(0,162,0,0.1)' : '#F2F8E8', 
    borderRadius: 12, 
    padding: 4, 
    borderWidth: 1, 
    borderColor: colors.primary 
  },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9 },
  roleButtonActive: { 
    backgroundColor: isDarkMode ? '#3A3A3C' : '#FFFFFF', 
    elevation: 2, 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 6 
  },
  roleButtonText: { fontSize: 15, fontWeight: '700', color: colors.subText },
  roleButtonTextActive: { color: colors.primary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  primaryButton: { 
    backgroundColor: colors.primary, 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10 
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { 
    backgroundColor: isDarkMode ? '#2C2C2E' : '#F1F5F9', 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12 
  },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
});
