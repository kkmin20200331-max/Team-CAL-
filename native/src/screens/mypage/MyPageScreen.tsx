import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ [추가] 테마 Context 불러오기

// ✅ navigation 객체를 받아오도록 파라미터 추가
const MyPageScreen = ({ route, navigation }: any) => {
  // ✅ setUserInfo까지 꺼내옵니다.
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params || {};

  // ✅ [수정] 마이페이지에서 사진이나 이름 변경 시 즉각 반응하도록 로컬 상태로 한번 더 관리합니다.
  const [localUserInfo, setLocalUserInfo] = useState(userInfo);
  
  // ✅ [수정] 테마 관련 상태를 전역 Context에서 가져옵니다.
  const { themeMode, setThemeMode, colors } = useTheme();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // ✅ 전역 언어 설정 가져오기
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // ✅ 알림 설정 상태 관리 (기본값: 켜짐)
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  // 백엔드에서 데이터가 아직 전달되지 않았을 경우를 대비한 안전장치(Fallback)
  const name = localUserInfo?.name || '사용자';
  const role = localUserInfo?.role || 'STAFF';
  // 현재 백엔드 UserVo에 매장 이름(store_id 등)이 명확히 담겨오지 않을 수 있어 임시로 지정합니다.
  const branch = localUserInfo?.brandName || localUserInfo?.store_id || '컴포즈 미금점';

  // ✅ [추가] 테마 색상을 적용한 스타일 객체를 생성합니다.
  const styles = getThemedStyles(colors);

  // 메뉴 항목을 간편하게 그리기 위한 함수
  const renderMenuItem = (icon: string, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  // 스위치(토글)가 있는 메뉴 항목을 그리기 위한 함수
  const renderSwitchItem = (icon: string, title: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D1D5DB', true: '#34C759' }} // 꺼졌을 때 회색, 켜졌을 때 초록색
        thumbColor={'#FFFFFF'} // isDarkMode ? colors.card : '#FFFFFF'
        ios_backgroundColor="#D1D5DB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          {/* ✅ 프로필 사진이 있으면 보여주고, 없으면 이름 첫 글자 표시 */}
          {localUserInfo?.profileImage ? (
            <Image source={{ uri: localUserInfo.profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{name.substring(0, 1)}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{name} 님</Text>
            <Text style={styles.userRole}>
              {branch} | {role === 'STAFF' ? t('staff') : t('admin')}
            </Text>
          </View>
        </View>

        {/* 문서 및 정보 관리 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('myInfo')}</Text>
          {/* ✅ 이동 시 localUserInfo와 함께 데이터를 덮어씌울 setLocalUserInfo 함수도 전달합니다. */}
          {renderMenuItem('👤', t('profileEdit'), () => navigation.navigate('ProfileEdit', { userInfo: localUserInfo, setUserInfo: setLocalUserInfo }))}
          {renderMenuItem('📄', t('contract'), () => navigation.navigate('Contract', { userInfo: localUserInfo }))}
          {renderMenuItem('🏥', t('healthCert'), () => navigation.navigate('HealthCert', { userInfo: localUserInfo }))}
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          {/* ✅ 클릭 시 모달창을 띄우고, 선택된 모드를 버튼 이름에 보여줍니다. */}
          {renderMenuItem('🌙', `${t('themeMode')} (${themeMode})`, () => setThemeModalVisible(true))}
          {/* ✅ 언어 설정도 모달창 연결 */}
          {renderMenuItem('🌐', `${t('languageSetting')} (${language})`, () => setLanguageModalVisible(true))}
          {/* ✅ 알림 설정은 스위치 UI로 연결 */}
          {renderSwitchItem('🔔', t('pushAlert'), isPushEnabled, setIsPushEnabled)}
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => setIsLoggedIn && setIsLoggedIn(false)}
        >
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ 화면 모드 선택용 팝업(Modal) */}
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

      {/* ✅ 언어 설정용 팝업(Modal) */}
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

// ✅ [추가] 테마 색상을 인자로 받아 스타일 객체를 반환하는 함수
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
  avatarImage: { // ✅ 이미지 태그를 위한 스타일 추가
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF', // Primary color (테마에 구애받지 않는 강한 색상으로 유지)
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
    marginBottom: 40,
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
    color: '#007BFF', // Primary color
    fontWeight: 'bold',
  },
});

export default MyPageScreen;