import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';

const HealthCertScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  
  // 현재 날짜를 기준으로 만료 상태를 계산하는 함수
  const calculateStatus = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 제외 (자정 기준)
    const expiry = new Date(expiryDate);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired'; // 이미 지남 (만료)
    if (diffDays <= 30) return 'needsRenewal'; // 30일 이내 (갱신 요망)
    return 'valid'; // 30일 초과 (정상)
  };

  // 날짜별 테스트를 위한 더미 데이터 3가지 리스트
  const certList = [
    { id: '1', title: '보건증 (최신)', expiryDate: '2027-05-20' },
    { id: '2', title: '보건증 (갱신 임박)', expiryDate: '2026-06-20' }, // 30일 이내
    { id: '3', title: '보건증 (과거)', expiryDate: '2025-01-15' }, // 만료됨
  ];

  const handleUpload = () => {
    Alert.alert('알림', '갤러리 또는 카메라를 실행하여 보건증을 업로드합니다.\n(현재 개발 준비 중)');
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
          const status = calculateStatus(cert.expiryDate);
          
          return (
            <View key={cert.id} style={styles.card}>
              <View style={styles.statusRow}>
                <Text style={styles.cardTitle}>{cert.title}</Text>
                <View style={[
                  styles.badge, 
                  status === 'expired' && styles.badgeExpired,
                  status === 'needsRenewal' && styles.badgeWarning
                ]}>
                  <Text style={[
                    styles.badgeText, 
                    status === 'expired' && styles.badgeTextExpired,
                    status === 'needsRenewal' && styles.badgeTextWarning
                  ]}>
                    {t(status)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('expiryDate')}</Text>
                <Text style={[
                  styles.infoValue, 
                  status === 'expired' && { color: '#DC2626' },
                  status === 'needsRenewal' && { color: '#D97706' }
                ]}>
                  {cert.expiryDate}
                </Text>
              </View>

              {status === 'expired' && (
                <Text style={styles.warningText}>⚠️ 보건증 유효기간이 만료되었습니다. 갱신 후 재업로드 해주세요.</Text>
              )}
              {status === 'needsRenewal' && (
                <Text style={[styles.warningText, { color: '#D97706' }]}>⚠️ 보건증 갱신 기한이 30일 이내로 다가왔습니다.</Text>
              )}
            </View>
          );
        })}

        {/* 이미지 업로드 영역 */}
        <TouchableOpacity style={styles.uploadBox} onPress={handleUpload}>
          <Text style={styles.uploadIcon}>📸</Text>
          <Text style={styles.uploadTitle}>{t('uploadNew')}</Text>
          <Text style={styles.uploadDesc}>터치하여 갤러리에서 선택하거나 새로 촬영하세요</Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>※ 업로드된 이미지는 AI(OCR)를 통해 갱신일이 자동 인식됩니다.</Text>

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
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#16A34A', fontSize: 13, fontWeight: '700' },
  badgeExpired: { backgroundColor: '#FEE2E2' },
  badgeTextExpired: { color: '#DC2626' },
  badgeWarning: { backgroundColor: '#FEF3C7' },
  badgeTextWarning: { color: '#D97706' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  warningText: { marginTop: 12, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  uploadBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#93C5FD', borderStyle: 'dashed', marginBottom: 12
  },
  uploadIcon: { fontSize: 40, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  uploadDesc: { fontSize: 13, color: '#6B7280' },
  helpText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});

export default HealthCertScreen;