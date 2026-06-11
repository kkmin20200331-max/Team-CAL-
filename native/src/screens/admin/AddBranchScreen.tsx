import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';

const AddBranchScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo, login } = useApp();

  const [brandName, setBrandName] = useState('');
  const [branchName, setBranchName] = useState('');

  const handleSave = () => {
    if (!brandName.trim() || !branchName.trim()) {
      Alert.alert("입력 오류", "브랜드명과 지점명을 모두 입력해주세요.");
      return;
    }

    const newBranch = {
      id: `branch_${Date.now()}`,
      brandName,
      branchName,
    };

    if (userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        branches: [...(userInfo.branches || []), newBranch],
      };
      login(updatedUserInfo, true);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 지점 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>브랜드명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 컴포즈커피"
          value={brandName}
          onChangeText={setBrandName}
        />

        <Text style={styles.label}>지점명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 서현점"
          value={branchName}
          onChangeText={setBranchName}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 24, color: colors.primary, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  label: { fontSize: 16, color: colors.subText, marginBottom: 8, marginLeft: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: colors.card,
    fontSize: 18,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBranchScreen;