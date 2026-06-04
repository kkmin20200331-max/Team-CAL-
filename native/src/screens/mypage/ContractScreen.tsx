import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';

const ContractScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const userInfo = route.params?.userInfo || {};

  // 임시 더미 데이터 (추후 백엔드에서 받아올 데이터)
  const dummyContract = {
    branch: userInfo.store_id || '컴포즈 미금점',
    startDate: '2024-01-15',
    wage: '10,030',
    status: 'verified', // OCR 및 점주 확인 완료 상태
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
            <View style={styles.badge}><Text style={styles.badgeText}>{t('valid')}</Text></View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('nameLabel')}</Text>
            <Text style={styles.infoValue}>{userInfo.name || '김선민'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('workPlace')}</Text>
            <Text style={styles.infoValue}>{dummyContract.branch}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('startDate')}</Text>
            <Text style={styles.infoValue}>{dummyContract.startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('wage')}</Text>
            <Text style={styles.infoValue}>{dummyContract.wage}{t('currency')}</Text>
          </View>
        </View>

        {/* 문서 이미지 영역 (더미) */}
        <View style={styles.documentPreview}>
          <Text style={styles.documentIcon}>📄</Text>
          <Text style={styles.documentText}>근로계약서 원본 이미지 (미리보기)</Text>
        </View>
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  documentPreview: { 
    height: 300, backgroundColor: '#E5E7EB', borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed' 
  },
  documentIcon: { fontSize: 40, marginBottom: 10 },
  documentText: { fontSize: 14, color: '#6B7280' },
});

export default ContractScreen;