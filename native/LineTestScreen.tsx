import React from 'react';
import { View, Button, StyleSheet, Text, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API } from './api/auth';

const LineTestScreen = () => {
  const MOCK_USER_ID = 'test-user-for-line'; 

  const handleLinkLine = async () => {
    try {
      const baseURL = API.defaults.baseURL;
      if (!baseURL) {
        Alert.alert('오류', 'API 기본 URL이 설정되지 않았습니다.');
        return;
      }

      // --- 올바른 리다이렉트 경로로 수정 ---
      const correctRedirectUri = `${baseURL}/line/callback`;
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2010414057&redirect_uri=${encodeURIComponent(correctRedirectUri)}&scope=profile%20openid&state=${MOCK_USER_ID}`;

      Alert.alert(
        "최종 URL 확인",
        `LINE으로 보내는 최종 URL:\n\n${lineAuthUrl}\n\n이제 redirect_uri에 '/line'이 포함되었습니다.`,
        [
          { text: "취소", style: "cancel" },
          { text: "이 URL로 열기", onPress: () => WebBrowser.openBrowserAsync(lineAuthUrl) }
        ]
      );

    } catch (error) {
      console.error('LINE 연동 중 오류 발생:', error);
      Alert.alert('오류', `LINE 연동 중 문제가 발생했습니다: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LINE 연동 최종 테스트</Text>
      <Text style={styles.description}>
        아래 버튼을 누르면 백엔드를 거치지 않고, LINE 인증 URL을 직접 생성하여 엽니다.
      </Text>
      <Button title="LINE 인증 URL 직접 열기" onPress={handleLinkLine} />
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
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'gray',
  },
});

export default LineTestScreen;
