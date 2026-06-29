import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getStorePendingStaffAPI, getStoreStaffAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Ionicons from '@expo/vector-icons/Ionicons';

type StaffRow = {
  id: string;
  name: string;
  username?: string;
  phone?: string;
  role?: string;
  status?: string;
  sectionStatus: 'ACTIVE' | 'PENDING';
};

const EmployeeManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const { t } = useLanguage();
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [activeStaff, setActiveStaff] = useState<StaffRow[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (!storeId) {
      setActiveStaff([]);
      setPendingStaff([]);
      return;
    }

    setLoading(true);
    try {
      const [staffRes, pendingRes] = await Promise.allSettled([
        getStoreStaffAPI(storeId),
        getStorePendingStaffAPI(storeId),
      ]);

      const mapStaff = (item: any, sectionStatus: 'ACTIVE' | 'PENDING'): StaffRow => ({
        id: item.id,
        name: item.name || item.username || item.id,
        username: item.username,
        phone: item.phone,
        role: item.role,
        status: item.status,
        sectionStatus,
      });

      setActiveStaff(
        staffRes.status === 'fulfilled' && Array.isArray(staffRes.value.data)
          ? staffRes.value.data.map((item: any) => mapStaff(item, 'ACTIVE'))
          : [],
      );
      setPendingStaff(
        pendingRes.status === 'fulfilled' && Array.isArray(pendingRes.value.data)
          ? pendingRes.value.data.map((item: any) => mapStaff(item, 'PENDING'))
          : [],
      );
    } catch (error) {
      console.error('직원 목록 조회 실패:', error);
      Toast.show({
        type: 'error',
        text1: t('staffListLoadFailed'),
        text2: t('staffListLoadFailedMsg'),
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useFocusEffect(
    useCallback(() => {
      loadEmployees();
    }, [loadEmployees]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const next = [];
    if (pendingStaff.length > 0) next.push({ title: t('pendingApproval'), data: pendingStaff });
    if (activeStaff.length > 0) next.push({ title: t('workingEmployees'), data: activeStaff });
    return next;
  }, [activeStaff, pendingStaff, t]);

  const renderItem = ({ item }: { item: StaffRow }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('EmployeeDetail', { employee: item })}
    >
      <View style={styles.itemInfo}>
        <View
          style={[
            styles.colorDot,
            { backgroundColor: item.sectionStatus === 'PENDING' ? '#F59E0B' : colors.primary },
          ]}
        />
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>
            {[item.username, item.phone].filter(Boolean).join(' · ') || item.id}
          </Text>
        </View>
      </View>
      <Text style={styles.itemRole}>
        {item.sectionStatus === 'PENDING' ? t('pendingLabel') : item.role || 'STAFF'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonWrapper}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('employeeManagement')}</Text>
        <TouchableOpacity onPress={loadEmployees}>
          <Text style={styles.refreshText}>{t('refresh')}</Text>
        </TouchableOpacity>
      </View>

      {loading && sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>{t('loadingStaff')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{t('noEmployeesTitle')}</Text>
              <Text style={styles.emptyText}>{t('noEmployeesDesc')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButtonWrapper: { width: 72, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    refreshText: { color: colors.primary, fontSize: 14, fontWeight: '700', width: 72, textAlign: 'right' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 24 },
    sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.subText,
      paddingVertical: 12,
      paddingTop: 24,
      backgroundColor: colors.background,
    },
    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
    itemMeta: { fontSize: 12, color: colors.subText, marginTop: 3 },
    itemRole: { fontSize: 13, color: colors.subText, marginLeft: 8, fontWeight: '700' },
    separator: { height: 8 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.subText, textAlign: 'center', marginTop: 10 },
  });

export default EmployeeManagementScreen;
