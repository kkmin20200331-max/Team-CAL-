import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
// Expo Camera 최신 API
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { checkAttendanceByQrAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';

type QRCheckInScreenNavigationProp = StackNavigationProp<any, 'QRCheckIn'>;

type Props = {
  navigation: QRCheckInScreenNavigationProp;
};

const QRCheckInScreen = ({ navigation }: Props) => {
  const { userInfo } = useApp();
  // 카메라 권한 상태와 권한 요청 함수를 가져옵니다.
  const [permission, requestPermission] = useCameraPermissions();
  // 중복 스캔(여러 번 연속으로 찍히는 것)을 방지하기 위한 상태
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const extractQrToken = (data: string) => {
    try {
      const parsed = new URL(data);
      return parsed.searchParams.get('token') || data;
    } catch {
      return data;
    }
  };

  // 1. 카메라 권한 로딩 중일 때
  if (!permission) {
    return <View style={styles.container} />;
  }

  // 2. 카메라 권한이 거부되었거나 아직 묻지 않았을 때
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

  // 3. QR 코드가 성공적으로 스캔되었을 때 실행되는 함수
  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true); // 중복 스캔 방지
    setProcessing(true);

    if (!userInfo?.id) {
      Toast.show({
        type: 'error',
        text1: '로그인 정보가 없습니다.',
        text2: '다시 로그인 후 시도해주세요.',
      });
      setProcessing(false);
      setScanned(false);
      return;
    }

    try {
      const qrToken = extractQrToken(data);
      const response = await checkAttendanceByQrAPI(userInfo.id, qrToken);

      Toast.show({
        type: 'success',
        text1: '출퇴근 처리 완료',
        text2: response.data?.message || '정상 처리되었습니다.',
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: '출퇴근 처리 실패',
        text2: error.response?.data?.message || 'QR 코드를 다시 스캔해주세요.',
      });
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 카메라 뷰 */}
      <CameraView 
        style={styles.camera} 
        facing="back" // 후면 카메라 사용
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // QR 코드만 스캔하도록 설정
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        
        {/* 카메라 위에 띄우는 UI (가이드라인, 닫기 버튼 등) */}
        <View style={styles.overlay}>
          {/* 상단 닫기 버튼 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕ 닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 중앙 사각형 타겟 가이드라인 */}
          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* 하단 안내 문구 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {processing ? '출퇴근 처리 중입니다...' : '사각 영역 안에 QR 코드를 맞춰주세요.'}
            </Text>
          </View>
        </View>

      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    color: '#fff',
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    padding: 15,
    marginHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // 반투명 검은 배경
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
    color: '#FFF',
    fontWeight: 'bold',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  // --- QR 타겟 프레임 디자인 ---
  targetFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    // 가운데가 투명하게 뚫린 효과를 위해
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', 
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
});

export default QRCheckInScreen;
