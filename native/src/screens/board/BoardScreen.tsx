import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../types/Post';
import { useApp } from '../../contexts/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { getBoardPostsAPI } from '../../../api/auth';
import { format } from 'date-fns';

type BoardScreenNavigationProp = any;

type Props = {
  navigation: BoardScreenNavigationProp;
  route: {
    params?: {
      postToOpenId?: string;
    };
  };
};

const BoardScreen = ({ route, navigation }: Props) => {
  const { userInfo } = useApp();
  const { postToOpenId } = route.params || {};
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  const fetchPosts = useCallback(async () => {
    // TODO: userInfo에 board_id가 포함되어야 함.
    const boardId = userInfo?.board_id || 'default_board_id';
    if (!boardId) {
      Alert.alert("오류", "게시판 정보를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getBoardPostsAPI(boardId);
      setPosts(res.data);
    } catch (error) {
      console.error("게시글 목록 조회 실패:", error);
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  useEffect(() => {
    if (postToOpenId) {
      navigation.navigate('BoardDetail', { postId: postToOpenId });
    }
  }, [postToOpenId, navigation]);

  const filteredPosts = posts
    .filter(post => activeCategory === 'ALL' || post.category === activeCategory)
    .sort((a, b) => {
      // isPinned 로직은 백엔드 응답에 따라 수정 필요
      // if (a.isPinned && !b.isPinned) return -1;
      // if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => navigation.navigate('BoardDetail', { postId: item.id })} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        {/* {item.isPinned && <Text style={styles.pinIcon}>📌 </Text>} */}
        {activeCategory === 'ALL' && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === item.category)?.label || 'boardTabNotice')}</Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>{item.title}</Text>
      </View>
      <Text style={styles.noticeDate}>{format(new Date(item.created_at), 'MM.dd')}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('internalBoard')}</Text>
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

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.listDivider} />}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchPosts} 
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>게시글이 없습니다.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('BoardWrite', { isEdit: false, onGoBack: fetchPosts })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  tabContainer: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  tabScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background },
  tabButtonActive: { backgroundColor: colors.blue },
  tabText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  tabTextActive: { color: colors.white, fontWeight: '700' },
  listContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  noticeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  noticeTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  pinIcon: { fontSize: 16, marginRight: 4 },
  categoryBadge: { backgroundColor: colors.gray, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  categoryBadgeText: { color: colors.subText, fontSize: 10, fontWeight: '700' },
  noticeItemTitle: { fontSize: 16, color: colors.text, fontWeight: '500' },
  noticeDate: { fontSize: 13, color: colors.subText },
  listDivider: { height: 1, backgroundColor: colors.border },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.blue, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  fabIcon: { fontSize: 30, color: colors.white, lineHeight: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: colors.subText },
});

export default BoardScreen;
