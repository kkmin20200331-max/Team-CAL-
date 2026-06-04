import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';

const ContractScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const userInfo = route.params?.userInfo || {};

  // 상태 관리: 실제로는 백엔드에서 내려주는 데이터를 기반으로 작동합니다.
  const [contractData, setContractData] = useState({
    branch: userInfo.store_id || '컴포즈 미금점',
    startDate: '2024-01-15',
    wage: '10,030',
    status: 'verified', // 'verified' | 'pending'
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 📸 갤러리 열기
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // 🚀 백엔드 전송 시뮬레이션
  const handleUploadToBackend = async () => {
    if (!selectedImage) return;
    setIsUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 서버 전송 대기 흉내
      setContractData({ ...contractData, status: 'pending' }); // 상태를 '승인 대기'로 변경
      setSelectedImage(null);
      Alert.alert('전송 완료', '계약서가 업로드되었습니다. 점주 승인 후 최종 반영됩니다.');
    } catch (error) {
      Alert.alert('오류', '업로드 중 문제가 발생했습니다.');
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
              contractData.status === 'pending' && styles.badgePending
            ]}>
              <Text style={[
                styles.badgeText, 
                contractData.status === 'pending' && styles.badgeTextPending
              ]}>
                {contractData.status === 'verified' ? t('valid') : t('pendingApproval')}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('nameLabel')}</Text>
            <Text style={styles.infoValue}>{userInfo.name || '김선민'}</Text>
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
                {isUploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>서버로 전송</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : contractData.status === 'verified' ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadTitle}>계약서 갱신 / 새로 업로드</Text>
            <Text style={styles.uploadDesc}>새로 서명한 근로계약서가 있다면 업로드해주세요</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pendingBox}>
             <Text style={styles.pendingIcon}>⏳</Text>
             <Text style={styles.pendingTitle}>점주 승인 대기 중</Text>
             <Text style={styles.pendingDesc}>제출하신 계약서의 확인이 진행 중입니다.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  container: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#16A34A', fontSize: 13, fontWeight: '700' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeTextPending: { color: '#D97706' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  uploadBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#93C5FD', borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  previewContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: '#F3F4F6' },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  pendingBox: {
    backgroundColor: '#FFFBEB', borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FCD34D', marginBottom: 12
  },
  pendingIcon: { fontSize: 40, marginBottom: 12 },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: '#D97706', marginBottom: 8 },
  pendingDesc: { fontSize: 13, color: '#92400E' },
});

export default ContractScreen;