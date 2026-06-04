import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 테마 Context 추가

const HealthCertScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  
  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  
  // 현재 날짜를 기준으로 만료 상태를 계산하는 함수
  const calculateStatus = (expiryDate: string | null) => {
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
    approvalStatus: 'verified' | 'pending';
  }

  // ✅ 승인 상태가 포함된 더미 데이터 리스트
  const [certList, setCertList] = useState<HealthCert[]>([
    { id: '1', title: '보건증 (최신)', expiryDate: '2027-05-20', approvalStatus: 'verified' },
    { id: '2', title: '보건증 (갱신 임박)', expiryDate: '2026-06-20', approvalStatus: 'verified' },
    { id: '3', title: '보건증 (과거)', expiryDate: '2025-01-15', approvalStatus: 'verified' },
  ]);

  // 선택된 이미지와 업로드 로딩 상태 관리
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📸 갤러리 열기 함수
  const handlePickImage = async () => {
    // 1. 갤러리 접근 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    // 2. 갤러리에서 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // 크롭 등 편집 허용
      quality: 0.8, // 0~1 사이의 압축률 (서버 전송 용량 최적화)
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); // 선택한 이미지 URI 저장
    }
  };

  // 🚀 백엔드 전송 시뮬레이션 함수
  const handleUploadToBackend = async () => {
    if (!selectedImage) return;
    
    setIsUploading(true);
    try {
      // ✅ [TODO: 실제 백엔드 연동 시 아래 코드를 사용하세요]
      // const formData = new FormData();
      // formData.append('file', { uri: selectedImage, name: 'health_cert.jpg', type: 'image/jpeg' } as any);
      // await axios.post('YOUR_API_URL/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});

      // 임시로 1.5초 대기 (서버 통신 흉내)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ [수정] 업로드 시 '승인 대기' 상태의 새 보건증을 목록 맨 위에 추가
      const newCert: HealthCert = { 
        id: Date.now().toString(), 
        title: '보건증 (신규 업로드)', 
        expiryDate: null, // OCR 및 관리자 승인 전이므로 만료일 없음
        approvalStatus: 'pending' 
      };
      
      setCertList([newCert, ...certList]);
      setSelectedImage(null); // 초기화
      
      Alert.alert('업로드 완료', '보건증이 업로드되었으며, 관리자 승인 대기 중입니다.');
    } catch (error) {
      Alert.alert('오류', '업로드 중 문제가 발생했습니다.');
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
        {/* 보건증 상태 카드 (3개 리스트 반복 렌더링) */}
        {certList.map((cert) => {
          // ✅ 배열 반복문(map) 내부에서는 Hook(useMemo)을 사용할 수 없으므로 일반 변수로 상태를 계산합니다.
          const status = cert.approvalStatus === 'pending' ? 'pendingApproval' : calculateStatus(cert.expiryDate);
          
          return (
            <View key={cert.id} style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.cardTitle}>{cert.title}</Text>
                <View style={[
                  styles.badge,
                  status === 'expired' && styles.badgeExpired,
                  status === 'needsRenewal' && styles.badgeWarning,
                  status === 'pendingApproval' && styles.badgePending, // 승인 대기 배지 스타일
                ]}>
                  <Text style={[
                    styles.badgeText,
                    status === 'expired' && styles.badgeTextExpired,
                    status === 'needsRenewal' && styles.badgeTextWarning,
                    status === 'pendingApproval' && styles.badgeTextPending, // 승인 대기 텍스트 스타일
                  ]}>
                    {t(status)}
                  </Text>
                </View>
              </View>

              {/* ✅ 승인 대기 중일 때와 아닐 때 다른 내용을 표시 */}
              {status === 'pendingApproval' ? (
                <Text style={[styles.warningText, { color: isDarkMode ? '#FDE68A' : '#D97706' }]}>
                  ⏳ 관리자가 확인하고 있으며, 승인 후 만료일이 표시됩니다.
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
                    <Text style={[styles.warningText, { color: isDarkMode ? '#FECACA' : '#DC2626' }]}>⚠️ 보건증 유효기간이 만료되었습니다. 갱신 후 재업로드 해주세요.</Text>
                  )}
                  {status === 'needsRenewal' && (
                    <Text style={[styles.warningText, { color: isDarkMode ? '#FDE68A' : '#D97706' }]}>⚠️ 보건증 갱신 기한이 30일 이내로 다가왔습니다.</Text>
                  )}
                </>
              )}
            </View>
          );
        })}

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
                  <Text style={styles.submitButtonText}>서버로 전송</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadTitle}>{t('uploadNew')}</Text>
            <Text style={styles.uploadDesc}>터치하여 갤러리에서 선택하거나 새로 촬영하세요</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.helpText}>※ 업로드된 이미지는 AI(OCR)를 통해 갱신일이 자동 인식됩니다.</Text>

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
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
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
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.subText },
  helpText: { fontSize: 12, color: colors.subText, textAlign: 'center' },
  
  previewContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default HealthCertScreen;