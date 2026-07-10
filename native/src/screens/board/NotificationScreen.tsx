import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { NotificationContext, NotificationItem } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 테마 Context 추가
import Swipeable from 'react-native-gesture-handler/Swipeable'; // ✅ 스와이프 기능 추가
import { markAllNotificationsAsReadAPI, markNotificationAsReadAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';

const translateNotificationText = (text: string, language: string): string => {
  if (!text) return '';
  const langCode = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';

  // 1. Static Title Translations
  const titles: Record<string, Record<string, string>> = {
    '대타 요청 알림': {
      ko: '대타 요청 알림',
      en: 'Substitute Request Alert',
      ja: '代替要請通知',
    },
    '주급 신청 요청': {
      ko: '주급 신청 요청',
      en: 'Weekly Payroll Request',
      ja: '週給申請リクエスト',
    },
    '근무 지점 승인 완료': {
      ko: '근무 지점 승인 완료',
      en: 'Store Approval Completed',
      ja: '勤務店舗承認完了',
    },
    '근무 지점 요청 거절': {
      ko: '근무 지점 요청 거절',
      en: 'Store Request Rejected',
      ja: '勤務店舗要請却下',
    },
    '직원 근무 요청': {
      ko: '직원 근무 요청',
      en: 'Staff duty request',
      ja: 'スタッフ勤務申請',
    },
    '휴무 신청 승인': {
      ko: '휴무 신청 승인',
      en: 'Leave Request Approved',
      ja: '公休申請承認',
    },
    '휴무 신청 거절': {
      ko: '휴무 신청 거절',
      en: 'Leave Request Rejected',
      ja: '公休申請却下',
    },
  };

  if (titles[text]) {
    return titles[text][langCode] || text;
  }

  // 2. Dynamic Match 1: (YYYY-MM-DD) 대타 근무 가능 여부를 확인해주세요. (reason)
  const matchSub = text.match(/^(\d{4}-\d{2}-\d{2})\s+대타 근무 가능 여부를 확인해주세요\.\s*\((.*)\)$/);
  if (matchSub) {
    const date = matchSub[1];
    const reason = matchSub[2];
    if (langCode === 'ja') {
      return `${date}の代替勤務が可能かご確認ください。(${reason})`;
    } else if (langCode === 'en') {
      return `Please check if you can cover the substitute shift on ${date}. (${reason})`;
    } else {
      return text;
    }
  }

  // 3. Dynamic Match 2: (user_id/name)님이 (date) ~ (date) 주급 신청을 요청했습니다.
  const matchPayroll = text.match(/^(.*)님이\s+(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s+주급\s*신청을\s*요청했습니다\.$/);
  if (matchPayroll) {
    const name = matchPayroll[1];
    const start = matchPayroll[2];
    const end = matchPayroll[3];
    if (langCode === 'ja') {
      return `${name}さんが${start} ~ ${end}の週給申請을リクエストしました。`;
    } else if (langCode === 'en') {
      return `${name} requested weekly payroll for ${start} ~ ${end}.`;
    } else {
      return text;
    }
  }

  // 4. Dynamic Match 3: (user_id/name)님이 매장 근무를 요청했습니다.
  const matchStore = text.match(/^(.*)님이\s+매장\s+근무를\s+요청했습니다\.$/);
  if (matchStore) {
    const name = matchStore[1];
    if (langCode === 'ja') {
      return `${name}さんが店舗勤務を申請しました。`;
    } else if (langCode === 'en') {
      return `${name} requested to join the store.`;
    } else {
      return text;
    }
  }

  // 5. Static Message Translations
  const messages: Record<string, Record<string, string>> = {
    '매장 근무 요청이 승인되었습니다. 모바일 앱에서 근무 지점에 접속할 수 있습니다.': {
      ko: '매장 근무 요청이 승인되었습니다. 모바일 앱에서 근무 지점에 접속할 수 있습니다.',
      en: 'Your store join request has been approved. You can now access the store in the mobile app.',
      ja: '店舗勤務申請が承認されました。モバイルアプリから勤務店舗にアクセスできます。',
    },
    '매장 근무 요청이 거절되었습니다.': {
      ko: '매장 근무 요청이 거절되었습니다.',
      en: 'Your store join request has been rejected.',
      ja: '店舗勤務申請が却下されました。',
    },
    '휴무 신청이 승인되었습니다.': {
      ko: '휴무 신청이 승인되었습니다.',
      en: 'Your leave request has been approved.',
      ja: '公休申請が承認されました。',
    },
    '휴무 신청이 거절되었습니다.': {
      ko: '휴무 신청이 거절되었습니다.',
      en: 'Your leave request has been rejected.',
      ja: '公休申請が却下されました。',
    },
  };

  if (messages[text]) {
    return messages[text][langCode] || text;
  }

  return text;
};

const NotificationListScreen = () => {
  const isFocused = useIsFocused();
  // ✅ 1. 알림 데이터를 나홀로 상태가 아닌 전역 상태(Context)에서 가져옵니다.
  const { notifications, setNotifications, refreshNotifications } = useContext(NotificationContext);
  const { userInfo } = useApp();

  useEffect(() => {
    if (isFocused && userInfo?.id) {
      refreshNotifications();
    }
  }, [isFocused, userInfo?.id, refreshNotifications]);
  
  // ✅ 전역 언어 설정 가져오기
  const { t, language } = useLanguage();

  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // 알림 클릭 시 실행
  const handlePressNotification = async (item: NotificationItem) => {
    setSelectedNotification(item);
    setModalVisible(true);
    markNotificationAsReadAPI(item.id).catch((error) => {
      console.error('알림 읽음 처리 오류:', error);
    });
    
    // 🔥 [핵심 추가] 클릭한 알림의 id와 일치하는 아이템만 isRead를 true로 변경합니다.
    setNotifications((prevNotifications: NotificationItem[]) => 
      prevNotifications.map((noti: NotificationItem) => 
        noti.id === item.id ? { ...noti, isRead: true } : noti
      )
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // ✅ 모든 알림 읽음 처리
  const handleMarkAllAsRead = () => {
    if (userInfo?.id) {
      markAllNotificationsAsReadAPI(userInfo.id).catch((error) => {
        console.error('전체 알림 읽음 처리 오류:', error);
      });
    }
    setNotifications((prev: NotificationItem[]) => prev.map((noti: NotificationItem) => ({ ...noti, isRead: true })));
  };

  // ✅ 알림 삭제 처리
  const handleDeleteNotification = (id: string) => {
    setNotifications((prev: NotificationItem[]) => prev.filter((noti: NotificationItem) => noti.id !== id));
    closeModal();
  };

  // ✅ 당겨서 새로고침 상태 및 핸들러 추가
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('알림 새로고침 오류:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  // ✅ 스와이프했을 때 나타날 오른쪽 [삭제] 버튼 UI
  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => handleDeleteNotification(id)}
      >
        <Text style={styles.deleteActionText}>{t('delete')}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
      <TouchableOpacity 
        style={[styles.notificationItem, !item.isRead && styles.unreadBackground]}
        onPress={() => handlePressNotification(item)}
        activeOpacity={1}
      >
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, !item.isRead && styles.unreadTitleText]}>
              {translateNotificationText(item.title, language)}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {translateNotificationText(item.message, language)}
          </Text>
          <Text style={styles.timeText}>{t(item.createdAt) === item.createdAt ? item.createdAt : t(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('notifListTitle')}</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.6}>
          <Text style={styles.markAllText}>{t('markAllRead')}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 고정 더미 대신 상태(notifications) 데이터를 연결합니다. */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        // ✅ FlatList에 RefreshControl 속성 추가
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>
                    {selectedNotification.type === 'SCHEDULE' ? '📅' : selectedNotification.type === 'NOTICE' ? '📢' : '⚙️'}
                  </Text>
                  <Text style={styles.modalTitle}>{translateNotificationText(selectedNotification.title, language)}</Text>
                  <Text style={styles.modalTime}>{t(selectedNotification.createdAt) === selectedNotification.createdAt ? selectedNotification.createdAt : t(selectedNotification.createdAt)}</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>{translateNotificationText(selectedNotification.message, language)}</Text>
                </View>
                
                {/* 하단 버튼 그룹 (삭제 / 확인) */}
                <View style={styles.modalButtonGroup}>
                  <Pressable 
                    style={styles.deleteButton} 
                    onPress={() => handleDeleteNotification(selectedNotification.id)}
                  >
                    <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                  </Pressable>
                  <Pressable style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>{t('confirm')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ✅ 테마 색상을 인자로 받아 동적으로 스타일을 생성하도록 변경
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.primaryLight, backgroundColor: colors.card },
  headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  markAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  listContent: { paddingVertical: 10 },
  notificationItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  unreadBackground: { backgroundColor: isDarkMode ? '#1E293B' : '#F0F8FF' }, // 다크 모드일 땐 어두운 남색
  contentContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  titleText: { fontSize: 15, fontWeight: '600', color: colors.subText, flex: 1, marginRight: 10 },
  unreadTitleText: { color: colors.text, fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  messageText: { fontSize: 14, color: colors.subText, lineHeight: 20, marginBottom: 8 },
  timeText: { fontSize: 12, color: colors.subText },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: colors.modalBg, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, marginBottom: 16 },
  modalIcon: { fontSize: 32, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  modalTime: { fontSize: 12, color: colors.subText },
  modalBody: { minHeight: 80, marginBottom: 24 },
  modalMessage: { fontSize: 15, lineHeight: 24, color: colors.text },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  deleteButton: { flex: 1, backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: isDarkMode ? '#FECACA' : '#DC2626', fontSize: 15, fontWeight: 'bold' },
  closeButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // --- 스와이프 삭제 액션 스타일 ---
  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 80 },
  deleteActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});

export default NotificationListScreen;
