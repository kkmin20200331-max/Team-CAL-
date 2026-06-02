import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal, Pressable, Switch } from 'react-native';
import { useLanguage, Language } from '../contexts/LanguageContext';

// ✅ navigation 객체를 받아오도록 파라미터 추가
const MyPageScreen = ({ route, navigation }: any) => {
  // ✅ setUserInfo까지 꺼내옵니다.
  const { setIsLoggedIn, userInfo, setUserInfo } = route.params || {};
  
  // ✅ 화면 모드(라이트/다크) 상태 관리
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [themeMode, setThemeMode] = useState('themeSystem'); // ✅ 다국어 키값으로 변경

  // ✅ 전역 언어 설정 가져오기
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // ✅ 알림 설정 상태 관리 (기본값: 켜짐)
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  // 백엔드에서 데이터가 아직 전달되지 않았을 경우를 대비한 안전장치(Fallback)
  const name = userInfo?.name || '사용자';
  const role = userInfo?.role || 'STAFF';
  // 현재 백엔드 UserVo에 매장 이름(store_id 등)이 명확히 담겨오지 않을 수 있어 임시로 지정합니다.
  const branch = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

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
        thumbColor={'#FFFFFF'}
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
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{name.substring(0, 1)}</Text>
          </View>
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
          {/* ✅ 이동 시 userInfo와 함께 데이터를 덮어씌울 setUserInfo 함수도 전달합니다. */}
          {renderMenuItem('👤', t('profileEdit'), () => navigation.navigate('ProfileEdit', { userInfo, setUserInfo }))}
          {renderMenuItem('📄', t('contract'), () => {})}
          {renderMenuItem('🏥', t('healthCert'), () => {})}
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          {/* ✅ 클릭 시 모달창을 띄우고, 선택된 모드를 버튼 이름에 보여줍니다. */}
          {renderMenuItem('🌙', `${t('themeMode')} (${t(themeMode)})`, () => setThemeModalVisible(true))}
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
            {['themeLight', 'themeDark', 'themeSystem'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modalOption, themeMode === mode && styles.modalOptionSelected]}
                onPress={() => {
                  setThemeMode(mode);
                  setThemeModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, themeMode === mode && styles.modalOptionTextSelected]}>{t(mode)}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', // 앱 배경색 통일
  },
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F0FE', // Primary color 연한 버전
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF', // Primary color
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666666',
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888888',
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
  },
  menuTitle: {
    fontSize: 16,
    color: '#333333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 40,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#E8F0FE', // 선택된 항목의 배경색
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOptionTextSelected: {
    color: '#007BFF', // 선택된 항목의 글자색
    fontWeight: 'bold',
  },
});

export default MyPageScreen;