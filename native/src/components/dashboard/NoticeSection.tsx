import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Post } from '../../types/Post';
import { useSchedule } from '../../contexts/ScheduleContext'; // 1. useSchedule 훅 임포트

type Props = {
  posts: Post[];
  handleOpenPost: (post: Post) => void;
  navigation: any;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
};

const NoticeSection = ({ posts, handleOpenPost, navigation, colors, isDarkMode, t }: Props) => {
  const styles = getThemedStyles(colors, isDarkMode);
  const { employees } = useSchedule(); // 2. employees 데이터 가져오기

  const getAuthorName = (authorId: string) => {
    // 3. employees가 준비되었을 때만 find 사용
    const author = employees?.find(emp => emp.username === authorId);
    return author?.name || authorId; // 찾지 못하면 authorId 그대로 반환
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
        latestNotices.map((post) => (
          <TouchableOpacity key={post.id} style={styles.noticeItem} onPress={() => handleOpenPost(post)}>
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

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
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
    color: colors.primary,
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