import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const dummyStores = [
  { id: 'store_1', brandName: '컴포즈커피', branchName: '미금점' },
  { id: 'store_2', brandName: '스타벅스', branchName: '정자점' },
  { id: 'store_3', brandName: '메가커피', branchName: '오리점' },
  { id: 'store_4', brandName: '컴포즈커피', branchName: '서현점' },
];

const BranchSelectScreen = () => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const { userInfo, login } = useApp();
  
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const handleSelectStore = (store: any) => {
    setSelectedStore(store);
  };

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
          brandName: selectedStore.brandName,
          branchName: selectedStore.branchName,
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
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelectStore(item)}
      >
        <Text style={[styles.brandName, isSelected && styles.textSelected]}>{item.brandName}</Text>
        <Text style={[styles.branchName, isSelected && styles.textSelected]}>{item.branchName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>근무 지점 선택</Text>
        <Text style={styles.subtitle}>근무할 지점을 선택해주세요.</Text>
      </View>
      <FlatList
        data={dummyStores}
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
          <Text style={[styles.confirmButtonText, !selectedStore && styles.confirmButtonTextDisabled]}>선택 완료</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
  textSelected: {
    color: colors.white,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: colors.subText,
  },
});

export default BranchSelectScreen;