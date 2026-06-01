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
  { id: '1', type: 'SCHEDULE', title: ' 대타 요청 알림', message: '5월 28일 수요일 17:00~22:00 대타 요청이 있습니다. 앱에서 확인 후 지원해주세요!', createdAt: '10분 전', isRead: false },
  { id: '2', type: 'NOTICE', title: '📢 [공지] 가을 시즌 신메뉴 출시', message: '가을 시즌 신메뉴가 곧 출시됩니다!\n\n게시판에서 레시피 및 상세 매뉴얼을 꼭 확인해 주세요.', createdAt: '1시간 전', isRead: false },
  { id: '3', type: 'SYSTEM', title: '🏥 보건증 만료 임박', message: '보건증 만료일이 7일 남았습니다.\n보건소 방문 후 마이페이지에서 새 이미지를 업로드해주세요.', createdAt: '어제', isRead: true },
  { id: '4', type: 'SCHEDULE', title: '✅ 휴무 승인 완료', message: '요청하신 6/3(수) 휴무 신청이 승인되어 스케줄에 반영되었습니다.', createdAt: '2일 전', isRead: true },
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

  // ✅ 모든 알림 읽음 처리
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(noti => ({ ...noti, isRead: true })));
  };

  // ✅ 알림 삭제 처리
  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(noti => noti.id !== id));
    closeModal();
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
        <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.6}>
          <Text style={styles.markAllText}>모두 읽음</Text>
        </TouchableOpacity>
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
                  <Text style={styles.modalIcon}>
                    {selectedNotification.type === 'SCHEDULE' ? '📅' : selectedNotification.type === 'NOTICE' ? '📢' : '⚙️'}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.modalTime}>{selectedNotification.createdAt}</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                </View>
                
                {/* 하단 버튼 그룹 (삭제 / 확인) */}
                <View style={styles.modalButtonGroup}>
                  <Pressable 
                    style={styles.deleteButton} 
                    onPress={() => handleDeleteNotification(selectedNotification.id)}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </Pressable>
                  <Pressable style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>확인</Text>
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

// 스타일 시트는 이전과 동일합니다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', backgroundColor: '#FFFFFF' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  markAllText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  listContent: { paddingVertical: 10 },
  notificationItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', backgroundColor: '#FFFFFF' },
  unreadBackground: { backgroundColor: '#F0F8FF' },
  contentContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  titleText: { fontSize: 15, fontWeight: '600', color: '#555555', flex: 1, marginRight: 10 },
  unreadTitleText: { color: '#000000', fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  messageText: { fontSize: 14, color: '#777777', lineHeight: 20, marginBottom: 8 },
  timeText: { fontSize: 12, color: '#AAAAAA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 16, marginBottom: 16 },
  modalIcon: { fontSize: 32, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalTime: { fontSize: 12, color: '#888' },
  modalBody: { minHeight: 80, marginBottom: 24 },
  modalMessage: { fontSize: 15, lineHeight: 24, color: '#444' },
  modalButtonGroup: { flexDirection: 'row', gap: 12 },
  deleteButton: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#DC2626', fontSize: 15, fontWeight: 'bold' },
  closeButton: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default NotificationListScreen;
