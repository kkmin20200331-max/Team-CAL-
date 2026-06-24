import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const SignupChoiceScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const handleSelectRole = (role: 'STAFF' | 'ADMIN') => {
    navigation.navigate('Signup', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
<<<<<<< HEAD
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
=======
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.primary} />
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원가입</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>어떤 유형으로{'\n'}가입하시겠어요?</Text>
        <Text style={styles.subtitle}>하나를 선택하여 다음으로 진행해주세요.</Text>

        <TouchableOpacity
          style={[styles.choiceButton, styles.staffButton]}
          onPress={() => handleSelectRole('STAFF')}
        >
          <Ionicons name="people-outline" size={40} color={colors.primary} style={styles.choiceIcon} />
          <Text style={styles.choiceButtonText}>직원 (Staff)</Text>
          <Text style={styles.choiceButtonDescription}>매장 스케줄에 따라 근무하는 직원입니다.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choiceButton, styles.adminButton]}
          onPress={() => handleSelectRole('ADMIN')}
        >
          <Ionicons name="briefcase-outline" size={40} color={colors.primary} style={styles.choiceIcon} />
          <Text style={styles.choiceButtonText}>관리자 (Admin)</Text>
          <Text style={styles.choiceButtonDescription}>매장을 소유하고 직원을 관리하는 점주입니다.</Text>
        </TouchableOpacity>
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
<<<<<<< HEAD
  backButton: {
    fontSize: 24,
    color: colors.text,
=======
  backButtonContainer: {
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
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
  },
  subtitle: {
    fontSize: 16,
    color: colors.subText,
    marginBottom: 40,
  },
  choiceButton: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
<<<<<<< HEAD
    borderWidth: 2,
  },
  staffButton: {
    backgroundColor: colors.skyLight,
    borderColor: colors.sky,
  },
  adminButton: {
    backgroundColor: colors.yellowLight,
    borderColor: colors.yellow,
=======
    borderWidth: 1,
  },
  staffButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  adminButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
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
