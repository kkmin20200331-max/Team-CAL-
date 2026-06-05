import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBoardPostAPI } from '../../../api/auth';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext'; // ✅ 다국어 변환용 추가
import Toast from 'react-native-toast-message'; // ✅ 토스트 추가
import * as Notifications from 'expo-notifications'; // ✅ 푸시 알림 라이브러리 추가

const BoardWriteScreen = ({ route, navigation }: any) => {
  // ✅ 이전 화면에서 넘겨받은 파라미터 (수정 모드 플래그 및 기존 글 데이터 포함)
  const { userInfo, isEdit, postToEdit, onAddPost, onUpdatePost } = route.params || {};

  // ✅ userInfo가 없을 경우를 대비한 안전 장치
  const currentUserId = userInfo?.username || 'my_test_id';
  
  const { t } = useLanguage(); // ✅ 기존 더미 타이틀 변환을 위해 사용
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // ✅ 기존 작성된 글이 있으면 초기값으로 세팅 (수정 모드)
  const [title, setTitle] = useState(isEdit && postToEdit ? t(postToEdit.title) : '');
  const [content, setContent] = useState(isEdit && postToEdit ? t(postToEdit.content) : '');
  
  // ✅ 영문 카테고리를 한글로 역변환 (기존 더미 글 카테고리 매핑)
  const getInitialCategory = (catCode: string) => {
    if (catCode === 'MENU') return '건의사항';
    if (catCode === 'EVENT') return '자유게시판';
    if (catCode === 'LOST') return '분실물';
    return '공지사항'; // NOTICE 등 기본
  };
  
  const [category, setCategory] = useState(isEdit && postToEdit ? getInitialCategory(postToEdit.category) : '공지사항'); 
  const predefinedCategories = ['공지사항', '건의사항', '분실물', '자유게시판'];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: '알림', text2: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    try {
      // 백엔드로 보낼 데이터 조립
      const postData = {
        store_id: userInfo?.store_id,
        user_id: currentUserId, // 작성자 ID
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
      
      if (isEdit) {
        // ✅ [임시] 수정 모드일 때는 기존 id를 유지하고 데이터만 덮어씀
        const updatedDummyPost = {
          ...postToEdit,
          category: dummyCategory,
          title: title,
          content: content,
        };
        // ✅ [수정] 콜백 함수가 유실되었을 경우를 대비한 안전 장치 (옵셔널 체이닝)
        onUpdatePost?.(updatedDummyPost);
        Toast.show({ type: 'success', text1: '성공', text2: '게시글이 성공적으로 수정되었습니다.' });
        navigation.goBack();
      } else {
        // ✅ [임시] 새 글 모드
        const today = new Date();
        const newDummyPost = {
          id: Date.now().toString(),
          authorId: currentUserId,
          category: dummyCategory,
          title: title,
          date: `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`,
          content: content,
          badge: 'badgeNew'
        };
        // ✅ [수정] 콜백 함수가 유실되었을 경우를 대비한 안전 장치
        onAddPost?.(newDummyPost);
        Toast.show({ type: 'success', text1: '성공', text2: '게시글이 성공적으로 등록되었습니다.' });

        // ✅ [추가] 공지사항을 작성했을 때 1초 뒤 기기 상단에 푸시 알림 띄우기
        if (category === '공지사항') {
          try {
            Notifications.scheduleLocalNotificationAsync({
              content: {
                title: "📢 새로운 공지사항 등록",
                body: `[공지] ${title}`,
              },
              trigger: { seconds: 1 },
            });
          } catch (notifError) {
            console.log("알림 예약 실패 (권한 또는 채널 문제):", notifError);
          }
        }
        
        navigation.goBack();
      }
    } catch (error) {
      console.error('글쓰기 에러:', error);
      Toast.show({ type: 'error', text1: '오류', text2: '게시글 등록 중 문제가 발생했습니다.' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '글 수정하기' : '새 글 쓰기'}</Text>
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