import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Modal, ScrollView } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

const BoardScreen = ({ navigation }: any) => {
  // 모달 상태 관리
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

  // 전체 게시글 더미 데이터 (대시보드보다 개수가 많습니다)
  const allPosts = [
    { id: '1', title: 'boardDummy1Title', date: '2026.08.25', content: 'boardDummy1Content', badge: 'badgeNew' },
    { id: '2', title: 'boardDummy2Title', date: '2026.05.28', content: 'boardDummy2Content', badge: null },
    { id: '3', title: 'boardDummy3Title', date: '2026.09.20', content: 'boardDummy3Content', badge: 'badgeImportant' },
    { id: '4', title: 'boardDummy4Title', date: '2026.05.10', content: 'boardDummy4Content', badge: null },
    { id: '5', title: 'boardDummy5Title', date: '2026.05.01', content: 'boardDummy5Content', badge: null },
    { id: '6', title: 'boardDummy6Title', date: '2026.04.15', content: 'boardDummy6Content', badge: null },
  ];

  const handleOpenPost = (post: any) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(item)} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        <Text style={styles.noticeItemTitle} numberOfLines={1}>{t(item.title)}</Text>
        {item.badge && (
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>{t(item.badge)}</Text></View>
        )}
      </View>
      <Text style={styles.noticeDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notice')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 게시글 목록 */}
      <FlatList
        data={allPosts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.listDivider} />}
      />

      {/* 게시글 상세 보기 팝업(모달) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postModalContent}>
            {selectedPost && (
              <>
                <Text style={styles.postModalTitle}>{t(selectedPost.title)}</Text>
                <Text style={styles.postModalDate}>{selectedPost.date}</Text>
                <View style={styles.postModalDivider} />
                <ScrollView style={styles.postModalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postModalText}>{t(selectedPost.content)}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeModalButton} onPress={() => setPostModalVisible(false)}>
                  <Text style={styles.closeModalButtonText}>{t('close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF'
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18, // 대시보드보다 조금 더 넓은 여백
  },
  noticeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  noticeItemTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  noticeDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  listDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // --- 게시글 상세 모달 스타일 (대시보드와 동일) ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  postModalContent: { width: '85%', maxHeight: '70%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  postModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  postModalDate: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  postModalDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  postModalBody: { marginBottom: 20 },
  postModalText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  closeModalButton: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
});

export default BoardScreen;