import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post } from '../../types/Post';
import { User } from '../../types/User';
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
      post: Post;
      userInfo: User | null;
      updatePostPinStatus: (postId: string, isPinned: boolean) => void;
      updateDashboardPostPinStatus?: (postId: string, isPinned: boolean) => void; // ✅ [추가] Dashboard의 상태 업데이트 함수 (optional)
    };
  };
};

const BoardDetailScreen = ({ route, navigation }: Props) => {
  const { post, userInfo, updatePostPinStatus, updateDashboardPostPinStatus } = route.params;
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [viewCount, setViewCount] = useState(123);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPinned, setIsPinned] = useState(post.isPinned || false);

  const currentUserId = userInfo?.username || 'my_test_id';
  const currentUserName = userInfo?.name || '현재사용자';

  useEffect(() => {
    setViewCount(prev => prev + 1);
    setComments([
      { id: 'c1', postId: post.id, author: '김직원', content: '좋은 정보 감사합니다!', timestamp: '2026.06.01 10:00', isMine: false },
      { id: 'c2', postId: post.id, author: currentUserName, content: '궁금한 점이 있어요.', timestamp: '2026.06.01 10:30', isMine: true },
    ]);
  }, [post.id]);

  const handleAddComment = () => {
    if (newComment.trim() === '') {
      Alert.alert(t('commentEmptyTitle'), t('commentEmptyMsg'));
      return;
    }
    const newCommentObj: Comment = {
      id: `c${comments.length + 1}`,
      postId: post.id,
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
    const newPinnedStatus = !isPinned;
    setIsPinned(newPinnedStatus);
    
    // ✅ [수정] BoardScreen과 DashboardScreen의 상태를 모두 업데이트합니다.
    if (updatePostPinStatus) {
      updatePostPinStatus(post.id, newPinnedStatus);
    }
    if (updateDashboardPostPinStatus) {
      updateDashboardPostPinStatus(post.id, newPinnedStatus);
    }

    Toast.show({
      type: 'success',
      text1: newPinnedStatus ? t('pinSuccess') : t('unpinSuccess'),
    });
  };

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
          {userInfo?.role === 'ADMIN' ? (
            <TouchableOpacity onPress={handleTogglePin} style={styles.pinButton}>
              <Text style={styles.pinButtonText}>{isPinned ? t('unpin') : t('pin')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <Text style={styles.postTitle}>{t(post.title)}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postAuthor}>{t('writer')}: {post.author || t('unknown')}</Text>
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
  pinButton: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 4,
  },
  pinButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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