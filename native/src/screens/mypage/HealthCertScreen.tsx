import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { uploadHealthCertificateAPI } from '../../../api/auth';

const HealthCertScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { userInfo } = useApp();
  const styles = getThemedStyles(colors);

  const calculateStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'pendingApproval';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'needsRenewal';
    return 'valid';
  };

  interface HealthCert {
    id: string;
    title: string;
    expiryDate: string | null;
    approvalStatus: 'verified' | 'pending';
  }

  const [certList, setCertList] = useState<HealthCert[]>([
    { id: '1', title: '보건증 (최신)', expiryDate: '2027-05-20', approvalStatus: 'verified' },
    { id: '2', title: '보건증 (갱신 임박)', expiryDate: '2026-06-20', approvalStatus: 'verified' },
    { id: '3', title: '보건증 (과거)', expiryDate: '2025-01-15', approvalStatus: 'verified' },
  ]);

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
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        name: `health-cert-${userInfo.id}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('user_id', userInfo.id);
      formData.append('store_id', userInfo.activeBranchId || '');

      await uploadHealthCertificateAPI(formData);

      const newCert: HealthCert = { 
        id: Date.now().toString(), 
        title: '보건증 (신규 업로드)', 
        expiryDate: null,
        approvalStatus: 'pending' 
      };
      
      setCertList([newCert, ...certList]);
      setSelectedImage(null);
      
      Alert.alert('업로드 완료', '보건증이 업로드되었으며, 관리자 승인 대기 중입니다.');
    } catch (error) {
      console.error("HealthCert upload error:", error);
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
        {certList.map((cert) => {
          const status = cert.approvalStatus === 'pending' ? 'pendingApproval' : calculateStatus(cert.expiryDate);
          
          return (
            <View key={cert.id} style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.cardTitle}>{cert.title}</Text>
                <View style={[
                  styles.badge,
                  status === 'expired' && styles.badgeExpired,
                  status === 'needsRenewal' && styles.badgeWarning,
                  status === 'pendingApproval' && styles.badgePending,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    status === 'expired' && styles.badgeTextExpired,
                    status === 'needsRenewal' && styles.badgeTextWarning,
                    status === 'pendingApproval' && styles.badgeTextPending,
                  ]}>
                    {t(status)}
                  </Text>
                </View>
              </View>

              {status === 'pendingApproval' ? (
                <Text style={[styles.warningText, { color: colors.yellow }]}>
                  ⏳ 관리자가 확인하고 있으며, 승인 후 만료일이 표시됩니다.
                </Text>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('expiryDate')}</Text>
                    <Text style={[
                      styles.infoValue, 
                      status === 'expired' && { color: colors.red },
                      status === 'needsRenewal' && { color: colors.yellow }
                    ]}>
                      {cert.expiryDate}
                    </Text>
                  </View>

                  {status === 'expired' && (
                    <Text style={[styles.warningText, { color: colors.red }]}>⚠️ 보건증 유효기간이 만료되었습니다. 갱신 후 재업로드 해주세요.</Text>
                  )}
                  {status === 'needsRenewal' && (
                    <Text style={[styles.warningText, { color: colors.yellow }]}>⚠️ 보건증 갱신 기한이 30일 이내로 다가왔습니다.</Text>
                  )}
                </>
              )}
            </View>
          );
        })}

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewButtonGroup}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedImage(null)} disabled={isUploading}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleUploadToBackend} disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator color={colors.white} />
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
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  badge: { backgroundColor: colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  badgeExpired: { backgroundColor: colors.redLight },
  badgeTextExpired: { color: colors.red },
  badgeWarning: { backgroundColor: colors.yellowLight },
  badgeTextWarning: { color: colors.yellow },
  badgePending: { backgroundColor: colors.yellowLight },
  badgeTextPending: { color: colors.yellow },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  warningText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  uploadBox: {
    backgroundColor: colors.card, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.blueLight, borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: colors.blue, marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: colors.subText },
  helpText: { fontSize: 12, color: colors.subText, textAlign: 'center' },
  
  previewContainer: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, elevation: 2 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'contain', backgroundColor: colors.background },
  previewButtonGroup: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, backgroundColor: colors.blue, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});

export default HealthCertScreen;