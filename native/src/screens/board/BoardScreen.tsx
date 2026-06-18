import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../types/Post';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';

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
  const { posts } = useBoard();
  const { postToOpenId } = route.params || {};
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  useEffect(() => {
    if (postToOpenId) {
      navigation.navigate('BoardDetail', { postId: postToOpenId });
    }
  }, [postToOpenId]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredPosts = posts
    .filter(post => activeCategory === 'ALL' || post.category === activeCategory)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.noticeItem} onPress={() => navigation.navigate('BoardDetail', { postId: item.id })} activeOpacity={0.7}>
      <View style={styles.noticeTextContainer}>
        {item.isPinned && <Text style={styles.pinIcon}>📌 </Text>}
        {activeCategory === 'ALL' && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === item.category)?.label || 'boardTabNotice')}</Text>
          </View>
        )}
        <Text style={styles.noticeItemTitle} numberOfLines={1}>
          {item.title.length > (activeCategory === 'ALL' ? 14 : 18) ? item.title.substring(0, (activeCategory === 'ALL' ? 14 : 18)) + '..' : item.title}
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
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('BoardWrite', { isEdit: false })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.background,
  },
  tabButtonActive: { backgroundColor: colors.blue },
  tabText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  tabTextActive: { color: colors.white, fontWeight: '700' },

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
    backgroundColor: colors.gray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    color: colors.subText,
    fontSize: 10,
    fontWeight: '700',
  },
  noticeItemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: colors.white,
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
    backgroundColor: colors.blue,
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
    color: colors.white,
    lineHeight: 32,
  },
});

export default BoardScreen;