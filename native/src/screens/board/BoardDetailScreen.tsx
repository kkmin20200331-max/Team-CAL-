import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post } from '../../types/Post';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { useSchedule } from '../../contexts/ScheduleContext'; // 1. useSchedule 훅 임포트
import Toast from "react-native-toast-message";

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

type BoardDetailScreenNavigationProp = StackNavigationProp<any, 'BoardDetail'>;

type Props = {
  navigation: BoardDetailScreenNavigationProp;
  route: {
    params: {
      postId: string;
    };
  };
};

const BoardDetailScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
  const { userInfo } = useApp();
  const { posts, updatePinStatus, deletePost } = useBoard();
  const { employees } = useSchedule(); // 2. 전역 employees 목록 가져오기
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [post, setPost] = useState<Post | null>(null);
  const [viewCount, setViewCount] = useState(123);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const currentUserId = userInfo?.username || 'my_test_id';
  const currentUserName = userInfo?.name || '현재사용자';

  useEffect(() => {
    const foundPost = posts.find(p => p.id === postId);
    if (foundPost) {
      setPost(foundPost);
      setViewCount(prev => prev + 1);
      setComments([
        { id: 'c1', postId: postId, author: '김직원', content: '좋은 정보 감사합니다!', timestamp: '2026.06.01 10:00', isMine: false },
        { id: 'c2', postId: postId, author: currentUserName, content: '궁금한 점이 있어요.', timestamp: '2026.06.01 10:30', isMine: true },
      ]);
    }
  }, [postId, posts]);

  // 3. authorId를 이용해 작성자 이름 찾기
  const authorName = useMemo(() => {
    if (!post?.authorId) return t('unknown');
    const author = employees.find(emp => emp.username === post.authorId);
    return author?.name || post.authorId;
  }, [post, employees]);

  const isAuthor = post?.authorId === currentUserId;

  const handleAddComment = () => {
    if (newComment.trim() === '') {
      Alert.alert(t('commentEmptyTitle'), t('commentEmptyMsg'));
      return;
    }
    const newCommentObj: Comment = {
      id: `c${comments.length + 1}`,
      postId: post!.id,
      author: currentUserName,
      content: newComment.trim(),
      timestamp: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    };
    setComments([...comments, newCommentObj]);
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      t('deleteCommentConfirmTitle'),
      t('deleteCommentConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            setComments(comments.filter(comment => comment.id !== commentId));
            Alert.alert(t('deleteCommentSuccessTitle'), t('deleteCommentSuccessMsg'));
          },
        },
      ]
    );
  };

  const handleTogglePin = () => {
    if (!post) return;
    const newPinnedStatus = !post.isPinned;
    updatePinStatus(post.id, newPinnedStatus);
    Toast.show({
      type: 'success',
      text1: newPinnedStatus ? t('pinSuccess') : t('unpinSuccess'),
    });
  };

  const handleDeletePost = () => {
    if (!post) return;
    Alert.alert(
      "게시글 삭제",
      "이 게시글을 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            deletePost(post.id);
            Toast.show({ type: 'info', text1: '게시글이 삭제되었습니다.' });
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><Text>게시글을 찾을 수 없습니다.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('boardDetailTitle')}</Text>
          <View style={styles.headerRight}>
            {isAuthor && (
              <>
                <TouchableOpacity onPress={() => navigation.navigate('BoardWrite', { isEdit: true, postId: post.id })}>
                  <Text style={styles.headerButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePost}>
                  <Text style={[styles.headerButtonText, styles.deleteButtonText]}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
            {userInfo?.role === 'ADMIN' && (
              <TouchableOpacity onPress={handleTogglePin}>
                <Text style={styles.headerButtonText}>{post.isPinned ? t('unpin') : t('pin')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <Text style={styles.postTitle}>{t(post.title)}</Text>
            <View style={styles.postMeta}>
              {/* 4. 작성자 이름을 표시하도록 수정 */}
              <Text style={styles.postAuthor}>{t('writer')}: {authorName}</Text>
              <Text style={styles.postDate}>{post.date}</Text>
            </View>
            <View style={styles.postStats}>
              <Text style={styles.postViewCount}>{t('views')}: {viewCount}</Text>
            </View>
            <View style={styles.postContentContainer}>
              <Text style={styles.postContent}>{t(post.content)}</Text>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>{t('comments')} ({comments.length})</Text>
            {comments.length === 0 ? (
              <Text style={styles.noCommentsText}>{t('noComments')}</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.author}</Text>
                    <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  {comment.isMine && (
                    <TouchableOpacity onPress={() => handleDeleteComment(comment.id)} style={styles.deleteCommentButton}>
                      <Text style={styles.deleteCommentButtonText}>{t('delete')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder={t('addCommentPlaceholder')}
            placeholderTextColor={colors.subText}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity style={styles.commentSubmitButton} onPress={handleAddComment}>
            <Text style={styles.commentSubmitButtonText}>{t('register')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  
  container: { flex: 1, padding: 20 },

  postContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postAuthor: {
    fontSize: 13,
    color: colors.subText,
  },
  postDate: {
    fontSize: 13,
    color: colors.subText,
  },
  postStats: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  postViewCount: {
    fontSize: 13,
    color: colors.subText,
  },
  postContentContainer: {
    minHeight: 100,
  },
  postContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },

  commentsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  noCommentsText: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 15,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  commentTimestamp: {
    fontSize: 12,
    color: colors.subText,
  },
  commentContent: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  deleteCommentButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB',
  },
  deleteCommentButtonText: {
    fontSize: 12,
    color: isDarkMode ? '#D1D5DB' : '#4B5563',
  },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
  },
  commentSubmitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default BoardDetailScreen;