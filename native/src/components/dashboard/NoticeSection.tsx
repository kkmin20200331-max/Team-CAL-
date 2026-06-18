import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Post } from '../../types/Post';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  posts: Post[];
  handleOpenPost: (post: Post) => void;
  navigation: any;
  t: (key: string) => string;
};

const NoticeSection = ({ posts, handleOpenPost, navigation, t }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees } = useSchedule();

  const getAuthorName = (authorId: string) => {
    const author = employees?.find(emp => emp.username === authorId);
    return author?.name || authorId;
  };

  const latestNotices = posts.filter(post => post.category === 'NOTICE').slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('latestNotices')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BoardNavigator', { screen: 'Board' })}>
          <Text style={styles.viewAll}>{t('viewAll')}</Text>
        </TouchableOpacity>
      </View>
      {latestNotices.length > 0 ? (
        latestNotices.map((post, index) => (
          <TouchableOpacity 
            key={post.id} 
            style={[styles.noticeItem, index === latestNotices.length - 1 && { borderBottomWidth: 0 }]} 
            onPress={() => handleOpenPost(post)}
          >
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{t(post.title)}</Text>
              <Text style={styles.noticeMeta}>
                {getAuthorName(post.authorId)} | {post.date}
              </Text>
            </View>
            {post.isPinned && <Text style={styles.pinIcon}>📌</Text>}
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>{t('noNotices')}</Text>
      )}
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noticeContent: {
    flex: 1,
    marginRight: 10,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  noticeMeta: {
    fontSize: 12,
    color: colors.subText,
  },
  pinIcon: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default NoticeSection;