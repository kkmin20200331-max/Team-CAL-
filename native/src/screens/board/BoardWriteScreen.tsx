import React, { useState, useCallback } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons'; // ✅ Ionicons 임포트
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
// import { translateTexts } from '../../api/translation';
import { Post } from '../../types/Post';

const BoardWriteScreen = ({ route, navigation }: any) => {
  const { isEdit, postId } = route.params || {};
  const { userInfo } = useApp();
  const { posts, addPost, updatePost, boards } = useBoard();
  const { colors, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const styles = getThemedStyles(colors, isDarkMode);

  const isAdmin = userInfo?.role === 'ADMIN';
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
  const postToEdit = isEdit ? posts.find((post) => post.id === postId) : null;

  const parseJSON = (str: string) => {
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
  };

  const initialParsedTitle = isEdit && postToEdit ? parseJSON(postToEdit.title) : { ko: '', en: '', ja: '' };
  const initialParsedContent = isEdit && postToEdit ? parseJSON(postToEdit.content) : { ko: '', en: '', ja: '' };

  const langCode = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';

  const [title, setTitle] = useState(
    isEdit && postToEdit ? (initialParsedTitle[langCode] || initialParsedTitle.ko) : ''
  );
  const [content, setContent] = useState(
    isEdit && postToEdit ? (initialParsedContent[langCode] || initialParsedContent.ko) : ''
  );
  const [category, setCategory] = useState<string>(
    isEdit && postToEdit ? postToEdit.category : 'NOTICE',
  );
  const [customCategory, setCustomCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const categoryChoices = React.useMemo(() => {
    const list = [
      { label: t('boardTabNotice') || '공지사항', value: 'NOTICE' },
      { label: t('boardTabMenu') || '건의사항', value: 'MENU' },
      { label: t('boardTabLost') || '분실물', value: 'LOST' },
      { label: t('boardTabEvent') || '자유게시판', value: 'EVENT' },
      { label: t('boardTabManual') || '매뉴얼', value: 'MANUAL' },
      { label: t('boardTabChecklist') || '체크리스트', value: 'CHECKLIST' },
    ];

    // 기존 매장에 등록된 커스텀 카테고리(게시판)가 있다면 선택 항목에 동적으로 추가해 줍니다.
    const predefinedKeys = ['NOTICE', 'MENU', 'EVENT', 'MANUAL', 'LOST', 'CHECKLIST', '공지사항', '건의사항', '자유게시판', '매뉴얼', '분실물', '체크리스트', '공지', '건의'];
    boards.forEach((board) => {
      const nameUpper = board.name.toUpperCase();
      if (!predefinedKeys.includes(nameUpper)) {
        if (!list.some((item) => item.value === board.name)) {
          list.push({ label: translateBoardName(board.name), value: board.name });
        }
      }
    });

    // 관리자일 경우에만 카테고리 직접 추가 옵션을 제공합니다.
    if (isAdmin) {
      list.push({ label: `+ ${t('add') || '직접 추가'}`, value: 'CUSTOM' });
    }

    return list;
  }, [boards, isAdmin, translateBoardName, t]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: t('inputError') || '입력 오류', text2: t('titleContentRequired') || '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    if (!storeId || !userInfo?.id) {
      Toast.show({ type: 'error', text1: t('error') || '저장 실패', text2: t('noStoreOrUserInfo') || '매장 또는 사용자 정보가 없습니다.' });
      return;
    }

    let finalCategory = category;
    if (category === 'CUSTOM') {
      if (!customCategory.trim()) {
        Toast.show({ type: 'error', text1: t('inputError') || '입력 오류', text2: t('enterTabName') || '추가할 카테고리명을 입력해주세요.' });
        return;
      }
      finalCategory = customCategory.trim();
    }

    setSubmitting(true);

    const sourceLang = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';

    let titleObj = { ko: title.trim(), en: title.trim(), ja: title.trim() };
    let contentObj = { ko: content.trim(), en: content.trim(), ja: content.trim() };

    try {
      /* Google API 연동 임시 주석 처리
      // 1. 영어 번역 수행
      if (sourceLang !== 'en') {
        try {
          const resEn = await translateTexts([title.trim(), content.trim()], 'en');
          titleObj.en = resEn[0] || title.trim();
          contentObj.en = resEn[1] || content.trim();
        } catch (err) {
          console.error('영어 번역 실패:', err);
        }
      }

      // 2. 일어 번역 수행
      if (sourceLang !== 'ja') {
        try {
          const resJa = await translateTexts([title.trim(), content.trim()], 'ja');
          titleObj.ja = resJa[0] || title.trim();
          contentObj.ja = resJa[1] || content.trim();
        } catch (err) {
          console.error('일어 번역 실패:', err);
        }
      }

      // 3. 한국어 번역 수행
      if (sourceLang !== 'ko') {
        try {
          const resKo = await translateTexts([title.trim(), content.trim()], 'ko');
          titleObj.ko = resKo[0] || title.trim();
          contentObj.ko = resKo[1] || content.trim();
        } catch (err) {
          console.error('한국어 번역 실패:', err);
        }
      }
      */

      const serializedTitle = JSON.stringify(titleObj);
      const serializedContent = JSON.stringify(contentObj);

      if (isEdit && postToEdit) {
        await updatePost({
          ...postToEdit,
          category: finalCategory,
          title: serializedTitle,
          content: serializedContent,
        });
        Toast.show({ type: 'success', text1: t('success') || '수정 완료', text2: t('postEditSuccess') || '게시글이 수정되었습니다.' });
      } else {
        await addPost(
          {
            category: finalCategory,
            title: serializedTitle,
            content: serializedContent,
            badge: 'badgeNew',
            isPinned: false,
          },
          {
            storeId,
            writerId: userInfo.id,
          },
        );
        Toast.show({ type: 'success', text1: t('success') || '등록 완료', text2: t('postCreateSuccess') || '게시글이 등록되었습니다.' });
      }

      navigation.goBack();
    } catch (error) {
      console.error('게시글 저장 오류:', error);
      Toast.show({ type: 'error', text1: t('error') || '저장 실패', text2: t('unknownErrorMsg') || '게시글 저장 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? t('editPost') : t('writeNewPost')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>{t('categoryLabel') || '카테고리'}</Text>
        <View style={styles.categoryContainer}>
          {categoryChoices.map((item) => (
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

        {category === 'CUSTOM' && (
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder={t('enterTabName') || '추가할 카테고리명을 입력해주세요.'}
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholderTextColor={colors.subText}
          />
        )}

        <Text style={styles.label}>
          {t('title') || '제목'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={t('titlePlaceholder') || '제목을 입력하세요'}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={colors.subText}
        />

        <Text style={styles.label}>
          {t('content') || '내용'}
        </Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder={t('contentPlaceholder') || '내용을 작성해주세요.'}
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
            <Text style={styles.submitButtonText}>
              {isEdit ? (t('editComplete') || '수정하기') : (t('createComplete') || '등록하기')}
            </Text>
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
  backButton: { padding: 4, width: 40, justifyContent: 'center' },
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
