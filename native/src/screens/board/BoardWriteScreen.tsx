import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { Post } from '../../types/Post';

const BoardWriteScreen = ({ route, navigation }: any) => {
  const { isEdit, postId } = route.params || {};
  const { userInfo } = useApp();
  const { posts, addPost, updatePost } = useBoard();
  
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const postToEdit = isEdit ? posts.find(p => p.id === postId) : null;

  const getInitialCategory = (catCode?: string) => {
    if (catCode === 'MENU') return '건의사항';
    if (catCode === 'EVENT') return '자유게시판';
    if (catCode === 'LOST') return '분실물';
    return '공지사항';
  };
  
  const [title, setTitle] = useState(isEdit && postToEdit ? t(postToEdit.title) : '');
  const [content, setContent] = useState(isEdit && postToEdit ? t(postToEdit.content) : '');
  const [category, setCategory] = useState(isEdit && postToEdit ? getInitialCategory(postToEdit.category) : '공지사항'); 
  const predefinedCategories = ['공지사항', '건의사항', '분실물', '자유게시판'];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: '알림', text2: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    let dummyCategory = 'NOTICE';
    if (category === '건의사항') dummyCategory = 'MENU';
    if (category === '자유게시판') dummyCategory = 'EVENT';
    if (category === '분실물') dummyCategory = 'LOST';
      
    if (isEdit && postToEdit) {
      const updatedPost: Post = {
        ...postToEdit,
        category: dummyCategory,
        title: title,
        content: content,
      };
      updatePost(updatedPost);
      Toast.show({ type: 'success', text1: '성공', text2: '게시글이 성공적으로 수정되었습니다.' });
    } else {
      const newPostData = {
        category: dummyCategory,
        title: title,
        content: content,
        badge: 'badgeNew',
        isPinned: false,
      };
      addPost(newPostData);
      
      if (category === '공지사항') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "📢 새로운 공지사항 등록",
              body: `[공지] ${title}`,
              data: {
                screen: 'Board',
              }
            },
            // ✅ [오류 수정] trigger를 null로 설정하여 즉시 발송
            trigger: null,
          });
        } catch (notifError) {
          console.log("알림 발송 실패:", notifError);
          Alert.alert("알림 실패", "푸시 알림을 보내는 데 실패했습니다.");
        }
      }
      Toast.show({ type: 'success', text1: '성공', text2: '게시글이 성공적으로 등록되었습니다.' });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '글 수정하기' : '새 글 쓰기'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>카테고리 선택</Text>
        <View style={styles.categoryContainer}>
          {predefinedCategories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
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
          placeholder="내용을 자세히 작성해주세요." 
          value={content} 
          onChangeText={setContent} 
          multiline 
          textAlignVertical="top"
          placeholderTextColor={colors.subText}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{isEdit ? '수정하기' : '등록하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20 },
  
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 20 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  categoryButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  categoryText: { fontSize: 14, color: colors.subText, fontWeight: '600' },
  categoryTextActive: { color: '#2563EB', fontWeight: 'bold' },
  
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: colors.text },
  contentInput: { minHeight: 200, paddingTop: 16 },
  
  submitButton: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});

export default BoardWriteScreen;