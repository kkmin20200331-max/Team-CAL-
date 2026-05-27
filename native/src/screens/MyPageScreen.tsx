// 1. 필요한 기능(React)과 UI 태그(View, Text 등)를 불러옵니다.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. App.tsx에 있던 컴포넌트 코드를 그대로 가져옵니다.
const MyPageScreen = ({ route }: any) => {
  const { setIsLoggedIn } = route.params || {};
  
  return (
    <View style={styles.container}>
      <Text style={{ marginBottom: 20 }}>👤 마이페이지 (준비 중)</Text>
      <Text 
        style={{ color: 'red', fontWeight: 'bold' }} 
        onPress={() => setIsLoggedIn && setIsLoggedIn(false)}
      >
        [로그아웃]
      </Text>
    </View>
  );
};

// 3. 이 화면에서만 쓸 스타일을 아래에 따로 정의해 줍니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  }
});

// 4. 이 화면을 밖(App.tsx)에서 쓸 수 있게 내보냅니다!
export default MyPageScreen;