import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const SignupChoiceScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { t } = useLanguage();

  const handleSelectRole = (role: 'STAFF') => {
    navigation.navigate('Signup', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('signupBtn')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('signupAsStaff')}</Text>
        <Text style={styles.subtitle}>{t('signupAsStaffDesc')}</Text>

        <TouchableOpacity
          style={[styles.choiceButton, styles.staffButton]}
          onPress={() => handleSelectRole('STAFF')}
        >
          <Ionicons name="people-outline" size={40} color={colors.primary} style={styles.choiceIcon} />
          <Text style={styles.choiceButtonText}>{t('staffLabel')}</Text>
          <Text style={styles.choiceButtonDescription}>{t('staffButtonDesc')}</Text>
        </TouchableOpacity>

        {/* 
        관리자 가입 기능은 웹에서만 제공하도록 정책이 변경되어 앱에서는 주석 처리합니다.
        <TouchableOpacity
          style={[styles.choiceButton, styles.adminButton]}
          onPress={() => handleSelectRole('ADMIN')}
        >
          <Ionicons name="briefcase-outline" size={40} color={colors.primary} style={styles.choiceIcon} />
          <Text style={styles.choiceButtonText}>관리자 (Admin)</Text>
          <Text style={styles.choiceButtonDescription}>매장을 소유하고 직원을 관리하는 사장님입니다.</Text>
        </TouchableOpacity>
        */}
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButtonContainer: {
    width: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.subText,
    marginBottom: 40,
    textAlign: 'center',
  },
  choiceButton: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  staffButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  adminButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  choiceIcon: {
    marginBottom: 12,
  },
  choiceButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  choiceButtonDescription: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SignupChoiceScreen;