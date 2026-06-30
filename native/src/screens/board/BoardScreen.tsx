import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons'; // ✅ Ionicons 임포트
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../types/Post';

type Props = {
  navigation: any;
  route: {
    params?: {
      postToOpenId?: string;
    };
  };
};

const BoardScreen = ({ route, navigation }: Props) => {
  const { userInfo } = useApp();
  const { posts, boards, loading, loadPosts, createBoard, deleteBoard } = useBoard();
  const { postToOpenId } = route.params || {};
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const CATEGORIES = React.useMemo(() => {
    const list = [
      { id: 'ALL', label: '전체' },
      { id: 'NOTICE', label: '공지사항' },
      { id: 'MENU', label: '건의사항' },
      { id: 'EVENT', label: '자유게시판' },
      { id: 'MANUAL', label: '매뉴얼' },
      { id: 'LOST', label: '분실물' },
      { id: 'CHECKLIST', label: '체크리스트' },
    ];

    const predefinedKeys = ['NOTICE', 'MENU', 'EVENT', 'MANUAL', 'LOST', 'CHECKLIST', '공지사항', '건의사항', '자유게시판', '매뉴얼', '분실물', '체크리스트', '공지', '건의'];
    boards.forEach((board) => {
      const upperName = board.name.toUpperCase();
      if (!predefinedKeys.includes(upperName)) {
        if (!list.some((item) => item.id === board.name)) {
          list.push({ id: board.name, label: board.name });
        }
      }
    });

    return list;
  }, [boards]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [savingBoard, setSavingBoard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const refreshPosts = useCallback(async () => {
    if (storeId) {
      await loadPosts(storeId);
    }
  }, [loadPosts, storeId]);

  useFocusEffect(
    useCallback(() => {
      refreshPosts();
    }, [refreshPosts]),
  );

  useEffect(() => {
    if (postToOpenId) {
      navigation.navigate('BoardDetail', { postId: postToOpenId });
    }
  }, [navigation, postToOpenId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const activeBoard = boards.find(
    (board) => board.name.toUpperCase() === activeCategory.toUpperCase(),
  );

  const handleCreateBoard = useCallback(async () => {
    const name = boardNameInput.trim();
    if (!name) {
      Alert.alert('입력 오류', '탭 이름을 입력해주세요.');
      return;
    }

    if (!storeId || !userInfo?.id) {
      Alert.alert('추가 실패', '매장 또는 사용자 정보가 없습니다.');
      return;
    }

    setSavingBoard(true);
    try {
      const board = await createBoard(name, storeId, userInfo.id);
      setActiveCategory(board.name);
      setBoardNameInput('');
      setShowBoardModal(false);
    } catch {
      Alert.alert('추가 실패', '탭 추가 중 오류가 발생했습니다.');
    } finally {
      setSavingBoard(false);
    }
  }, [boardNameInput, createBoard, storeId, userInfo?.id]);

  const handleDeleteBoard = useCallback((boardId: string, boardName: string) => {
    Alert.alert(
      '탭 삭제',
      `'${boardName}' 탭을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBoard(boardId, storeId);
              setActiveCategory('ALL');
            } catch (error: any) {
              Alert.alert(
                '삭제 실패',
                error?.response?.data?.message || '탭 삭제 중 오류가 발생했습니다.',
              );
            }
          },
        },
      ],
    );
  }, [deleteBoard, storeId]);

  const filteredPosts = posts
    .filter((post) => activeCategory === 'ALL' || post.category === activeCategory)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.noticeItem}
      onPress={() => navigation.navigate('BoardDetail', { postId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.noticeTextContainer}>
        {item.isPinned && (
          <Ionicons name="pin" size={16} color={colors.primary} style={styles.pinIcon} />
        )}
        {activeCategory === 'ALL' && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {CATEGORIES.find((category) => category.id === item.category)?.label || '공지'}
            </Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.badge && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t(item.badge)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.noticeDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시판</Text>
        <TouchableOpacity onPress={() => setShowBoardModal(true)} style={styles.headerAction}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.tabButton, activeCategory === category.id && styles.tabButtonActive]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text style={[styles.tabText, activeCategory === category.id && styles.tabTextActive]}>
                {category.label}
              </Text>
              {activeCategory === category.id && category.id !== 'ALL' && activeBoard && (
                <TouchableOpacity
                  onPress={() => handleDeleteBoard(activeBoard.id, activeBoard.name)}
                  style={styles.tabDeleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={13} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.listDivider} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>등록된 게시글이 없습니다.</Text>
          )
        }
      />

      <Modal
        visible={showBoardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBoardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>탭 추가</Text>
              <TouchableOpacity onPress={() => setShowBoardModal(false)}>
                <Ionicons name="close" size={22} color={colors.subText} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 업무 지시"
              value={boardNameInput}
              onChangeText={setBoardNameInput}
              placeholderTextColor={colors.subText}
              returnKeyType="done"
              onSubmitEditing={handleCreateBoard}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowBoardModal(false)}>
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, savingBoard && { opacity: 0.6 }]}
                onPress={handleCreateBoard}
                disabled={savingBoard}
              >
                <Text style={styles.modalButtonText}>{savingBoard ? '추가 중...' : '추가'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('BoardWrite', { isEdit: false })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: { padding: 4, width: 40, justifyContent: 'center' },
  headerAction: { padding: 4, width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  tabScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabDeleteButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexGrow: 1,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  noticeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  pinIcon: {
    marginRight: 6,
  },
  categoryBadge: {
    backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    color: isDarkMode ? '#D1D5DB' : '#4B5563',
    fontSize: 10,
    fontWeight: '700',
  },
  noticeItemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
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
    color: colors.subText,
  },
  listDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyText: {
    marginTop: 48,
    textAlign: 'center',
    color: colors.subText,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    backgroundColor: colors.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalCancelButtonText: {
    color: colors.subText,
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default BoardScreen;
