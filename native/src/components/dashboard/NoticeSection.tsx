import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types/Post';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { language } = useLanguage();
  const styles = getThemedStyles(colors, isDarkMode);

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
                <Text style={styles.categoryBadgeText}>
                  {translateBoardName(post.category)}
                </Text>
              </View>
              <Text style={styles.noticeItemTitle} numberOfLines={1}>
                {displayTitle(post.title)}
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