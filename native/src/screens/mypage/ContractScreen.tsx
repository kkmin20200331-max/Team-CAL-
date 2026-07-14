import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ 테마 Context 추가
import { useApp } from '../../contexts/AppContext'; // ✅ AppContext 추가
import { useFocusEffect } from '@react-navigation/native'; // ✅ useFocusEffect 추가
import { getContractsAPI, uploadFileAPI } from '../../../api/auth'; // ✅ API 추가

const ContractScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { userInfo } = useApp();

  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // 상태 관리: 실제 백엔드에서 받아온 근로조건 데이터
  const [contractData, setContractData] = useState({
    id: '',
    branch: userInfo?.branchName || userInfo?.brandName || t('unassignedBranch'),
    startDate: t('unregistered'),
    wage: '0',
    status: 'none', // 'none' | 'verified' | 'pending' | 'rejected'
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📂 계약서 데이터 불러오기
  const loadContract = async () => {
    if (!userInfo?.id) return;
    try {
      const response = await getContractsAPI(userInfo.id);
      if (Array.isArray(response.data) && response.data.length > 0) {
        // 백엔드 정렬 사양이 최신순이라 가정하고 첫 번째 아이템 사용
        const latest = response.data[0];
        let startDate = '미등록';
        if (latest.created_at) {
          startDate = latest.created_at.substring(0, 10);
        }
        
        let wage = '10,320';
        if (latest.extracted_data) {
          try {
            const parsed = JSON.parse(latest.extracted_data);
            if (parsed.wage) wage = parsed.wage;
          } catch (e) {}
        }
        
        setContractData({
          id: latest.id,
          branch: userInfo.branchName || userInfo.brandName || t('unassignedBranch'),
          startDate: startDate,
          wage: wage,
          status: (latest.status || 'PENDING').toLowerCase(),
        });
      } else {
        setContractData({
          id: '',
          branch: userInfo.branchName || userInfo.brandName || t('unassignedBranch'),
          startDate: t('unregistered'),
          wage: '0',
          status: 'none',
        });
      }
    } catch (error) {
      console.error('근로계약서 조회 에러:', error);
    }
  };

  // 화면 진입 시 로드
  useFocusEffect(
    React.useCallback(() => {
      loadContract();
    }, [userInfo?.id])
  );

  // 📸 갤러리 열기
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequired'), t('galleryPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 🚀 백엔드 전송
  const handleUploadToBackend = async () => {
    if (!selectedImage || !userInfo?.id) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      let filename = selectedImage.split('/').pop() || 'contract.jpg';
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
      formData.append('file_type', 'contract');

      await uploadFileAPI(formData);

      setSelectedImage(null);
      Alert.alert(t('sendComplete'), t('contractUploadedMsg'));
      loadContract();
    } catch (error) {
      console.error('근로계약서 업로드 에러:', error);
      Alert.alert(t('error'), t('uploadErrorMsg'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('contract')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.cardTitle}>{t('contract')}</Text>
            <View style={[
              styles.badge, 
              contractData.status === 'pending' && styles.badgePending,
              contractData.status === 'rejected' && styles.badgeRejected,
              contractData.status === 'none' && styles.badgeNone,
            ]}>
              <Text style={[
                styles.badgeText, 
                contractData.status === 'pending' && styles.badgeTextPending,
                contractData.status === 'rejected' && styles.badgeTextRejected,
                contractData.status === 'none' && styles.badgeTextNone,
              ]}>
                {contractData.status === 'verified' ? t('valid') : 
                 contractData.status === 'pending' ? t('pendingApproval') : 
                 contractData.status === 'rejected' ? t('rejected') : t('unregistered')}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('nameLabel')}</Text>
            <Text style={styles.infoValue}>{userInfo?.name || t('defaultUserName')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('workPlace')}</Text>
            <Text style={styles.infoValue}>{contractData.branch}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('startDate')}</Text>
            <Text style={styles.infoValue}>{contractData.startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('wage')}</Text>
            <Text style={styles.infoValue}>{contractData.wage}{t('currency')}</Text>
          </View>
        </View>

        {/* 이미지 업로드 / 미리보기 영역 분기 처리 */}
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewButtonGroup}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedImage(null)} disabled={isUploading}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleUploadToBackend} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{t('sendToServer')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : contractData.status === 'verified' ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadTitle}>{t('renewContractTitle')}</Text>
            <Text style={styles.uploadDesc}>{t('renewContractDesc')}</Text>
          </TouchableOpacity>
        ) : contractData.status === 'pending' ? (
          <View style={styles.pendingBox}>
             <Text style={styles.pendingIcon}>⏳</Text>
             <Text style={styles.pendingTitle}>{t('pendingApprovalTitle')}</Text>
             <Text style={styles.pendingDesc}>{t('pendingApprovalDesc')}</Text>
          </View>
        ) : contractData.status === 'rejected' ? (
          <TouchableOpacity style={[styles.uploadBox, { borderColor: '#FECACA' }]} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>⚠️</Text>
            <Text style={[styles.uploadTitle, { color: '#EF4444' }]}>{t('rejectedContractTitle')}</Text>
            <Text style={styles.uploadDesc}>{t('rejectedContractDesc')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadTitle}>{t('uploadContractTitle')}</Text>
            <Text style={styles.uploadDesc}>{t('uploadContractDesc')}</Text>
          </TouchableOpacity>
        )}
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
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  badge: { backgroundColor: isDarkMode ? '#14532D' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: isDarkMode ? '#86EFAC' : '#16A34A', fontSize: 13, fontWeight: '700' },
  badgePending: { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' },
  badgeTextPending: { color: isDarkMode ? '#FDE68A' : '#D97706' },
  badgeRejected: { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' },
  badgeTextRejected: { color: isDarkMode ? '#FECACA' : '#DC2626' },
  badgeNone: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' },
  badgeTextNone: { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  uploadBox: {
    backgroundColor: colors.card, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#93C5FD', borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  previewContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  pendingBox: {
    backgroundColor: isDarkMode ? '#3F3119' : '#FFFBEB', borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: isDarkMode ? '#92400E' : '#FCD34D', marginBottom: 12
  },
  pendingIcon: { fontSize: 40, marginBottom: 12 },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#FCD34D' : '#D97706', marginBottom: 8 },
  pendingDesc: { fontSize: 13, color: isDarkMode ? '#E5E7EB' : '#92400E' },
});

export default ContractScreen;
