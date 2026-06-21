import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post } from '../../types/Post';
import { useApp } from '../../contexts/AppContext';
import Toast from "react-native-toast-message";
import { getBoardPostByIdAPI, deleteBoardPostAPI } from '../../../api/auth';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

type BoardDetailScreenNavigationProp = StackNavigationProp<any, 'BoardDetail'>;

type Props = {
  navigation: BoardDetailScreenNavigationProp;
  route: {
    params: {
      postId: string;
      onGoBack?: () => void;
    };
  };
};

const BoardDetailScreen = ({ route, navigation }: Props) => {
  const { postId, onGoBack } = route.params;
  const { userInfo } = useApp();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBoardPostByIdAPI(postId);
      setPost(res.data);
    } catch (error) {
      console.error("게시글 상세 조회 실패:", error);
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [postId, navigation]);

  useFocusEffect(fetchPost);

  const isAuthor = post?.user_id === userInfo?.id;

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
          onPress: async () => {
            try {
              await deleteBoardPostAPI(post.id);
              Toast.show({ type: 'info', text1: '게시글이 삭제되었습니다.' });
              if (onGoBack) onGoBack();
              navigation.goBack();
            } catch (error) {
              console.error("게시글 삭제 실패:", error);
              Alert.alert("오류", "게시글 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><Text style={{color: colors.text}}>게시글을 찾을 수 없습니다.</Text></View>
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
                <TouchableOpacity onPress={() => navigation.navigate('BoardWrite', { isEdit: true, postToEdit: post, onGoBack: fetchPost })}>
                  <Text style={styles.headerButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePost}>
                  <Text style={[styles.headerButtonText, styles.deleteButtonText]}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postAuthor}>{t('writer')}: {post.user_name || '알 수 없음'}</Text>
              <Text style={styles.postDate}>{format(new Date(post.created_at), 'yyyy.MM.dd HH:mm')}</Text>
            </View>
            <View style={styles.postContentContainer}>
              <Text style={styles.postContent}>{post.content}</Text>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>{t('comments')}</Text>
            <View style={styles.emptyContainer}>
              <Text style={styles.noCommentsText}>댓글 기능은 현재 준비 중입니다.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16, minWidth: 80, justifyContent: 'flex-end' },
  headerButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  deleteButtonText: { color: colors.red },
  container: { flex: 1, padding: 20 },
  postContainer: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 20 },
  postTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 15 },
  postAuthor: { fontSize: 13, color: colors.subText },
  postDate: { fontSize: 13, color: colors.subText },
  postContentContainer: { minHeight: 200 },
  postContent: { fontSize: 16, color: colors.text, lineHeight: 24 },
  commentsSection: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 20 },
  commentsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  noCommentsText: { fontSize: 14, color: colors.subText, textAlign: 'center' },
});

export default BoardDetailScreen;
