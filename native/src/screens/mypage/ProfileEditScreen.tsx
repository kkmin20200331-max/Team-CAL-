import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfileAPI } from '../../../api/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 1. 테마 Context 불러오기

const ProfileEditScreen = ({ route, navigation }: any) => {
  // MyPageScreen에서 넘겨준 userInfo와 상태 변경 함수를 받습니다.
  const { userInfo, setUserInfo } = route.params || {};

  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

  // ✅ 2. 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // 수정 가능한 정보의 상태 관리
  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    try {
      // 1. 백엔드 주석의 요구사항("기존 정보는 그대로 담아서")을 반영하여
      // 기존 userInfo 객체를 모두 복사한 뒤, 수정된 내용만 덮어씌웁니다.
      const updateData = { 
        ...userInfo, 
        name: name, 
        phone: phone,
        // 비밀번호를 새로 입력했다면 새 비밀번호로, 안 했다면 기존 비밀번호를 유지합니다.
        password: newPassword !== '' ? newPassword : userInfo.password
      };
      
      // 2. 백엔드 API 호출! (PUT /api/users)
      await updateProfileAPI(updateData);

      // 3. 앱(프론트엔드)의 로컬 상태도 업데이트해서 화면에 즉각 반영
      if (setUserInfo) {
        setUserInfo({ ...userInfo, name, phone });
      }

      Alert.alert(t('saveCompleteTitle'), t('saveCompleteMsg'), [
        { text: t('confirm'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('개인정보 수정 에러:', error);
      Alert.alert(t('editFailTitle'), t('editFailMsg'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileEdit')}</Text>
        {/* ✅ 에러 원인 해결: 주석을 안쪽이나 바깥으로 빼서 띄어쓰기를 없앱니다 */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 1. 수정 불가 정보 (Read-Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('accountInfoReadonly')}</Text>
          
          <Text style={styles.label}>{t('idLabel')}</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.username || t('unknown')} 
            editable={false} 
          />

          <Text style={styles.label}>{t('branchLabel')}</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점'} 
            editable={false} 
          />

          <Text style={styles.label}>{t('roleLabel')}</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.role === 'ADMIN' ? t('adminRole') : t('staffRole')} 
            editable={false} 
          />
        </View>

        {/* 2. 수정 가능 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myInfoSection')}</Text>
          
          <Text style={styles.label}>{t('nameLabel')}</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder={t('namePlaceholder')}
          />

          <Text style={styles.label}>{t('phoneLabel')}</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder={t('phonePlaceholder')}
            keyboardType="phone-pad"
          />
        </View>

        {/* 3. 비밀번호 변경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('changePasswordSection')}</Text>
          
          <Text style={styles.label}>{t('currentPasswordLabel')}</Text>
          <TextInput 
            style={styles.input} 
            value={currentPassword} 
            onChangeText={setCurrentPassword} 
            placeholder={t('currentPasswordPlaceholder')}
            secureTextEntry={true}
          />

          <Text style={styles.label}>{t('newPasswordLabel')}</Text>
          <TextInput 
            style={styles.input} 
            value={newPassword} 
            onChangeText={setNewPassword} 
            placeholder={t('newPasswordPlaceholder')}
            secureTextEntry={true}
          />
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('editCompleteBtn')}</Text>
        </TouchableOpacity>

        {/* 회원 탈퇴 */}
        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawText}>{t('withdrawBtn')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ 3. 테마 색상을 인자로 받아 스타일을 생성하도록 변경
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    backgroundColor: colors.card
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.text, 
    marginBottom: 16 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.subText, 
    marginBottom: 6,
    marginLeft: 2
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: colors.text,
    marginBottom: 16,
    backgroundColor: colors.card
  },
  disabledInput: { 
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', 
    color: colors.subText 
  },
  saveButton: { 
    backgroundColor: '#2563EB', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  withdrawButton: { 
    alignItems: 'center', 
    paddingVertical: 10,
    marginBottom: 40 
  },
  withdrawText: { 
    color: '#9CA3AF', 
    fontSize: 13, 
    textDecorationLine: 'underline' 
  }
});

export default ProfileEditScreen;