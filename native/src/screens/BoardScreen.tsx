import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

const BoardScreen = ({ navigation }: any) => {
  // 모달 상태 관리
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  // ✅ 현재 선택된 카테고리 탭 상태 (기본값: 'ALL')
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // ✅ 전역 언어 설정 가져오기
  const { t } = useLanguage();

  // ✅ 카테고리 탭 목록 정의
  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  // ✅ 전체 게시글 더미 데이터 (각 데이터에 category 속성 추가)
  const allPosts = [
    { id: '1', category: 'MENU', title: 'boardDummy1Title', date: '2026.08.25', content: 'boardDummy1Content', badge: 'badgeNew' },
    { id: '2', category: 'NOTICE', title: 'boardDummy2Title', date: '2026.05.28', content: 'boardDummy2Content', badge: null },
    { id: '3', category: 'NOTICE', title: 'boardDummy3Title', date: '2026.09.20', content: 'boardDummy3Content', badge: 'badgeImportant' },
    { id: '4', category: 'MANUAL', title: 'boardDummy4Title', date: '2026.05.10', content: 'boardDummy4Content', badge: null },
    { id: '5', category: 'EVENT', title: 'boardDummy5Title', date: '2026.05.01', content: 'boardDummy5Content', badge: null },
    { id: '6', category: 'NOTICE', title: 'boardDummy6Title', date: '2026.04.15', content: 'boardDummy6Content', badge: null },
  ];

  // ✅ 최신 날짜 순(내림차순)으로 정렬
  // ✅ 선택된 카테고리에 맞게 필터링 추가
  const filteredPosts = allPosts
    .filter(post => activeCategory === 'ALL' || post.category === activeCategory)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleOpenPost = (post: any) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(item)} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        {/* 카테고리 태그 추가 (전체 보기일 때만 표시) */}
        {activeCategory === 'ALL' && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === item.category)?.label || 'boardTabNotice')}</Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>
          {/* 카테고리가 텍스트 자리를 차지하므로 줄임 길이 조정 */}
          {t(item.title).length > (activeCategory === 'ALL' ? 14 : 18) ? t(item.title).substring(0, (activeCategory === 'ALL' ? 14 : 18)) + '..' : t(item.title)}
        </Text>
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

      {/* ✅ 카테고리 탭 영역 (가로 스크롤) */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {CATEGORIES.map(category => (
            <TouchableOpacity 
              key={category.id} 
              style={[styles.tabButton, activeCategory === category.id && styles.tabButtonActive]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text style={[styles.tabText, activeCategory === category.id && styles.tabTextActive]}>{t(category.label)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 게시글 목록 */}
      <FlatList
        data={filteredPosts}
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
  
  // --- 카테고리 탭 스타일 ---
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tabScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

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
  categoryBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '700',
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
  postModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  postModalDate: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  postModalDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  postModalBody: { marginBottom: 20 },
  postModalText: { fontSize: 17, color: '#374151', lineHeight: 26 },
  closeModalButton: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
});

export default BoardScreen;