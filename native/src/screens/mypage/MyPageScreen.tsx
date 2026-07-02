import React, { useState, useMemo, useCallback } from 'react'; // useMemo 임포트
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Switch, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { getLineInfoAPI, deleteLineInfoAPI } from '../../../api/auth';

type Props = {
  navigation: any;
};

const MyPageScreen = ({ navigation }: Props) => {
  const { userInfo, logout } = useApp(); 

  const { themeMode, setThemeMode, colors } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isLineLinked, setIsLineLinked] = useState(false);

  const checkLineLinkStatus = async () => {
    const userId = userInfo?.id;
    if (!userId) return;
    try {
      const response = await getLineInfoAPI(userId);
      if (response.data?.followed || response.data?.follow_yn === 'Y') {
        setIsLineLinked(true);
      } else {
        setIsLineLinked(false);
      }
    } catch (error) {
      console.error("LINE 연동 조회 오류:", error);
      setIsLineLinked(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkLineLinkStatus();
    }, [userInfo?.id])
  );

  const handleLineLink = async () => {
    const userId = userInfo?.id;
    if (!userId) return;
    
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      Alert.alert(t('error'), 'API Base URL is not configured.');
      return;
    }
    
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const loginUrl = `${normalizedBaseUrl}/line/login?userId=${encodeURIComponent(userId)}&source=app`;
    try {
      const supported = await Linking.canOpenURL(loginUrl);
      if (supported) {
        await Linking.openURL(loginUrl);
      } else {
        Alert.alert(t('error'), 'Cannot open URL: ' + loginUrl);
      }
    } catch (error) {
      console.error("LINE 연동 열기 실패:", error);
      Alert.alert(t('error'), t('processErrorMsg'));
    }
  };

  const handleLineUnlink = () => {
    const userId = userInfo?.id;
    if (!userId) return;
    Alert.alert(
      t('lineLink'),
      t('unlinkLineConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              await deleteLineInfoAPI(userId);
              setIsLineLinked(false);
              Toast.show({
                type: 'success',
                text1: t('lineLink'),
                text2: t('unlinkLineBtn') + ' ' + t('confirm'),
              });
            } catch (error) {
              console.error("LINE 연동 해제 실패:", error);
              Alert.alert(t('error'), t('processErrorMsg'));
            }
          }
        }
      ]
    );
  };

  const name = userInfo?.name || '사용자';
  const role = userInfo?.role || 'STAFF';

  // ✅ [수정] 활성 지점 정보를 동적으로 찾도록 수정
  const activeBranch = useMemo(() => {
    if (!userInfo) return null;
    // 관리자인 경우
    if (userInfo.role === 'ADMIN' && userInfo.branches && userInfo.activeBranchId) {
      return userInfo.branches.find(b => b.id === userInfo.activeBranchId);
    }
    // 직원인 경우 (또는 관리자인데 지점 정보가 없는 예외 케이스)
    return {
      brandName: userInfo.brandName || '브랜드',
      branchName: userInfo.branchName || '지점',
    };
  }, [userInfo]);

  const branchDisplayName = activeBranch ? `${activeBranch.brandName} ${activeBranch.branchName}` : '지점 정보 없음';

  const styles = getThemedStyles(colors);

  const renderMenuItem = (icon: string, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={20} color={colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={colors.subText} />
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon: string, title: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={20} color={colors.primary} style={styles.menuIcon} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D1D5DB', true: colors.primary }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor="#D1D5DB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const handleWithdraw = () => {
    Alert.alert(
      t('withdrawConfirmTitle'),
      t('withdrawConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            logout();
            Toast.show({
              type: 'success',
              text1: t('withdrawSuccessTitle'),
              text2: t('withdrawSuccessMsg'),
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
          {userInfo?.profileImage ? (
            <Image source={{ uri: userInfo.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{name.substring(0, 1)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{name} 님</Text>
            <Text style={styles.userRole}>
              {branchDisplayName} | {role === 'ADMIN' ? t('admin') : t('staff')}
            </Text>
          </View>
        </View>

        {/* LINE 연동 섹션 */}
        <View style={styles.lineSection}>
          <View style={styles.lineHeader}>
            <Image source={require('../../../assets/img/line-icon-144.png')} style={styles.lineLogo} />
            <View style={styles.lineTextContainer}>
              <Text style={styles.lineTitle}>{t('lineLink')}</Text>
              <Text style={styles.lineStatusText}>
                {isLineLinked ? t('lineLinked') : t('lineUnlinked')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.lineButton, isLineLinked ? styles.lineButtonUnlink : styles.lineButtonLink]}
            onPress={isLineLinked ? handleLineUnlink : handleLineLink}
          >
            <Text style={[styles.lineButtonText, isLineLinked ? styles.lineButtonTextUnlink : styles.lineButtonTextLink]}>
              {isLineLinked ? t('unlinkLineBtn') : t('linkLineBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('myInfo')}</Text>
          {renderMenuItem('person-outline', t('profileEdit'), () => navigation.navigate('ProfileEdit', { userInfo }))}
          {renderMenuItem('document-text-outline', t('contract'), () => navigation.navigate('Contract', { userInfo }))}
          {renderMenuItem('medkit-outline', t('healthCert'), () => navigation.navigate('HealthCert', { userInfo }))}
          {role === 'STAFF' && renderMenuItem('people-outline', t('mySubstituteHistory'), () => navigation.navigate('Substitute', { userInfo }))}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          {renderMenuItem('moon-outline', `${t('themeMode')} (${themeMode})`, () => setThemeModalVisible(true))}
          {renderMenuItem('globe-outline', `${t('languageSetting')} (${language})`, () => setLanguageModalVisible(true))}
          {renderSwitchItem('notifications-outline', t('pushAlert'), isPushEnabled, setIsPushEnabled)}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

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
                  setThemeMode(mode as any);
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
    color: colors.primary,
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
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: colors.text,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.primary,
    fontWeight: 'bold',
  },
  lineSection: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 6,
  },
  lineTextContainer: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  lineStatusText: {
    fontSize: 13,
    color: colors.subText,
    marginTop: 2,
  },
  lineButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineButtonLink: {
    backgroundColor: '#06C755',
  },
  lineButtonUnlink: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lineButtonTextLink: {
    color: '#FFFFFF',
  },
  lineButtonTextUnlink: {
    color: colors.text,
  },
});

export default MyPageScreen;
