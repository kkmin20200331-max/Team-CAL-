import React from 'react';
import { View, Button, StyleSheet, Text, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API } from './api/auth'; // API 인스턴스를 가져옵니다.

const LineTestScreen = () => {
  // --- 테스트 설정 ---
  // 중요: 이 부분은 실제 앱에서는 로그인 상태에서 가져온 현재 사용자 ID로 바꿔야 합니다.
  const MOCK_USER_ID = 'test-user-from-native'; 

  const handleLinkLine = async () => {
    try {
      // auth.ts에 설정된 baseURL을 사용하여 전체 URL을 동적으로 생성합니다.
      const baseURL = API.defaults.baseURL;
      if (!baseURL) {
        Alert.alert('오류', 'API 기본 URL이 설정되지 않았습니다.');
        return;
      }

      const lineLoginUrl = `${baseURL}/line/login?userId=${MOCK_USER_ID}`;
      
      console.log('Opening URL:', lineLoginUrl);
      Alert.alert('LINE 연동 시작', `다음 URL을 웹 브라우저에서 엽니다:\n\n${lineLoginUrl}`);

      // Expo의 WebBrowser를 사용하여 인앱 브라우저를 엽니다.
      const result = await WebBrowser.openBrowserAsync(lineLoginUrl);

      // 브라우저가 닫힌 후의 결과 처리
      console.log('WebBrowser result:', result);
      Alert.alert('연동 과정 완료', 'LINE 연동 과정이 브라우저에서 완료되었습니다. 데이터베이스를 확인하여 연동 성공 여부를 체크하세요.');

    } catch (error) {
      console.error('LINE 연동 중 오류 발생:', error);
      Alert.alert('오류', `LINE 연동 중 문제가 발생했습니다: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LINE 연동 테스트</Text>
      <Text style={styles.description}>
        아래 버튼을 누르면 '{MOCK_USER_ID}' 사용자에 대한 LINE 연동이 시작됩니다.
      </Text>
      <Button title="LINE 계정 연동하기" onPress={handleLinkLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'gray',
  },
});

export default LineTestScreen;
