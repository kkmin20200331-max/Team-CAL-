import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationContext, NotificationItem } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const NotificationListScreen = () => {
  const { notifications, setNotifications } = useContext(NotificationContext);
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const handlePressNotification = (item: NotificationItem) => {
    setSelectedNotification(item);
    setModalVisible(true);
    
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

  const handleMarkAllAsRead = () => {
    setNotifications((prev: NotificationItem[]) => prev.map((noti: NotificationItem) => ({ ...noti, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev: NotificationItem[]) => prev.filter((noti: NotificationItem) => noti.id !== id));
    closeModal();
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
              {t(item.title as any)}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{item.createdAt}</Text>
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

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
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
                  <Text style={styles.modalTitle}>{t(selectedNotification.title as any)}</Text>
                  <Text style={styles.modalTime}>{selectedNotification.createdAt}</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                </View>
                
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

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  headerText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  markAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  listContent: { paddingVertical: 10 },
  notificationItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  unreadBackground: { backgroundColor: colors.primaryLight },
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
  deleteButton: { flex: 1, backgroundColor: colors.redLight, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: colors.red, fontSize: 15, fontWeight: 'bold' },
  closeButton: { flex: 1, backgroundColor: colors.blue, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },

  deleteAction: { backgroundColor: colors.red, justifyContent: 'center', alignItems: 'center', width: 80 },
  deleteActionText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
});

export default NotificationListScreen;