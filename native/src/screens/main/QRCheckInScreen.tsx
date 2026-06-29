import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import { checkAttendanceByQrAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

type QRCheckInScreenNavigationProp = StackNavigationProp<any, 'QRCheckIn'>;

type Props = {
  navigation: QRCheckInScreenNavigationProp;
};

const QRCheckInScreen = ({ navigation }: Props) => {
  const { userInfo } = useApp();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const extractQrToken = (data: string) => {
    const trimmed = data.trim();
    if (!trimmed) return '';

    const match = trimmed.match(/[?&]token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : trimmed;
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color={colors.subText} style={styles.permissionIcon} />
        <Text style={styles.message}>출퇴근 QR 코드를 스캔하려면 카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>카메라 권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    if (!userInfo?.id) {
      Toast.show({
        type: 'error',
        text1: '로그인 정보가 없습니다.',
        text2: '다시 로그인해 주세요.',
      });
      setProcessing(false);
      setScanned(false);
      return;
    }

    try {
      const qrToken = extractQrToken(data);
      if (!qrToken) {
        throw new Error('QR 토큰을 찾을 수 없습니다.');
      }

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
        text2: error.response?.data?.message || error.message || 'QR 코드를 다시 스캔해주세요.',
      });
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
          </View>

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

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#F9FAFB',
  },
  permissionIcon: {
    marginBottom: 20,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingBottom: 24,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  targetFrame: {
    alignSelf: 'center',
    width: 260,
    height: 260,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
});

export default QRCheckInScreen;
