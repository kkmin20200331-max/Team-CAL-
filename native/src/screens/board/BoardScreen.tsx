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
  const { t, language } = useLanguage();

  const parseJSON = useCallback((str: string) => {
    try {
      if (str && str.startsWith('{') && str.endsWith('}')) {
        const obj = JSON.parse(str);
        if (obj.ko !== undefined || obj.en !== undefined || obj.ja !== undefined) {
          return {
            ko: obj.ko || '',
            en: obj.en || '',
            ja: obj.ja || ''
          };
        }
      }
    } catch {}
    return {
      ko: str || '',
      en: str || '',
      ja: str || ''
    };
  }, []);

  const displayTitle = useCallback((rawTitle: string) => {
    const parsed = parseJSON(rawTitle);
    const langCode = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';
    return parsed[langCode] || parsed.ko || rawTitle;
  }, [language, parseJSON]);

  const translateBoardName = useCallback((name: string) => {
    if (!name) return '';
    const upper = name.toUpperCase();
    if (upper === 'ALL') return t('boardTabAll');
    if (upper === 'NOTICE' || name === '공지사항') return t('boardTabNotice');
    if (upper === 'MENU' || name === '건의사항') return t('boardTabMenu');
    if (upper === 'EVENT' || name === '자유게시판') return t('boardTabEvent');
    if (upper === 'MANUAL' || name === '매뉴얼' || name === '메뉴얼') return t('boardTabManual');
    if (upper === 'LOST' || name === '분실물' || name === '분실물 관리' || name === '분실물 공유') return t('boardTabLost');
    if (upper === 'CHECKLIST' || name === '체크리스트') return t('boardTabChecklist');
    if (name === '프로모션/이벤트' || name === '프로모션' || name === '이벤트' || upper === 'PROMOTION') return t('boardTabPromotion');
    if (name === '업무지시' || name === '업무 지시' || upper === 'WORKORDER') return t('boardTabWorkOrder');
    return name;
  }, [t]);

  const matchCategory = useCallback((postCategory: string, activeCategory: string) => {
    if (activeCategory === 'ALL') return true;

    const getDbName = (cat: string) => {
      const upper = cat.toUpperCase();
      if (upper === 'NOTICE' || cat === '공지사항') return '공지사항';
      if (upper === 'MENU' || cat === '건의사항') return '건의사항';
      if (upper === 'EVENT' || cat === '자유게시판') return '자유게시판';
      if (upper === 'MANUAL' || cat === '매뉴얼' || cat === '메뉴얼') return '매뉴얼';
      if (upper === 'LOST' || cat === '분실물' || cat === '분실물 관리') return '분실물';
      if (upper === 'CHECKLIST' || cat === '체크리스트') return '체크리스트';
      return cat;
    };

    return getDbName(postCategory).toUpperCase() === getDbName(activeCategory).toUpperCase();
  }, []);

  const CATEGORIES = React.useMemo(() => {
    const list = [
      { id: 'ALL', label: translateBoardName('ALL') },
      { id: 'NOTICE', label: translateBoardName('NOTICE') },
      { id: 'MENU', label: translateBoardName('MENU') },
      { id: 'EVENT', label: translateBoardName('EVENT') },
      { id: 'MANUAL', label: translateBoardName('MANUAL') },
      { id: 'LOST', label: translateBoardName('LOST') },
      { id: 'CHECKLIST', label: translateBoardName('CHECKLIST') },
    ];

    const predefinedKeys = ['NOTICE', 'MENU', 'EVENT', 'MANUAL', 'LOST', 'CHECKLIST', '공지사항', '건의사항', '자유게시판', '매뉴얼', '분실물', '체크리스트', '공지', '건의'];
    boards.forEach((board) => {
      const upperName = board.name.toUpperCase();
      if (!predefinedKeys.includes(upperName)) {
        if (!list.some((item) => item.id === board.name)) {
          list.push({ id: board.name, label: translateBoardName(board.name) });
        }
      }
    });

    return list;
  }, [boards, translateBoardName]);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [savingBoard, setSavingBoard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const activeBoard = boards.find((board) =>
    matchCategory(board.name, activeCategory)
  );

  const handleCreateBoard = useCallback(async () => {
    const name = boardNameInput.trim();
    if (!name) {
      Alert.alert(t('inputError') || '입력 오류', t('enterTabName') || '탭 이름을 입력해주세요.');
      return;
    }

    if (!storeId || !userInfo?.id) {
      Alert.alert(t('error') || '추가 실패', t('noStoreOrUserInfo') || '매장 또는 사용자 정보가 없습니다.');
      return;
    }

    setSavingBoard(true);
    try {
      const board = await createBoard(name, storeId, userInfo.id);
      setActiveCategory(board.name);
      setBoardNameInput('');
      setShowBoardModal(false);
    } catch {
      Alert.alert(t('error') || '추가 실패', t('failedToAddTab') || '탭 추가 중 오류가 발생했습니다.');
    } finally {
      setSavingBoard(false);
    }
  }, [boardNameInput, createBoard, storeId, userInfo?.id, t]);

  const handleDeleteBoard = useCallback((boardId: string, boardName: string) => {
    Alert.alert(
      t('deleteConfirmTitle') || '탭 삭제',
      t('confirmDeleteTab').replace('{name}', translateBoardName(boardName)),
      [
        { text: t('cancel') || '취소', style: 'cancel' },
        {
          text: t('delete') || '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBoard(boardId, storeId);
              setActiveCategory('ALL');
            } catch (error: any) {
              Alert.alert(
                t('error') || '삭제 실패',
                error?.response?.data?.message || t('failedToDeleteTab') || '탭 삭제 중 오류가 발생했습니다.',
              );
            }
          },
        },
      ],
    );
  }, [deleteBoard, storeId, translateBoardName, t]);

  const filteredPosts = posts
    .filter((post) => activeCategory === 'ALL' || matchCategory(post.category, activeCategory))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date.replace(/\./g, '-')).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date.replace(/\./g, '-')).getTime();
      return bTime - aTime;
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
              {translateBoardName(item.category)}
            </Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>
          {displayTitle(item.title)}
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
        <Text style={styles.headerTitle}>{t('board')}</Text>
        {userInfo?.role === 'ADMIN' ? (
          <TouchableOpacity onPress={() => setShowBoardModal(true)} style={styles.headerAction}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
              {activeCategory === category.id && category.id !== 'ALL' && activeBoard && userInfo?.role === 'ADMIN' && (
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
            <Text style={styles.emptyText}>{t('noNotices')}</Text>
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
              <Text style={styles.modalTitle}>{t('addTab')}</Text>
              <TouchableOpacity onPress={() => setShowBoardModal(false)}>
                <Ionicons name="close" size={22} color={colors.subText} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder={t('tabNamePlaceholder')}
              value={boardNameInput}
              onChangeText={setBoardNameInput}
              placeholderTextColor={colors.subText}
              returnKeyType="done"
              onSubmitEditing={handleCreateBoard}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowBoardModal(false)}>
                <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, savingBoard && { opacity: 0.6 }]}
                onPress={handleCreateBoard}
                disabled={savingBoard}
              >
                <Text style={styles.modalButtonText}>{savingBoard ? t('adding') : t('add')}</Text>
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
