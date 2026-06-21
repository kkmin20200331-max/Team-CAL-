import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { getStaffListAPI, getGuestListAPI } from '../../../api/auth';
import { useFocusEffect } from '@react-navigation/native';

const EmployeeManagementScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    if (!userInfo || !userInfo.store_id) return;

    setLoading(true);
    try {
      // 1. 활동 중인 직원 목록 API 호출
      // URL: /api/users?store_id={store_id}
      // DB: STORE_MEMBER 테이블에서 status가 'ACTIVE'인 직원을 USERS 테이블과 조인하여 조회
      const activeRes = await getStaffListAPI(userInfo.store_id);
      setActiveEmployees(activeRes.data);

      // 2. 승인 대기 직원 목록 API 호출
      // URL: /api/users/guest?store_id={store_id}&role=GUEST
      // DB: STORE_MEMBER 테이블에서 status가 'PENDING'인 직원을 USERS 테이블과 조인하여 조회
      const pendingRes = await getGuestListAPI(userInfo.store_id, 'GUEST');
      setPendingEmployees(pendingRes.data);

    } catch (error) {
      console.error("직원 목록을 불러오는 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  // 화면에 들어올 때마다 데이터를 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [userInfo])
  );

  const sections = [
    { title: '승인 대기', data: pendingEmployees },
    { title: '활동 중인 직원', data: activeEmployees },
  ].filter(section => section.data.length > 0);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => navigation.navigate('EmployeeDetail', { employee: item, onGoBack: fetchEmployees })}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemRole}>{item.nickname}</Text>
      </View>
      <Text style={styles.arrow}>〉</Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{title} ({section.data.length})</Text>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>직원 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 관리</Text>
        <View style={{ width: 40 }} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>소속된 직원이 없습니다.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: colors.text },
  emptyText: { fontSize: 16, color: colors.subText },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { paddingHorizontal: 16 },
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
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemRole: {
    fontSize: 14,
    color: colors.subText,
    marginLeft: 8,
  },
  arrow: {
    fontSize: 20,
    color: colors.subText,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default EmployeeManagementScreen;