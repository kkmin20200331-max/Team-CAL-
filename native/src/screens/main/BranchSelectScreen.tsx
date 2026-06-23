import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllStoresAPI, getMyStoreAPI, getStoresAPI, requestStoreJoinAPI } from '../../../api/auth';

const BranchSelectScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const { userInfo, login, logout } = useApp();
  
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [requestingStoreId, setRequestingStoreId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [autoEntering, setAutoEntering] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadStores = async () => {
      if (!userInfo?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = userInfo.role === 'ADMIN'
          ? await getStoresAPI(userInfo.id)
          : await getMyStoreAPI(userInfo.id);

        const data = response.data;
        const normalized = Array.isArray(data) ? data : data ? [data] : [];

        if (!alive) return;

        setStores(normalized);
        if (normalized.length === 1) {
          setSelectedStore(normalized[0]);
        }

        if (userInfo.role !== 'ADMIN' && normalized.length === 0) {
          const allStoreResponse = await getAllStoresAPI();
          if (alive) {
            setAllStores(Array.isArray(allStoreResponse.data) ? allStoreResponse.data : []);
          }
        }
      } catch (error) {
        console.error('지점 조회 오류:', error);
        if (alive) {
          Alert.alert('오류', '근무 지점 정보를 불러오지 못했습니다.');
          setStores([]);
          setAllStores([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadStores();

    return () => {
      alive = false;
    };
  }, [userInfo?.id, userInfo?.role, reloadKey]);

  const handleSelectStore = (store: any) => {
    setSelectedStore(store);
  };

  const getStoreTitle = (store: any) => store.name || store.brandName || '근무 매장';
  const getStoreSubtitle = (store: any) => store.address || store.branchName || store.id;

  const filteredAllStores = allStores.filter((store) => {
    const q = storeSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return `${getStoreTitle(store)} ${getStoreSubtitle(store)}`.toLowerCase().includes(q);
  });

  const handleConfirm = async () => {
    if (!selectedStore) {
      Alert.alert("알림", "근무할 지점을 선택해주세요.");
      return;
    }

    try {
      if (userInfo) {
        await AsyncStorage.setItem(`store_${userInfo.username}`, selectedStore.id);
        
        const updatedUserInfo = {
          ...userInfo,
          store_id: selectedStore.id,
          brandName: selectedStore.name || selectedStore.brandName || '근무 매장',
          branchName: selectedStore.name || selectedStore.branchName || selectedStore.id,
        };
        login(updatedUserInfo, true);
      }

    } catch (error) {
      console.error("지점 선택 저장 오류:", error);
      Alert.alert("오류", "지점 선택 중 문제가 발생했습니다.");
    }
  };

  const renderStoreItem = ({ item }: { item: any }) => {
    const isSelected = selectedStore?.id === item.id;
    const title = getStoreTitle(item);
    const subtitle = getStoreSubtitle(item);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelectStore(item)}
      >
        <Text style={[styles.brandName, isSelected && styles.textSelected]}>{title}</Text>
        <Text style={[styles.branchName, isSelected && styles.textSelected]}>{subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const handleRequestStoreJoin = async (store: any) => {
    if (!userInfo?.id) {
      Alert.alert('오류', '로그인 정보가 없습니다.');
      return;
    }

    Alert.alert(
      '근무 요청',
      `${getStoreTitle(store)}에 근무 요청을 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '요청',
          onPress: async () => {
            setRequestingStoreId(store.id);
            try {
              await requestStoreJoinAPI(userInfo.id, store.id);
              Alert.alert('요청 완료', '관리자에게 근무 요청 알림을 보냈습니다.');
              setReloadKey(prev => prev + 1);
            } catch (error: any) {
              Alert.alert(
                '요청 실패',
                error.response?.data?.message || error.response?.data || '이미 신청했거나 요청을 처리하지 못했습니다.',
              );
            } finally {
              setRequestingStoreId(null);
            }
          },
        },
      ],
    );
  };

  const renderRequestStoreItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.requestStoreName}>{getStoreTitle(item)}</Text>
        <Text style={styles.requestStoreAddress}>{getStoreSubtitle(item)}</Text>
      </View>
      <TouchableOpacity
        style={[styles.requestButton, requestingStoreId === item.id && styles.requestButtonDisabled]}
        onPress={() => handleRequestStoreJoin(item)}
        disabled={requestingStoreId === item.id}
      >
        <Text style={styles.requestButtonText}>
          {requestingStoreId === item.id ? '요청 중' : '요청'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    if (loading || autoEntering || userInfo?.role === 'ADMIN' || stores.length !== 1) return;

    setAutoEntering(true);
    setSelectedStore(stores[0]);

    const enterSingleStore = async () => {
      try {
        const store = stores[0];
        if (!userInfo) return;

        await AsyncStorage.setItem(`store_${userInfo.username}`, store.id);
        login({
          ...userInfo,
          store_id: store.id,
          brandName: store.name || store.brandName || '근무 매장',
          branchName: store.name || store.branchName || store.id,
        }, true);
      } catch (error) {
        console.error('자동 지점 입장 오류:', error);
        Alert.alert('오류', '근무 지점 입장 중 문제가 발생했습니다.');
        setAutoEntering(false);
      }
    };

    enterSingleStore();
  }, [autoEntering, loading, login, stores, userInfo]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{userInfo?.role === 'ADMIN' ? '관리 지점 선택' : '근무 지점 확인'}</Text>
        <Text style={styles.subtitle}>
          {userInfo?.role === 'ADMIN'
            ? '운영할 매장을 선택해주세요.'
            : '승인된 근무 지점으로 자동 입장합니다.'}
        </Text>
      </View>
      <FlatList
        data={userInfo?.role !== 'ADMIN' && stores.length === 0 ? filteredAllStores : stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          userInfo?.role !== 'ADMIN' && !loading && stores.length === 0 ? (
            <View style={styles.searchSection}>
              <Text style={styles.searchTitle}>매장 검색</Text>
              <Text style={styles.searchGuide}>근무할 매장을 검색해서 관리자에게 요청을 보내세요.</Text>
              <TextInput
                style={styles.searchInput}
                value={storeSearchTerm}
                onChangeText={setStoreSearchTerm}
                placeholder="매장명 또는 주소 검색"
                placeholderTextColor={colors.subText}
              />
            </View>
          ) : null
        }
        renderItem={
          userInfo?.role !== 'ADMIN' && stores.length === 0
            ? renderRequestStoreItem
            : renderStoreItem
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#6EE7B7" style={{ marginTop: 40 }} />
          ) : userInfo?.role === 'ADMIN' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>등록된 매장이 없습니다.</Text>
              <Text style={styles.emptyText}>먼저 웹 관리자 화면에서 매장을 등록해주세요.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>검색된 매장이 없습니다.</Text>
              <Text style={styles.emptyText}>매장명 또는 주소를 다시 확인해주세요.</Text>
            </View>
          )
        }
      />
      <View style={styles.bottomContainer}>
        {userInfo?.role === 'ADMIN' && stores.length > 0 && (
          <TouchableOpacity
            style={[styles.confirmButton, !selectedStore && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedStore}
          >
            <Text style={styles.confirmButtonText}>선택 완료</Text>
          </TouchableOpacity>
        )}
        {userInfo?.role !== 'ADMIN' && stores.length > 0 && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>근무 지점으로 이동</Text>
          </TouchableOpacity>
        )}
        {userInfo?.role === 'ADMIN' && stores.length === 0 && (
          <TouchableOpacity style={styles.confirmButton} onPress={() => navigation.navigate('AddBranch')}>
            <Text style={styles.confirmButtonText}>지점 등록</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setReloadKey(prev => prev + 1)}>
          <Text style={styles.secondaryButtonText}>새로고침</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subText,
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  searchGuide: {
    color: colors.subText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: '#6EE7B7', // 에메랄드 색상 테두리
    backgroundColor: '#6EE7B7', // 에메랄드 색상 배경
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  branchName: {
    fontSize: 16,
    color: colors.subText,
    marginTop: 4,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestStoreName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  requestStoreAddress: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  requestButton: {
    backgroundColor: '#6EE7B7',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonText: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.subText,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
  },
  textSelected: {
    color: '#000000', // 검은색 글자
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  confirmButton: {
    backgroundColor: '#6EE7B7', // 에메랄드 색상 배경
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  confirmButtonText: {
    color: '#000000', // 검은색 글자
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default BranchSelectScreen;
