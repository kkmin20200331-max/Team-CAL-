import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Modal, ScrollView } from 'react-native';

const BoardScreen = ({ navigation }: any) => {
  // 모달 상태 관리
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // 전체 게시글 더미 데이터 (대시보드보다 개수가 많습니다)
  const allPosts = [
    { id: '1', title: '가을 시즌 신메뉴 출시 안내', date: '2026.08.25', content: '가을 시즌 신메뉴가 곧 출시됩니다!\n\n레시피 및 상세 매뉴얼은 추후 관리자가 업로드 할 예정이니 꼭 확인해 주세요.', badge: 'NEW' },
    { id: '2', title: '보건증 만료 재확인 요청', date: '2026.05.28', content: '안녕하세요, 점주입니다.\n\n최근 보건증 만료일이 도래하는 직원분들이 많습니다. 각자 마이페이지에서 보건증 유효기간을 확인하시고, 만료 전 반드시 보건소에 방문하시어 갱신해 주시기 바랍니다.', badge: null },
    { id: '3', title: '김선민 CAL 입사 경축', date: '2026.09.20', content: '새로운 팀원 김선민님이 CAL에 합류하셨습니다!\n모두 반갑게 인사하며 따뜻한 환영 부탁드립니다. 🎉', badge: '중요!' },
    { id: '4', title: '마감 청소 매뉴얼 변경 안내', date: '2026.05.10', content: '마감 청소 매뉴얼이 일부 변경되었습니다.\n자세한 내용은 포스기 옆에 부착된 새 매뉴얼을 확인해 주세요.', badge: null },
    { id: '5', title: '5월 우수 직원 선정 안내', date: '2026.05.01', content: '5월 우수 직원으로 김민수 님이 선정되었습니다!\n김민수 님께는 소정의 상품이 지급될 예정입니다. 축하합니다.', badge: null },
    { id: '6', title: '여름 시즌 하계 유니폼 신청', date: '2026.04.15', content: '여름 시즌을 맞아 반팔 유니폼을 추가 신청 받습니다.\n필요하신 분들은 이번 주 금요일까지 사이즈를 매니저에게 전달해 주세요.', badge: null },
  ];

  const handleOpenPost = (post: any) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(item)} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        <Text style={styles.noticeItemTitle} numberOfLines={1}>{item.title}</Text>
        {item.badge && (
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>{item.badge}</Text></View>
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
        <Text style={styles.headerTitle}>사내 게시판</Text>
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
                <Text style={styles.postModalTitle}>{selectedPost.title}</Text>
                <Text style={styles.postModalDate}>{selectedPost.date}</Text>
                <View style={styles.postModalDivider} />
                <ScrollView style={styles.postModalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postModalText}>{selectedPost.content}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeModalButton} onPress={() => setPostModalVisible(false)}>
                  <Text style={styles.closeModalButtonText}>닫기</Text>
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