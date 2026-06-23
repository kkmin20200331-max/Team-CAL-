import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types/Post';

type Props = {
  posts: Post[];
  handleOpenPost: (post: Post) => void;
  navigation: any;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
  CATEGORIES: any[];
};

const NoticeSection = ({ posts, handleOpenPost, navigation, colors, isDarkMode, t, CATEGORIES }: Props) => {
  const styles = getThemedStyles(colors, isDarkMode);

  const postsToShow = posts.slice(0, 3);

  return (
    <View style={styles.noticeSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('notice')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BoardNavigator')}>
          <Text style={styles.moreText}>{t('more')}</Text>
        </TouchableOpacity>
      </View>
      
      {postsToShow.map((post, index) => (
        <React.Fragment key={post.id}>
          <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(post)} activeOpacity={0.7}>
            <View style={styles.noticeTextContainer}>
              {post.isPinned && <Ionicons name="pin" size={14} color="#EF4444" style={styles.pinIcon} />}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === post.category)?.label || 'boardTabNotice')}</Text>
              </View>
              <Text style={styles.noticeItemTitle} numberOfLines={1}>
                {t(post.title).length > 14 ? t(post.title).substring(0, 14) + '..' : t(post.title)}
              </Text>
              {post.badge && (
                <View style={styles.newBadge}><Text style={styles.newBadgeText}>{t(post.badge)}</Text></View>
              )}
            </View>
            <Text style={styles.noticeDate}>{post.date}</Text>
          </TouchableOpacity>
          {index < postsToShow.length - 1 && <View style={styles.noticeDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  noticeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreText: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
    backgroundColor: isDarkMode ? '#1F293D' : '#E5E7EB',
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
    fontSize: 15,
    color: colors.text,
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
  noticeDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default NoticeSection;