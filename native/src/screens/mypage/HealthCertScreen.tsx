import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 테마 Context 추가
import { useApp } from '../../contexts/AppContext'; // ✅ AppContext 추가
import { useFocusEffect } from '@react-navigation/native'; // ✅ useFocusEffect 추가
import { getHealthCertsAPI, uploadFileAPI } from '../../../api/auth'; // ✅ API 추가

const HealthCertScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { userInfo } = useApp();
  
  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  
  // 현재 날짜를 기준으로 만료 상태를 계산하는 함수
  const calculateStatus = (expiryDate: string | null, backendStatus: string) => {
    if (backendStatus === 'pending') return 'pendingApproval';
    if (backendStatus === 'rejected') return 'rejected'; // 반려 상태 추가
    if (!expiryDate) {
      return backendStatus === 'verified' ? 'valid' : 'pendingApproval';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 제외 (자정 기준)
    const expiry = new Date(expiryDate);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired'; // 이미 지남 (만료)
    if (diffDays <= 30) return 'needsRenewal'; // 30일 이내 (갱신 요망)
    return 'valid'; // 30일 초과 (정상)
  };

  // ✅ 승인 상태(approvalStatus)가 추가된 데이터 구조
  interface HealthCert {
    id: string;
    title: string;
    expiryDate: string | null; // 승인 대기 중에는 만료일이 없음
    approvalStatus: 'verified' | 'pending' | 'rejected' | 'expired';
  }

  // ✅ 실 데이터를 저장할 리스트 상태
  const [certList, setCertList] = useState<HealthCert[]>([]);

  // 선택된 이미지와 업로드 로딩 상태 관리
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📂 보건증 데이터 불러오기
  const loadHealthCerts = async () => {
    if (!userInfo?.id) return;
    try {
      const response = await getHealthCertsAPI(userInfo.id);
      if (Array.isArray(response.data)) {
        const mapped = response.data.map((item: any) => {
          let formattedExpiry = null;
          if (item.expiry_date) {
            formattedExpiry = item.expiry_date.substring(0, 10);
          }
          return {
            id: item.id,
            title: item.original_name || t('healthCert'),
            expiryDate: formattedExpiry,
            approvalStatus: (item.status || 'PENDING').toLowerCase() as any,
          };
        });
        setCertList(mapped);
      }
    } catch (error) {
      console.error('보건증 조회 오류:', error);
    }
  };

  // 화면 진입 시 로드
  useFocusEffect(
    React.useCallback(() => {
      loadHealthCerts();
    }, [userInfo?.id])
  );

  // 📸 갤러리 열기 함수
  const handlePickImage = async () => {
    // 1. 갤러리 접근 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequired'), t('galleryPermissionRequired'));
      return;
    }

    // 2. 갤러리에서 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // 문서 전체가 보이도록 편집 해제
      quality: 0.8, // 0~1 사이의 압축률 (서버 전송 용량 최적화)
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); // 선택한 이미지 URI 저장
    }
  };

  // 🚀 백엔드 전송 함수
  const handleUploadToBackend = async () => {
    if (!selectedImage || !userInfo?.id) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      let filename = selectedImage.split('/').pop() || 'health_cert.jpg';
      if (!filename.includes('.')) {
        filename = `${filename}.jpg`;
      }
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('file', {
        uri: selectedImage,
        name: filename,
        type: type
      } as any);

      const storeId = userInfo?.activeBranchId || userInfo?.store_id || 'STORE_DEFAULT';
      formData.append('store_id', storeId);
      formData.append('user_id', userInfo?.id || '');
      formData.append('file_type', 'health-cert');

      await uploadFileAPI(formData);

      setSelectedImage(null); // 초기화
      Alert.alert(t('uploadComplete'), t('healthCertUploadedMsg'));
      loadHealthCerts();
    } catch (error) {
      console.error('보건증 업로드 중 에러:', error);
      Alert.alert(t('error'), t('uploadErrorMsg'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('healthCert')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* 보건증 상태 카드 (리스트 반복 렌더링) */}
        {certList.map((cert) => {
          const status = calculateStatus(cert.expiryDate, cert.approvalStatus);
          
          return (
            <View key={cert.id} style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{cert.title}</Text>
                <View style={[
                  styles.badge,
                  status === 'expired' && styles.badgeExpired,
                  status === 'needsRenewal' && styles.badgeWarning,
                  status === 'pendingApproval' && styles.badgePending, 
                  status === 'rejected' && styles.badgeExpired, 
                ]}>
                  <Text style={[
                    styles.badgeText,
                    status === 'expired' && styles.badgeTextExpired,
                    status === 'needsRenewal' && styles.badgeTextWarning,
                    status === 'pendingApproval' && styles.badgeTextPending, 
                    status === 'rejected' && styles.badgeTextExpired, 
                  ]}>
                    {status === 'rejected' ? t('rejected') : t(status)}
                  </Text>
                </View>
              </View>

              {status === 'pendingApproval' ? (
                <Text style={[styles.warningText, { color: isDarkMode ? '#FDE68A' : '#D97706' }]}>
                  {t('pendingApprovalMsg')}
                </Text>
              ) : status === 'rejected' ? (
                <Text style={[styles.warningText, { color: isDarkMode ? '#FECACA' : '#DC2626' }]}>
                  {t('rejectedApprovalMsg')}
                </Text>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('expiryDate')}</Text>
                    <Text style={[
                      styles.infoValue, 
                      status === 'expired' && { color: isDarkMode ? '#FECACA' : '#DC2626' },
                      status === 'needsRenewal' && { color: isDarkMode ? '#FDE68A' : '#D97706' }
                    ]}>
                      {cert.expiryDate}
                    </Text>
                  </View>

                  {status === 'expired' && (
                    <Text style={[styles.warningText, { color: isDarkMode ? '#FECACA' : '#DC2626' }]}>{t('healthCertExpiredMsg')}</Text>
                  )}
                  {status === 'needsRenewal' && (
                    <Text style={[styles.warningText, { color: isDarkMode ? '#FDE68A' : '#D97706' }]}>{t('healthCertRenewalNotice')}</Text>
                  )}
                </>
              )}
            </View>
          );
        })}

        {certList.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.subText, fontSize: 14 }}>{t('noHealthCertsRegistered')}</Text>
          </View>
        )}

        {/* 이미지 업로드 / 미리보기 영역 */}
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewButtonGroup}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedImage(null)} disabled={isUploading}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleUploadToBackend} disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('sendToServer')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadTitle}>{t('uploadNew')}</Text>
            <Text style={styles.uploadDesc}>{t('uploadDescription')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.helpText}>{t('ocrDisclaimer')}</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ 테마 색상을 인자로 받아 동적으로 스타일을 생성하도록 변경
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 10 },
  badge: { backgroundColor: isDarkMode ? '#14532D' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: isDarkMode ? '#86EFAC' : '#16A34A', fontSize: 13, fontWeight: '700' },
  badgeExpired: { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' },
  badgeTextExpired: { color: isDarkMode ? '#FECACA' : '#DC2626' },
  badgeWarning: { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' },
  badgeTextWarning: { color: isDarkMode ? '#FDE68A' : '#D97706' },
  badgePending: { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' },
  badgeTextPending: { color: isDarkMode ? '#FDE68A' : '#D97706' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  warningText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  uploadBox: {
    backgroundColor: colors.card, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#93C5FD', borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.subText },
  helpText: { fontSize: 12, color: colors.subText, textAlign: 'center' },
  
  previewContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default HealthCertScreen;
