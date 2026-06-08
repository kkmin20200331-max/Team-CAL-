import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Switch, Image, Alert } from 'react-native'; // ✅ Alert 임포트 추가
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User } from '../../types/User';
import Toast from 'react-native-toast-message'; // ✅ Toast 임포트 추가

type Props = {
  route: {
    params: {
      handleLogout: () => void;
      userInfo: User;
      setUserInfo: (user: User) => void;
    };
  };
  navigation: any;
};

const MyPageScreen = ({ route, navigation }: Props) => {
  // ✅ [개선 19] handleLogout 함수를 받아와 로그아웃 버튼에 연결합니다.
  const { handleLogout, userInfo, setUserInfo } = route.params || {};

  const [localUserInfo, setLocalUserInfo] = useState(userInfo);
  const { themeMode, setThemeMode, colors } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  const name = localUserInfo?.name || '사용자';
  const role = localUserInfo?.role || 'STAFF';
  const branch = localUserInfo?.brandName || localUserInfo?.store_id || '컴포즈 미금점';

  const styles = getThemedStyles(colors);

  const renderMenuItem = (icon: string, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon: string, title: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D1D5DB', true: '#34C759' }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor="#D1D5DB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  // ✅ [추가] 회원 탈퇴 처리 함수
  const handleWithdraw = () => {
    Alert.alert(
      t('withdrawConfirmTitle'), // 예: "회원 탈퇴"
      t('withdrawConfirmMsg'),   // 예: "정말 회원 탈퇴를 하시겠습니까? 모든 정보가 삭제됩니다."
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('confirm'),
          onPress: () => {
            // 🚨 백엔드 API 연동 시 여기에 탈퇴 API 호출 로직을 추가합니다.
            // 예: await deleteUserAPI(userInfo.id);

            // 현재는 API 호출 대신 로그아웃 처리 및 성공 토스트 메시지를 띄웁니다.
            if (handleLogout) {
              handleLogout(); // App.tsx에서 전달받은 로그아웃 함수 호출
            }
            Toast.show({
              type: 'success',
              text1: t('withdrawSuccessTitle'), // 예: "탈퇴 완료"
              text2: t('withdrawSuccessMsg'),   // 예: "회원 탈퇴가 성공적으로 처리되었습니다."
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          {localUserInfo?.profileImage ? (
            <Image source={{ uri: localUserInfo.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{name.substring(0, 1)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{name} 님</Text>
            {/* ✅ [개선 20] 'STAFF' 또는 'GUEST'일 경우 모두 '직원'으로 표시되도록 수정합니다. */}
            <Text style={styles.userRole}>
              {branch} | {role === 'ADMIN' ? t('admin') : t('staff')}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('myInfo')}</Text>
          {renderMenuItem('👤', t('profileEdit'), () => navigation.navigate('ProfileEdit', { userInfo: localUserInfo, setUserInfo: setLocalUserInfo }))}
          {renderMenuItem('📄', t('contract'), () => navigation.navigate('Contract', { userInfo: localUserInfo }))}
          {renderMenuItem('🏥', t('healthCert'), () => navigation.navigate('HealthCert', { userInfo: localUserInfo }))}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          {renderMenuItem('🌙', `${t('themeMode')} (${themeMode})`, () => setThemeModalVisible(true))}
          {renderMenuItem('🌐', `${t('languageSetting')} (${language})`, () => setLanguageModalVisible(true))}
          {renderSwitchItem('🔔', t('pushAlert'), isPushEnabled, setIsPushEnabled)}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => handleLogout && handleLogout()}
        >
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* ✅ [추가] 회원 탈퇴 버튼 */}
        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <Text style={styles.withdrawText}>{t('withdrawBtn')}</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setThemeModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('themeSettings')}</Text>
            {['라이트 모드', '다크 모드', '시스템 설정'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modalOption, themeMode === mode && styles.modalOptionSelected]}
                onPress={() => {
                  setThemeMode(mode);
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, themeMode === mode && styles.modalOptionTextSelected]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('langSettings')}</Text>
            {['한국어', 'English', '日本語'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.modalOption, language === lang && styles.modalOptionSelected]}
                onPress={() => {
                  setLanguage(lang as Language);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, language === lang && styles.modalOptionTextSelected]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: colors.subText,
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: colors.card,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.subText,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
    color: colors.text,
  },
  menuTitle: {
    fontSize: 16,
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.subText,
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ✅ [오류 수정] 빠진 회원 탈퇴 버튼 스타일을 추가합니다.
  withdrawButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 40,
  },
  withdrawText: {
    color: '#9CA3AF',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.modalBg,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text,
  },
  modalOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOptionTextSelected: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});

export default MyPageScreen;