import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: any;
};

const MyPageScreen = ({ navigation }: Props) => {
  const { userInfo, logout } = useApp(); 

  const { themeMode, setThemeMode, colors, isDarkMode } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const { language, setLanguage, t, isTranslating } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  const name = userInfo?.name || '사용자';
  const role = userInfo?.role || 'STAFF';

  const activeBranch = useMemo(() => {
    if (!userInfo) return null;
    if (userInfo.role === 'ADMIN' && userInfo.branches && userInfo.activeBranchId) {
      return userInfo.branches.find(b => b.id === userInfo.activeBranchId);
    }
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
        trackColor={{ false: colors.gray, true: colors.green }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.gray}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const handleLineConnect = () => {
    Alert.alert("준비 중인 기능", "LINE 연동 기능은 현재 준비 중입니다.");
  };

  const handleNavigateToMonthlyDetail = () => {
    if (!userInfo) return;
    navigation.navigate('PayrollDetail', {
      employeeId: userInfo.id,
      month: new Date().toISOString(),
    });
  };

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

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('myInfo')}</Text>
          {renderMenuItem('👤', t('profileEdit'), () => navigation.navigate('ProfileEdit'))}
          {renderMenuItem('📄', t('contract'), () => navigation.navigate('Contract'))}
          {renderMenuItem('🏥', t('healthCert'), () => navigation.navigate('HealthCert'))}
          {role === 'STAFF' && (
            <>
              {renderMenuItem('💰', t('myPaystub'), () => handleNavigateToMonthlyDetail())}
              {renderMenuItem('🤝', t('mySubstituteHistory'), () => navigation.navigate('SubstituteMatching', { initialTab: 'history' }))}
            </>
          )}
        </View>

        {role === 'ADMIN' && (
          <>
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{t('storeManagement')}</Text>
              {renderMenuItem('🏪', t('storeInfoEdit'), () => navigation.navigate('StoreEdit'))}
            </View>
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{t('employeeManagement')}</Text>
              {renderMenuItem('📋', t('healthCertManagement'), () => Alert.alert("준비 중", "보건증 관리 화면으로 이동합니다."))}
              {renderMenuItem('📑', t('contractManagement'), () => Alert.alert("준비 중", "근로계약서 관리 화면으로 이동합니다."))}
              {renderMenuItem('🌴', t('leaveRequestManagement'), () => Alert.alert("준비 중", "휴무 신청 관리 화면으로 이동합니다."))}
            </View>
          </>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          {renderMenuItem('🌙', `${t('themeMode')} (${t(themeMode as any)})`, () => setThemeModalVisible(true))}
          {renderMenuItem('🌐', `${t('languageSetting')} (${language})`, () => setLanguageModalVisible(true))}
          {renderSwitchItem('🔔', t('pushAlert'), isPushEnabled, setIsPushEnabled)}
        </View>

        <View style={styles.connectSection}>
          <TouchableOpacity style={styles.lineButton} onPress={handleLineConnect}>
            <Image source={require('../../../assets/img/line-icon-144.png')} style={styles.lineLogo} />
            <Text style={styles.lineButtonText}>{t('lineConnect')}</Text>
          </TouchableOpacity>
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
            {['lightMode', 'darkMode', 'systemSetting'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modalOption, themeMode === t(mode as any) && styles.modalOptionSelected]}
                onPress={() => {
                  setThemeMode(t(mode as any));
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, themeMode === t(mode as any) && styles.modalOptionTextSelected]}>{t(mode as any)}</Text>
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
          {isTranslating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>번역 중...</Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  profileSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16, backgroundColor: colors.primaryLight },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  profileInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  userRole: { fontSize: 14, color: colors.subText },
  menuSection: { marginTop: 20, backgroundColor: colors.card, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: colors.subText, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 18, marginRight: 12, color: colors.text },
  menuTitle: { fontSize: 16, color: colors.text },
  menuArrow: { fontSize: 20, color: colors.subText },
  
  connectSection: { marginTop: 20, paddingHorizontal: 20 },
  lineButton: { 
    backgroundColor: colors.green,
    paddingVertical: 10,
    borderRadius: 8, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  lineLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  lineButtonText: { 
    color: colors.white,
    fontSize: 16, 
    fontWeight: 'bold',
  },

  logoutButton: { marginTop: 30, marginHorizontal: 20, paddingVertical: 14, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.red, alignItems: 'center' },
  logoutButtonText: { color: colors.red, fontSize: 16, fontWeight: 'bold' },
  withdrawButton: { alignItems: 'center', paddingVertical: 10, marginBottom: 40 },
  withdrawText: { color: '#9CA3AF', fontSize: 13, textDecorationLine: 'underline' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: colors.modalBg, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.text },
  modalOption: { paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalOptionSelected: { backgroundColor: colors.primaryLight },
  modalOptionText: { fontSize: 16, color: colors.text },
  modalOptionTextSelected: { color: colors.primary, fontWeight: 'bold' },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});

export default MyPageScreen;