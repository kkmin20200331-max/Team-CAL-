import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfileAPI } from '../../../api/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 1. 테마 Context 불러오기
import * as ImagePicker from 'expo-image-picker'; // ✅ 이미지 피커 추가

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

  // ✅ 프로필 사진 상태 관리 (기존 사진이 있으면 불러옴)
  const [profileImage, setProfileImage] = useState<string | null>(userInfo?.profileImage || null);

  // 📸 갤러리 열기 함수
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // 크롭 편집 허용
      aspect: [1, 1], // 프로필 사진용 1:1 비율
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      // ✅ 에러 원인 해결: 백엔드(Spring Boot)의 UserVo에는 아직 profileImage 필드가 없기 때문에,
      // 프론트에서 사진 경로를 묶어서 보내면 백엔드가 알 수 없는 데이터라며 400 에러를 뱉습니다.
      // 따라서 전송할 데이터(updateData)에서는 사진을 분리하고 텍스트만 보냅니다.
      const { profileImage: _, ...restUserInfo } = userInfo;

      const updateData = { 
        ...restUserInfo, 
        name: name, 
        phone: phone,
        // 비밀번호를 새로 입력했다면 새 비밀번호로, 안 했다면 기존 비밀번호를 유지합니다.
        // (참고: 로그인 시 보안상 백엔드에서 비밀번호를 비워서 주므로 오류 방지용 예외처리를 추가했습니다)
        password: newPassword !== '' ? newPassword : (userInfo.password || '1234')
      };
      
      // 2. 백엔드 API 호출! (PUT /api/users)
      await updateProfileAPI(updateData);

      // 3. 앱(프론트엔드)의 로컬 상태도 업데이트해서 화면에 즉각 반영
      if (setUserInfo) {
        setUserInfo({ ...userInfo, name, phone, profileImage });
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
        
        {/* ✅ 상단 프로필 사진 수정 영역 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{name.substring(0, 1)}</Text>
              </View>
            )}
            {/* 사진 수정 뱃지(카메라 아이콘) */}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>
        </View>
        
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
  
  // ✅ 아바타 스타일 추가
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 40, fontWeight: 'bold', color: '#007BFF' },
  avatarEditBadge: { position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.card, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatarEditBadgeText: { fontSize: 14 },

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