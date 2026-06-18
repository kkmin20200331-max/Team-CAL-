import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
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
          <Text style={styles.choiceIcon}>👥</Text>
          <Text style={styles.choiceButtonText}>직원 (Staff)</Text>
          <Text style={styles.choiceButtonDescription}>매장 스케줄에 따라 근무하는 직원입니다.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choiceButton, styles.adminButton]}
          onPress={() => handleSelectRole('ADMIN')}
        >
          <Text style={styles.choiceIcon}>👑</Text>
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
  },
  backButton: {
    fontSize: 24,
    color: colors.text,
    width: 40,
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
    borderWidth: 2,
  },
  staffButton: {
    backgroundColor: colors.skyLight,
    borderColor: colors.sky,
  },
  adminButton: {
    backgroundColor: colors.yellowLight,
    borderColor: colors.yellow,
  },
  choiceIcon: {
    fontSize: 32,
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