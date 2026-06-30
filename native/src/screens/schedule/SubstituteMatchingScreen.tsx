import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import { getSubstitutePostsAPI, getMySubstitutePostsAPI, getMySubstituteApplicationsAPI, applyForSubstituteAPI } from '../../../api/auth';

const SubstituteMatchingScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { initialTab = 'requests' } = route.params || {};
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();

  const dateLocale = useMemo(() => {
    if (language === 'English') return enUS;
    if (language === '日本語') return ja;
    return ko;
  }, [language]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  const fetchData = async () => {
    if (!userInfo || !userInfo.id || !userInfo.store_id) return;
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const res = await getSubstitutePostsAPI(userInfo.store_id);
        setRequests(res.data.filter((req: any) => req.requester_id !== userInfo.id));
      } else {
        const [postsRes, appsRes] = await Promise.all([
          getMySubstitutePostsAPI(userInfo.id),
          getMySubstituteApplicationsAPI(userInfo.id),
        ]);
        setMyPosts(postsRes.data);
        setMyApplications(appsRes.data);
      }
    } catch (error) {
      console.error(`${activeTab} 데이터 조회 실패:`, error);
      Toast.show({ type: 'error', text1: t('error'), text2: t('loadDataFail') });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [userInfo, activeTab])
  );

  const handleApply = (post: any) => {
    if (!userInfo) return;
    Alert.alert(t('substituteApplyTitle'), t('substituteApplyMsg'), [
      { text: t('cancel'), style: "cancel" },
      { text: t('applyBtn'), onPress: async () => {
        try {
          await applyForSubstituteAPI({
            id: Math.random().toString(36).substring(2, 9),
            substitute_post_id: post.id,
            applicant_user_id: userInfo.id,
            status: 'PENDING',
          });
          Toast.show({ type: 'success', text1: t('applySuccess') });
          fetchData();
        } catch (error) {
          console.error("대타 지원 실패:", error);
          Toast.show({ type: 'error', text1: t('error'), text2: t('errorApplySubstitute') });
        }
      }}
    ]);
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{format(new Date(item.shift_start_time), t('dateFormatPattern'), { locale: dateLocale })}</Text>
        <Text style={styles.timeText}>{`${format(new Date(item.shift_start_time), 'HH:mm')} - ${format(new Date(item.shift_end_time), 'HH:mm')}`}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.requester_name}</Text>
        </View>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>
      <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item)}>
        <Text style={styles.applyButtonText}>{t('applyBtn')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isMyPost = item.requester_id === userInfo?.id;
    const cardContent = (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{format(new Date(item.shift_start_time || item.created_at), t('dateFormatPattern'), { locale: dateLocale })}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.reasonText}>{item.reason || t('appliedToPost').replace('{id}', item.post_id || '')}</Text>
        </View>
        <View style={styles.statusFooter}>
          <Text style={styles.statusText}>
            {isMyPost ? t('myRequest') : t('myApplication')} - {item.status}
          </Text>
        </View>
      </View>
    );

    if (isMyPost) {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('MySubstitutePostDetail', { post: item })}>
          {cardContent}
        </TouchableOpacity>
      );
    }
    return cardContent;
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />;
    }
    if (activeTab === 'requests') {
      return (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noSubstituteRequests')}</Text>}
        />
      );
    }
    return (
      <FlatList
        data={[...myPosts, ...myApplications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('noHistory')}</Text>}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('findSubstitute')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>{t('substituteRequests')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>{t('history')}</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.subText },
  activeTabText: { color: colors.primary, fontWeight: 'bold' },
  listContainer: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  timeText: { fontSize: 16, color: colors.subText },
  cardBody: { marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userName: { fontSize: 15, color: colors.text, fontWeight: '600' },
  reasonText: { fontSize: 15, color: colors.subText, fontStyle: 'italic', marginTop: 4 },
  applyButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  statusFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 },
  statusText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: colors.subText },
});

export default SubstituteMatchingScreen;
