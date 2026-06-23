import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Post } from '../../types/Post';

const categories: Array<{ label: string; value: Post['category'] }> = [
  { label: '공지사항', value: 'NOTICE' },
  { label: '건의사항', value: 'MENU' },
  { label: '분실물', value: 'LOST' },
  { label: '자유게시판', value: 'EVENT' },
  { label: '매뉴얼', value: 'MANUAL' },
];

const BoardWriteScreen = ({ route, navigation }: any) => {
  const { isEdit, postId } = route.params || {};
  const { userInfo } = useApp();
  const { posts, addPost, updatePost } = useBoard();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
  const postToEdit = isEdit ? posts.find((post) => post.id === postId) : null;

  const [title, setTitle] = useState(isEdit && postToEdit ? postToEdit.title : '');
  const [content, setContent] = useState(isEdit && postToEdit ? postToEdit.content : '');
  const [category, setCategory] = useState<Post['category']>(
    isEdit && postToEdit ? postToEdit.category : 'NOTICE',
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: '입력 오류', text2: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    if (!storeId || !userInfo?.id) {
      Toast.show({ type: 'error', text1: '저장 실패', text2: '매장 또는 사용자 정보가 없습니다.' });
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit && postToEdit) {
        await updatePost({
          ...postToEdit,
          category,
          title: title.trim(),
          content: content.trim(),
        });
        Toast.show({ type: 'success', text1: '수정 완료', text2: '게시글이 수정되었습니다.' });
      } else {
        await addPost(
          {
            category,
            title: title.trim(),
            content: content.trim(),
            badge: 'badgeNew',
            isPinned: false,
          },
          {
            storeId,
            writerId: userInfo.id,
          },
        );
        Toast.show({ type: 'success', text1: '등록 완료', text2: '게시글이 등록되었습니다.' });
      }

      navigation.goBack();
    } catch (error) {
      console.error('게시글 저장 오류:', error);
      Toast.show({ type: 'error', text1: '저장 실패', text2: '게시글 저장 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '글 수정' : '새 글 작성'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>카테고리</Text>
        <View style={styles.categoryContainer}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.categoryButton, category === item.value && styles.categoryButtonActive]}
              onPress={() => setCategory(item.value)}
            >
              <Text style={[styles.categoryText, category === item.value && styles.categoryTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.subText}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="내용을 작성해주세요."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.subText}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{isEdit ? '수정하기' : '등록하기'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 28, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 20 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  categoryText: { fontSize: 14, color: colors.subText, fontWeight: '600' },
  categoryTextActive: { color: colors.primary, fontWeight: 'bold' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
  },
  contentInput: { minHeight: 200, paddingTop: 16 },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default BoardWriteScreen;
