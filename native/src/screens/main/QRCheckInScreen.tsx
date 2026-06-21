import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { attendanceCheckAPI } from '../../../api/auth';

type QRCheckInScreenNavigationProp = StackNavigationProp<any, 'QRCheckIn'>;

type Props = {
  navigation: QRCheckInScreenNavigationProp;
};

const QRCheckInScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>출퇴근 QR 코드를 스캔하려면 카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>카메라 권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data: storeId }: { data: string }) => {
    if (!userInfo || !userInfo.id) {
      Alert.alert("오류", "사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setScanned(true);
    setLoading(true);

    try {
      // URL: /api/attendance/check (POST)
      // Body: { store_id: "...", user_id: "..." }
      // DB: ATTENDANCE 테이블에서 마지막 기록을 확인하여 출근 또는 퇴근 처리
      const response = await attendanceCheckAPI(storeId, userInfo.id);
      
      // 백엔드에서 "출근 처리되었습니다." 또는 "퇴근 처리되었습니다." 메시지를 반환
      Alert.alert("처리 완료", response.data, [
        { text: "확인", onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error("출퇴근 처리 오류:", error);
      const errorMessage = error.response?.data || "출퇴근 처리에 실패했습니다.";
      Alert.alert("오류", errorMessage, [
        { text: "다시 시도", onPress: () => {
          setScanned(false);
          setLoading(false);
        }}
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕ 닫기</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>출퇴근 기록 처리 중...</Text>
            </View>
          ) : (
            <>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.footer}>
                <Text style={styles.footerText}>사각 영역 안에 QR 코드를 맞춰주세요.</Text>
              </View>
            </>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    color: colors.white,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    padding: 15,
    marginHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  targetFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', 
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.white,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    marginTop: 10,
    fontSize: 16,
  },
});

export default QRCheckInScreen;
