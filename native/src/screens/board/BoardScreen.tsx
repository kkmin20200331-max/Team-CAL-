import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { Post } from '../../types/Post';
import { User } from '../../types/User'; // User 타입 임포트

type BoardScreenNavigationProp = any; // StackNavigationProp<any, 'Board'>;

type Props = {
  navigation: BoardScreenNavigationProp;
  route: {
    params?: {
      userInfo?: User | null;
      postToOpen?: Post;
      // ✅ [추가] DashboardScreen으로부터 전달받을 고정 상태 업데이트 함수 타입 정의
      updateDashboardPostPinStatus?: (postId: string, isPinned: boolean) => void;
    };
  };
};

const BoardScreen = ({ route, navigation }: Props) => {
  // ✅ [수정] route.params에서 updateDashboardPostPinStatus를 가져옵니다.
  const { userInfo, postToOpen, updateDashboardPostPinStatus } = route.params || {};
  const currentUserId = userInfo?.username || 'my_test_id';
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  const [allPosts, setAllPosts] = useState<Post[]>([
    { id: '3', authorId: currentUserId, category: 'NOTICE', title: 'boardDummy3Title', date: '2026.09.20', content: 'boardDummy3Content', badge: 'badgeImportant', isPinned: true },
    { id: '1', authorId: currentUserId, category: 'MENU', title: 'boardDummy1Title', date: '2026.08.25', content: 'boardDummy1Content', badge: 'badgeNew', isPinned: false },
    { id: '2', authorId: currentUserId, category: 'NOTICE', title: 'boardDummy2Title', date: '2026.05.28', content: 'boardDummy2Content', badge: null, isPinned: false },
    { id: '4', authorId: 'admin', category: 'MANUAL', title: 'boardDummy4Title', date: '2026.05.10', content: 'boardDummy4Content', badge: null, isPinned: false },
    { id: '5', authorId: 'admin', category: 'EVENT', title: 'boardDummy5Title', date: '2026.05.01', content: 'boardDummy5Content', badge: null, isPinned: false },
    { id: '6', authorId: 'admin', category: 'NOTICE', title: 'boardDummy6Title', date: '2026.04.15', content: 'boardDummy6Content', badge: null, isPinned: false },
  ]);

  useEffect(() => {
    if (postToOpen) {
      setAllPosts(prev => prev.find(p => p.id === postToOpen.id) ? prev : [postToOpen, ...prev]);
      // ✅ [수정] BoardDetailScreen으로 이동할 때 updateDashboardPostPinStatus도 함께 전달합니다.
      navigation.navigate('BoardDetail', { post: postToOpen, userInfo, updatePostPinStatus, updateDashboardPostPinStatus });
    }
  }, [postToOpen]);

  const handleAddNewPost = (newPost: Post) => {
    setAllPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleUpdatePost = (editedPost: Post) => {
    setAllPosts(prevPosts => 
      prevPosts.map(p => (p.id === editedPost.id ? editedPost : p))
    );
  };

  const updatePostPinStatus = (postId: string, isPinned: boolean) => {
    setAllPosts(prevPosts =>
      prevPosts.map(p => (p.id === postId ? { ...p, isPinned } : p))
    );
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredPosts = allPosts
    .filter(post => activeCategory === 'ALL' || post.category === activeCategory)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date.localeCompare(a.date);
    });

  const renderItem = ({ item }: { item: Post }) => (
    // ✅ [수정] BoardDetailScreen으로 이동할 때 updateDashboardPostPinStatus도 함께 전달합니다.
    <TouchableOpacity style={styles.noticeItem} onPress={() => navigation.navigate('BoardDetail', { post: item, userInfo, updatePostPinStatus, updateDashboardPostPinStatus })} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        {item.isPinned && <Text style={styles.pinIcon}>📌 </Text>}
        {activeCategory === 'ALL' && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === item.category)?.label || 'boardTabNotice')}</Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('StaffTab')} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notice')}</Text>
        <View style={{ width: 40 }} />
      </View>

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

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.listDivider} />}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2563EB']}
            tintColor={isDarkMode ? '#60A5FA' : '#2563EB'}
          />
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('BoardWrite', { 
          userInfo,
          isEdit: false,
          onAddPost: handleAddNewPost,
        })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
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
    backgroundColor: colors.card
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
  },
  tabButtonActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    fontSize: 16,
    marginRight: 4,
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

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 32,
  },
});

export default BoardScreen;