import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getSubstituteApplicantsAPI, approveSubstituteAPI } from '../../../api/auth'; // 함수명 변경
import { format } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import { useLanguage } from '../../contexts/LanguageContext';

const MySubstitutePostDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { post } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const { t, language } = useLanguage();

  const dateLocale = useMemo(() => {
    if (language === 'English') return enUS;
    if (language === '日本語') return ja;
    return ko;
  }, [language]);

  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    if (!post || !post.id) return;
    setLoading(true);
    try {
      const res = await getSubstituteApplicantsAPI(post.id); // 함수명 변경
      setApplicants(res.data);
    } catch (error) {
      console.error("지원자 목록 조회 실패:", error);
      Alert.alert(t('error'), t('loadApplicantsFail'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplicants();
    }, [post])
  );

  const handleSelectApplicant = (applicant: any) => {
    Alert.alert(
      t('selectSubstitute'),
      t('selectSubstituteConfirm').replace('{name}', applicant.name),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              // TODO: 현재 API는 관리자 최종 승인용. 
              // 직원이 '선택'하는 중간 단계를 위한 별도 API가 백엔드에 필요함.
              // (예: updateSubstitutePostStatus(postId, 'SELECTED', applicant.id))
              
              Alert.alert(t('selectComplete'), t('selectSubstituteSuccess').replace('{name}', applicant.name));
              navigation.goBack();

            } catch (error) {
              console.error("대타 선택 처리 오류:", error);
              Alert.alert(t('error'), t('processErrorMsg'));
            }
          },
        },
      ]
    );
  };

  const renderApplicantItem = ({ item }: { item: any }) => (
    <View style={styles.applicantCard}>
      <Text style={styles.applicantName}>{item.name}</Text>
      <TouchableOpacity style={styles.selectButton} onPress={() => handleSelectApplicant(item)}>
        <Text style={styles.selectButtonText}>{t('select')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('applicantsList')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.postInfo}>
        <Text style={styles.postDate}>{format(new Date(post.shift_start_time), t('dateFormatPattern'), { locale: dateLocale })}</Text>
        <Text style={styles.postTime}>{`${format(new Date(post.shift_start_time), 'HH:mm')} - ${format(new Date(post.shift_end_time), 'HH:mm')}`}</Text>
        <Text style={styles.postReason}>{post.reason}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={applicants}
          renderItem={renderApplicantItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noApplicantsYet')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  postInfo: { padding: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  postDate: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  postTime: { fontSize: 16, color: colors.subText, marginTop: 4 },
  postReason: { fontSize: 15, color: colors.text, marginTop: 12, fontStyle: 'italic' },
  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyText: { fontSize: 16, color: colors.subText },
  applicantCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, padding: 16, marginBottom: 12 },
  applicantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  selectButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  selectButtonText: { color: colors.white, fontWeight: 'bold' },
});

export default MySubstitutePostDetailScreen;
