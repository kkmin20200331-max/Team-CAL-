import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Toast from 'react-native-toast-message';
import { useApp } from '../../contexts/AppContext';
import { createBoardPostAPI, updateBoardPostAPI } from '../../../api/auth';

const BoardWriteScreen = ({ route, navigation }: any) => {
  const { isEdit, post: postToEdit, onGoBack } = route.params || {};
  const { userInfo } = useApp();
  
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const predefinedCategories = [
    { key: 'notice', dbValue: 'NOTICE' },
    { key: 'suggestion', dbValue: 'MENU' },
    { key: 'lost_found', dbValue: 'LOST' },
    { key: 'free_board', dbValue: 'EVENT' },
  ];

  const getInitialCategoryKey = (dbValue?: string) => {
    return predefinedCategories.find(c => c.dbValue === dbValue)?.key || 'notice';
  };
  
  const [title, setTitle] = useState(isEdit && postToEdit ? postToEdit.title : '');
  const [content, setContent] = useState(isEdit && postToEdit ? postToEdit.content : '');
  const [categoryKey, setCategoryKey] = useState(isEdit && postToEdit ? getInitialCategoryKey(postToEdit.category) : 'notice'); 

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({ type: 'error', text1: t('alert'), text2: t('titleContentRequired') });
      return;
    }
    if (!userInfo || !userInfo.id || !userInfo.board_id) {
      Alert.alert("오류", "사용자 또는 게시판 정보가 없습니다.");
      return;
    }

    const selectedCategory = predefinedCategories.find(c => c.key === categoryKey);
    const categoryDbValue = selectedCategory?.dbValue || 'NOTICE';
      
    try {
      if (isEdit && postToEdit) {
        const updatedPostData = {
          id: postToEdit.id,
          title: title,
          content: content,
          category: categoryDbValue,
        };
        await updateBoardPostAPI(postToEdit.id, updatedPostData);
        Toast.show({ type: 'success', text1: t('success'), text2: t('postEditSuccess') });
      } else {
        const newPostData = {
          board_id: userInfo.board_id,
          user_id: userInfo.id,
          title: title,
          content: content,
          category: categoryDbValue,
        };
        await createBoardPostAPI(newPostData);
        Toast.show({ type: 'success', text1: t('success'), text2: t('postCreateSuccess') });
      }
      if (onGoBack) onGoBack(); // 목록 새로고침 콜백 실행
      navigation.goBack();
    } catch (error) {
      console.error("게시글 저장 실패:", error);
      Alert.alert("오류", "게시글을 저장하는 데 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? t('editPost') : t('writeNewPost')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>{t('selectCategory')}</Text>
        <View style={styles.categoryContainer}>
          {predefinedCategories.map((cat) => (
            <TouchableOpacity 
              key={cat.key} 
              style={[styles.categoryButton, categoryKey === cat.key && styles.categoryButtonActive]}
              onPress={() => setCategoryKey(cat.key)}
            >
              <Text style={[styles.categoryText, categoryKey === cat.key && styles.categoryTextActive]}>{t(cat.key as any)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('title')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('titlePlaceholder')} 
          value={title} 
          onChangeText={setTitle} 
          placeholderTextColor={colors.subText}
        />

        <Text style={styles.label}>{t('content')}</Text>
        <TextInput 
          style={[styles.input, styles.contentInput]} 
          placeholder={t('contentPlaceholder')} 
          value={content} 
          onChangeText={setContent} 
          multiline 
          textAlignVertical="top"
          placeholderTextColor={colors.subText}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{isEdit ? t('editComplete') : t('createComplete')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20 },
  
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 20 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.gray, borderWidth: 1, borderColor: 'transparent' },
  categoryButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  categoryText: { fontSize: 14, color: colors.subText, fontWeight: '600' },
  categoryTextActive: { color: colors.primary, fontWeight: 'bold' },
  
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: colors.text },
  contentInput: { minHeight: 200, paddingTop: 16 },
  
  submitButton: { backgroundColor: colors.blue, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  submitButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});

export default BoardWriteScreen;
