import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';

// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type PendingScreenNavigationProp = StackNavigationProp<any, 'Pending'>;

type Props = {
  navigation: PendingScreenNavigationProp;
  setIsLoggedIn: (value: boolean) => void;
};

const PendingScreen = ({ navigation, setIsLoggedIn }: Props) => {
  // 상태 새로고침 (실제로는 API 재호출 로직이 들어갑니다)
  const handleRefresh = () => {
    // 메모: 승인 상태 조회 API가 연결되면 여기에서 재호출합니다.
  };

  // 👇 [수정] goBack 대신 상태를 로그아웃(false)으로 변경합니다.
  const handleLogout = () => {
    setIsLoggedIn(false); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>

{/* 상단 헤더 영역 (뒤로 가기 버튼 포함) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>승인 대기</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.container}>
        {/* 아이콘이나 로고가 들어갈 자리 */}
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>⏳</Text>
        </View>

        <Text style={styles.title}>관리자 승인 대기 중</Text>
        
        <Text style={styles.description}>
          회원가입이 성공적으로 완료되었습니다.{'\n'}
          관리자가 계정을 승인한 후 서비스 이용이 가능합니다.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRefresh}>
            <Text style={styles.primaryButtonText}>승인 상태 확인하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <Text style={styles.secondaryButtonText}>다른 계정으로 로그인</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // 상단 커스텀 헤더 스타일
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRightPlaceholder: {
    width: 40, // 좌측 버튼과 균형을 맞추기 위한 빈 공간
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -56, // 헤더 높이만큼 컨텐츠를 위로 올려 완벽한 수직 중앙 정렬 구현
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default PendingScreen;
