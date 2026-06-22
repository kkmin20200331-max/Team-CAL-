import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { getAllStoresAPI, applyForStoreAPI } from '../../../api/auth';

const BranchSelectScreen = () => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo, login, logout } = useApp();

  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const res = await getAllStoresAPI();
        setStores(res.data);
        if (res.data.length === 0) {
          Alert.alert("알림", "현재 근무 신청할 수 있는 매장이 없습니다. 관리자에게 문의하세요.", [{ text: "확인", onPress: () => logout() }]);
        }
      } catch (error) {
        console.error("매장 목록 조회 실패:", error);
        Alert.alert("오류", "매장 목록을 불러오는 데 실패했습니다.", [{ text: "확인", onPress: () => logout() }]);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [logout]);

  const handleSelectStore = (store: any) => {
    setSelectedStore(store);
  };

  const handleConfirm = async () => {
    if (!selectedStore || !userInfo) {
      Alert.alert("알림", "근무할 매장을 선택해주세요.");
      return;
    }

    Alert.alert(
      "근무 신청 확인",
      `${selectedStore.name} 매장에 근무를 신청하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "신청하기",
          onPress: async () => {
            setLoading(true);
            try {
              await applyForStoreAPI({
                id: `sm-${Date.now().toString(36)}`,
                store_id: selectedStore.id,
                user_id: userInfo.id,
                member_role: 'STAFF',
                user_level: 1,
                approval_status: 'PENDING',
                pay_type: 'HOURLY',
                pay_amount: 0,
              });
              
              // 사용자의 상태를 'PENDING'으로 업데이트하고 앱의 상태를 갱신
              const updatedUserInfo = { ...userInfo, status: 'PENDING' };
              login(updatedUserInfo, false);

            } catch (error) {
              console.error("근무 신청 실패:", error);
              Alert.alert("오류", "근무 신청 중 문제가 발생했습니다.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderStoreItem = ({ item }: { item: any }) => {
    const isSelected = selectedStore?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelectStore(item)}
      >
        <Text style={[styles.brandName, isSelected && styles.textSelected]}>{item.name}</Text>
        <Text style={[styles.branchName, isSelected && styles.textSelected]}>{item.address}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>근무 매장 신청</Text>
        <Text style={styles.subtitle}>근무를 희망하는 매장을 선택하고 신청을 완료해주세요.</Text>
      </View>
      <FlatList
        data={stores}
        renderItem={renderStoreItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedStore && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedStore}
        >
          <Text style={[styles.confirmButtonText, !selectedStore && styles.confirmButtonTextDisabled]}>근무 신청하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, color: colors.subText, marginTop: 8 },
  listContainer: { paddingHorizontal: 20 },
  card: { backgroundColor: colors.card, borderRadius: 8, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: colors.border },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  brandName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  branchName: { fontSize: 16, color: colors.subText, marginTop: 4 },
  textSelected: { color: colors.white },
  bottomContainer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  confirmButton: { backgroundColor: colors.primary, padding: 16, alignItems: 'center', borderRadius: 8 },
  confirmButtonDisabled: { backgroundColor: colors.disabled },
  confirmButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  confirmButtonTextDisabled: { color: colors.subText },
});

export default BranchSelectScreen;
