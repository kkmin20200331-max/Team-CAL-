import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons'; // ✅ Ionicons 임포트
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
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
  const styles = getThemedStyles(colors, isDarkMode);

  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    setPost(posts.find((item) => item.id === postId) || null);
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.postContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.postMeta}>
            <Text style={styles.postAuthor}>작성자: {post.authorId || '알 수 없음'}</Text>
            <Text style={styles.postDate}>{post.date}</Text>
          </View>
          <View style={styles.postContentContainer}>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 20,
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
});

export default BoardDetailScreen;
