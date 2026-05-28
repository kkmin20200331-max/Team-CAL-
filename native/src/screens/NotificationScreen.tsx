import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Modal, Pressable } from 'react-native';

interface NotificationItem {
  id: string;
  type: 'SCHEDULE' | 'SYSTEM' | 'NOTICE';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// 기존 데이터를 초기값용 배열로 변경
const initialNotifications: NotificationItem[] = [
  { id: '1', type: 'SCHEDULE', title: '📅 스케줄 변경 알림', message: '다음 주 월요일(5/25) 근무 시간이 09:00 -> 10:00로 변경되었습니다.', createdAt: '5분 전', isRead: false },
  { id: '2', type: 'NOTICE', title: '📢 [공지] 시스템 점검 안내', message: '금일 새벽 02:00 ~ 04:00 서버 점검이 예정되어 있습니다.\n\n점검 시간 동안은 서비스 접속이 원활하지 않을 수 있으니 양해 부탁드립니다.', createdAt: '1시간 전', isRead: false },
  { id: '3', type: 'SYSTEM', title: '🔒 비밀번호 변경 권장', message: '개인정보 보호를 위해 비밀번호를 변경한 지 3개월이 지났습니다.', createdAt: '어제', isRead: true },
  { id: '4', type: 'SCHEDULE', title: '✅ 휴가 승인 완료', message: '요청하신 6/1(월) ~ 6/2(화) 연차 휴가가 승인되었습니다.', createdAt: '2일 전', isRead: true },
];

const NotificationListScreen = () => {
  // 1. 알림 리스트를 상태(State)로 전환하여 변경 가능하게 만듭니다.
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // 알림 클릭 시 실행
  const handlePressNotification = (item: NotificationItem) => {
    setSelectedNotification(item);
    setModalVisible(true);
    
    // 🔥 [핵심 추가] 클릭한 알림의 id와 일치하는 아이템만 isRead를 true로 변경합니다.
    setNotifications(prevNotifications => 
      prevNotifications.map(noti => 
        noti.id === item.id ? { ...noti, isRead: true } : noti
      )
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.isRead && styles.unreadBackground]}
      onPress={() => handlePressNotification(item)}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleText, !item.isRead && styles.unreadTitleText]}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timeText}>{item.createdAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>알림 목록</Text>
      </View>

      {/* 2. 고정 더미 대신 상태(notifications) 데이터를 연결합니다. */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
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
                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.modalTime}>{selectedNotification.createdAt}</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                </View>
                <Pressable style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>확인</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// 스타일 시트는 이전과 동일합니다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', alignItems: 'center' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#333333' },
  listContent: { paddingVertical: 10 },
  notificationItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', backgroundColor: '#FFFFFF' },
  unreadBackground: { backgroundColor: '#F0F8FF' },
  contentContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  titleText: { fontSize: 15, fontWeight: '600', color: '#555555', flex: 1, marginRight: 10 },
  unreadTitleText: { color: '#000000', fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007BFF' },
  messageText: { fontSize: 14, color: '#777777', lineHeight: 20, marginBottom: 8 },
  timeText: { fontSize: 12, color: '#AAAAAA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalTime: { fontSize: 12, color: '#888' },
  modalBody: { minHeight: 80, marginBottom: 24 },
  modalMessage: { fontSize: 15, lineHeight: 24, color: '#444' },
  closeButton: { backgroundColor: '#007BFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default NotificationListScreen;
