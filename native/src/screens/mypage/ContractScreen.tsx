import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { insertFileAPI } from '../../../api/auth'; // API 함수 변경

const ContractScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { userInfo } = useApp();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [contractData, setContractData] = useState({
    branch: userInfo?.branchName || '지점 정보 없음',
    startDate: '2024-01-15', // This should ideally come from userInfo or an API
    wage: '10,030', // This should also be dynamic
    status: 'verified', // 'verified' | 'pending'
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUploadToBackend = async () => {
    if (!selectedImage || !userInfo) return;
    setIsUploading(true);
    try {
      // FormData를 직접 사용하는 대신, 필요한 정보를 객체로 구성
      // 파일 업로드는 별도의 API나 서비스(예: Supabase Storage)를 통해 처리하고,
      // 그 결과로 받은 파일 URL을 DB에 저장하는 것이 일반적임.
      // 현재는 파일 업로드 로직이 백엔드에 없으므로, 파일 정보를 DB에 저장하는 것만 구현.
      const fileData = {
        id: `file-${Date.now()}`,
        user_id: userInfo.id,
        file_name: `contract-${userInfo.id}.jpg`,
        file_path: selectedImage, // 임시로 로컬 URI를 저장
        file_type: 'CONTRACT', // 파일 타입 지정
        status: 'PENDING',
      };

      await insertFileAPI(fileData);

      setContractData({ ...contractData, status: 'pending' });
      setSelectedImage(null);
      Alert.alert('전송 완료', '계약서가 업로드되었습니다. 점주 승인 후 최종 반영됩니다.');
    } catch (error) {
      console.error("Contract upload error:", error);
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
            <Text style={styles.infoValue}>{userInfo?.name || '사용자'}</Text>
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

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewButtonGroup}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedImage(null)} disabled={isUploading}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleUploadToBackend} disabled={isUploading}>
                {isUploading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitButtonText}>서버로 전송</Text>}
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

const getThemedStyles = (colors: any) => StyleSheet.create({
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
  badge: { backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  badgePending: { backgroundColor: colors.yellowLight },
  badgeTextPending: { color: colors.yellow },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  uploadBox: {
    backgroundColor: colors.card, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.blueLight, borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: colors.blue, marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.subText, textAlign: 'center' },
  previewContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: colors.background },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.blue, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  pendingBox: {
    backgroundColor: colors.yellowLight, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.yellow, marginBottom: 12
  },
  pendingIcon: { fontSize: 40, marginBottom: 12 },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: colors.yellow, marginBottom: 8 },
  pendingDesc: { fontSize: 13, color: colors.subText },
});

export default ContractScreen;
