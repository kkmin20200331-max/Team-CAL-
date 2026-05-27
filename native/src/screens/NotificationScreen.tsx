import { View, Text, StyleSheet } from 'react-native';

// 🔔 알림 화면
const NotificationScreen = () => (
  <View style={styles.tempView}><Text>🔔 알림 리스트 화면 (준비 중)</Text></View>
);

// 간단한 스타일 추가
const styles = StyleSheet.create({
  tempView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  }
});

export default NotificationScreen;