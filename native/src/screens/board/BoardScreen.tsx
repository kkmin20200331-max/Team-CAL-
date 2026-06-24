import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

const CATEGORIES = [
  { id: 'ALL', label: '전체' },
  { id: 'NOTICE', label: '공지' },
  { id: 'MENU', label: '건의' },
  { id: 'EVENT', label: '자유' },
  { id: 'MANUAL', label: '매뉴얼' },
  { id: 'LOST', label: '분실물' },
];

const BoardScreen = ({ route, navigation }: Props) => {
  const { userInfo } = useApp();
  const { posts, loading, loadPosts } = useBoard();
  const { postToOpenId } = route.params || {};
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [activeCategory, setActiveCategory] = useState('ALL');
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
        <View style={{ width: 40 }} />
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
  tabButtonActive: { backgroundColor: colors.primary },
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
