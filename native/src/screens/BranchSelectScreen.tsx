import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type BranchScreenNavigationProp = StackNavigationProp<any, 'BranchSelect'>;

type Props = {
  navigation: BranchScreenNavigationProp;
  setHasSelectedBranch: (value: boolean) => void;
  userInfo?: any;
  setUserInfo?: (value: any) => void;
};

// 테스트용 지점 데이터
const BRANCH_DATA = [
  { id: '1', name: '컴포즈 미금점' },
  { id: '2', name: '컴포즈 서현점' },
  { id: '3', name: '컴포즈 판교점' },
];

const BranchSelectScreen = ({ setHasSelectedBranch, userInfo, setUserInfo }: Props) => {
  // 사용자가 현재 터치한 지점의 ID를 저장하는 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // '선택 완료' 버튼을 눌렀을 때 실행
  const handleConfirm = () => {
    if (selectedId) {
      // ✅ [수정] 선택한 지점 이름을 추출하여 userInfo에 업데이트합니다.
      const selectedBranch = BRANCH_DATA.find(b => b.id === selectedId);
      if (setUserInfo && userInfo && selectedBranch) {
        setUserInfo({ ...userInfo, store_id: selectedBranch.name });
      }

      // 💡 여기서 상태가 true로 바뀌면 App.js의 조건문이 실행되어 Pending(또는 Dashboard) 화면으로 넘어갑니다.
      setHasSelectedBranch(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>지점 선택</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.subtitle}>근무하실 지점을 선택해주세요.</Text>

        {/* 지점 리스트 렌더링 */}
        <FlatList
          data={BRANCH_DATA}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                style={[styles.branchCard, isSelected && styles.branchCardSelected]}
                onPress={() => setSelectedId(item.id)}
              >
                <Text style={[styles.branchName, isSelected && styles.branchNameSelected]}>
                  📍 {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* 하단 고정 완료 버튼 */}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedId && styles.confirmButtonDisabled]}
          disabled={!selectedId} // 아무것도 안 골랐으면 버튼 비활성화
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>선택 완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  listContainer: {
    gap: 12, // 리스트 아이템 간의 간격
  },
  branchCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  branchCardSelected: {
    borderColor: '#2563EB', // 선택 시 테두리 파란색
    backgroundColor: '#EFF6FF', // 선택 시 배경 옅은 파란색
  },
  branchName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  branchNameSelected: {
    color: '#2563EB', // 선택 시 글자색 파란색
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB', // 비활성화 시 회색
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default BranchSelectScreen;