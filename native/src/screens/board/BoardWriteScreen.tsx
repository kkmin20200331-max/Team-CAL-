import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBoardPostAPI } from '../../../api/auth';
import { useTheme } from '../../contexts/ThemeContext';

const BoardWriteScreen = ({ route, navigation }: any) => {
  // 이전 화면(BoardScreen 등)에서 넘겨받은 내 정보
  const { userInfo } = route.params || {};
  
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // 직원이 선택할 수 있는 기본 카테고리 (관리자의 경우 추후 DB에서 커스텀 카테고리를 받아오도록 구성 가능)
  const [category, setCategory] = useState('공지사항'); 
  const predefinedCategories = ['공지사항', '건의사항', '분실물', '자유게시판'];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      // 백엔드로 보낼 데이터 조립
      const postData = {
        store_id: userInfo?.store_id,
        user_id: userInfo?.username, // 작성자 ID
        author_name: userInfo?.name, // 작성자 이름
        title: title,
        content: content,
        category: category,
        role: userInfo?.role // 직원인지 관리자인지 권한 전달
      };

      // [TODO] 실제 Spring Boot 백엔드 연동 시 주석 해제
      // await createBoardPostAPI(postData); 

      // ✅ [임시] 프론트엔드 UI 테스트를 위한 더미 데이터 조립
      let dummyCategory = 'NOTICE';
      if (category === '건의사항') dummyCategory = 'MENU';
      if (category === '자유게시판') dummyCategory = 'EVENT';
      if (category === '분실물') dummyCategory = 'LOST';
      
      const today = new Date();
      const newDummyPost = {
        id: Date.now().toString(),
        category: dummyCategory,
        title: title, // 다국어(t) 키가 없으면 원본 문자열이 그대로 출력됩니다.
        date: `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`,
        content: content,
        badge: 'badgeNew'
      };

      Alert.alert('성공', '게시글이 성공적으로 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.navigate('Board', { newPost: newDummyPost }) }
      ]);
    } catch (error) {
      console.error('글쓰기 에러:', error);
      Alert.alert('오류', '게시글 등록 중 문제가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 글 쓰기</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 카테고리 선택 영역 */}
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
          
          {/* 💡 [추후 확장] 만약 관리자(ADMIN)라면 여기에 카테고리 추가(+) 버튼을 보여줍니다 */}
          {/* {userInfo?.role === 'ADMIN' && (
             <TouchableOpacity style={styles.addCategoryButton}>
               <Text style={styles.addCategoryText}>+ 추가</Text>
             </TouchableOpacity>
          )} */}
        </View>

        {/* 제목 입력 */}
        <Text style={styles.label}>제목</Text>
        <TextInput 
          style={styles.input} 
          placeholder="제목을 입력하세요" 
          value={title} 
          onChangeText={setTitle} 
          placeholderTextColor={colors.subText}
        />

        {/* 내용 입력 */}
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

        {/* 등록 버튼 */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>등록하기</Text>
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