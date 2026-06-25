import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons'; // ✅ Ionicons 임포트
// ✅ [추가] 게시판 댓글 API 함수 임포트
import { getCommentsAPI, createCommentAPI, deleteCommentAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
// ✅ [추가] 다국어 지원 훅 임포트
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../types/Post';

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
  const { posts, updatePinStatus } = useBoard();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors, isDarkMode);

  const [post, setPost] = useState<Post | null>(null);
  // ✅ [추가] 댓글 관련 상태값 정의 (댓글 리스트, 입력 폼 텍스트, 로딩 여부)
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // ✅ [추가] 댓글 목록 불러오기 API 호출 함수
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await getCommentsAPI(postId);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('댓글 불러오기 오류:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    setPost(posts.find((item) => item.id === postId) || null);
    fetchComments();
  }, [postId, posts]);

  const handleTogglePin = async () => {
    if (!post) return;
    const nextPinned = !post.isPinned;

    try {
      await updatePinStatus(post.id, nextPinned);
      Toast.show({
        type: 'success',
        text1: nextPinned ? '상단 고정 완료' : '상단 고정 해제',
      });
    } catch (error) {
      console.error('게시글 고정 변경 오류:', error);
      Alert.alert('처리 실패', '게시글 고정 상태를 변경하지 못했습니다.');
    }
  };

  // ✅ [추가] 새 댓글 등록 API 호출 함수 (누구나 가능)
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert(t('commentEmptyTitle'), t('commentEmptyMsg'));
      return;
    }
    const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
    if (!storeId) {
      Alert.alert('등록 실패', '소속 매장 정보가 없어서 댓글을 등록할 수 없습니다.');
      return;
    }
    try {
      const commentId = `CMT_${Date.now()}`;
      await createCommentAPI({
        id: commentId,
        post_id: postId,
        store_id: storeId,
        user_id: userInfo?.id || '',
        content: commentText.trim(),
      });
      setCommentText('');
      await fetchComments();
      Toast.show({
        type: 'success',
        text1: '댓글 등록 완료',
      });
    } catch (error) {
      console.error('댓글 등록 오류:', error);
      Alert.alert('등록 실패', '댓글을 등록하지 못했습니다.');
    }
  };

  // ✅ [추가] 댓글 삭제 API 호출 함수 (댓글 작성자 본인만 가능)
  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      t('deleteCommentConfirmTitle'),
      t('deleteCommentConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommentAPI(commentId, postId, userInfo?.id || '');
              await fetchComments();
              Toast.show({
                type: 'success',
                text1: t('deleteCommentSuccessMsg'),
              });
            } catch (error) {
              console.error('댓글 삭제 오류:', error);
              Alert.alert('삭제 실패', '댓글을 삭제하지 못했습니다.');
            }
          },
        },
      ]
    );
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>게시글을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시글 상세</Text>
        {userInfo?.role === 'ADMIN' ? (
          <TouchableOpacity onPress={handleTogglePin} style={styles.pinButton}>
            <Ionicons 
              name={post.isPinned ? "pin" : "pin-outline"} 
              size={22} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postAuthor}>작성자: {post.author || post.authorId || '알 수 없음'}</Text>
              <Text style={styles.postDate}>{post.date}</Text>
            </View>
            <View style={styles.postContentContainer}>
              <Text style={styles.postContent}>{post.content}</Text>
            </View>
          </View>

          {/* ✅ [추가] 댓글 표시 및 작성 폼 섹션 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.text} /> {t('comments')} ({comments.length})
            </Text>

            {loadingComments ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>{t('noComments')}</Text>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((item) => (
                  <View key={item.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.avatarText}>
                            {(item.user_name || item.user_id || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.commentAuthor}>{item.user_name || item.user_id}</Text>
                          <Text style={styles.commentDate}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </View>
                      {item.user_id === userInfo?.id && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(item.id)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 댓글 입력 폼 */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('addCommentPlaceholder')}
                placeholderTextColor={colors.subText}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.subText, fontSize: 15, fontWeight: '600' },
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
  pinButton: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 4,
  },
  container: { flex: 1, padding: 20 },
  postContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0 : 0.05,
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  postAuthor: {
    fontSize: 13,
    color: colors.subText,
  },
  postDate: {
    fontSize: 13,
    color: colors.subText,
  },
  postContentContainer: {
    minHeight: 160,
  },
  postContent: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  // ✅ [추가] 게시판 댓글 관련 UI 스타일 목록
  commentsSection: {
    marginTop: 16,
    marginBottom: 40,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0 : 0.05,
    shadowRadius: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: colors.subText,
    marginVertical: 20,
    fontSize: 14,
  },
  commentsList: {
    marginBottom: 20,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  commentDate: {
    fontSize: 11,
    color: colors.subText,
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: colors.text,
    paddingLeft: 32,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
    backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});

export default BoardDetailScreen;
