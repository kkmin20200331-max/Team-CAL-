import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

type Employee = {
  id: string;
  name: string;
  phone: string;
  role: string;
  payType: 'HOURLY' | 'SALARY';
  payRate: number;
};

type Props = {
  navigation: any;
  route: {
    params: {
      employee: Employee;
      onSave: (updatedEmployee: Employee) => void;
    };
  };
};

const EmployeeDetailScreen = ({ navigation, route }: Props) => {
  const { employee, onSave } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [payType, setPayType] = useState(employee.payType);
  const [hourlyRate, setHourlyRate] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  // ★★★ 수정된 부분: 예상 급여 자동 계산 로직 ★★★
  useEffect(() => {
    if (employee.payType === 'HOURLY') {
      setHourlyRate(String(employee.payRate));
      // (시급 * 8시간 * 20일) 기준으로 예상 월급 계산
      const estimatedSalary = employee.payRate * 8 * 20;
      setMonthlySalary(String(estimatedSalary));
    } else { // 월급제일 경우
      setMonthlySalary(String(employee.payRate));
      // (월급 / 20일 / 8시간) 기준으로 예상 시급 역산
      const estimatedHourlyRate = Math.round(employee.payRate / 20 / 8);
      setHourlyRate(String(estimatedHourlyRate));
    }
  }, [employee]);

  const handleSave = () => {
    let newPayRate = 0;
    if (payType === 'HOURLY') {
      newPayRate = parseInt(hourlyRate, 10);
    } else {
      newPayRate = parseInt(monthlySalary, 10);
    }

    if (isNaN(newPayRate) || newPayRate <= 0) {
      Alert.alert("입력 오류", "올바른 급여를 입력해주세요.");
      return;
    }

    const updatedEmployee = {
      ...employee,
      payType,
      payRate: newPayRate,
    };

    onSave(updatedEmployee);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{employee.name} 정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>이름</Text>
          <Text style={styles.infoValue}>{employee.name}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>연락처</Text>
          <Text style={styles.infoValue}>{employee.phone}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>직책</Text>
          <Text style={styles.infoValue}>{employee.role}</Text>
        </View>

        <Text style={styles.sectionTitle}>급여 정보</Text>

        <View style={styles.payTypeContainer}>
          <Text style={styles.payTypeLabel}>급여 유형</Text>
          <View style={styles.toggleControl}>
            <Text style={[styles.toggleOptionText, payType === 'HOURLY' && styles.toggleOptionActive]}>시급제</Text>
            <Switch
              trackColor={{ false: "#E5E7EB", true: "#E5E7EB" }}
              thumbColor={colors.primary}
              onValueChange={(isActive) => setPayType(isActive ? 'SALARY' : 'HOURLY')}
              value={payType === 'SALARY'}
            />
            <Text style={[styles.toggleOptionText, payType === 'SALARY' && styles.toggleOptionActive]}>월급제</Text>
          </View>
        </View>

        {payType === 'HOURLY' && (
          <View style={styles.payInputCard}>
            <Text style={styles.payLabel}>시급</Text>
            <View style={styles.payInputContainer}>
              <TextInput style={styles.payInput} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="number-pad" />
              <Text style={styles.payUnit}>원</Text>
            </View>
            <Text style={styles.helperText}>월급은 근무 기록을 바탕으로 자동 계산됩니다.</Text>
          </View>
        )}

        {payType === 'SALARY' && (
          <View style={styles.payInputCard}>
            <Text style={styles.payLabel}>월급</Text>
            <View style={styles.payInputContainer}>
              <TextInput style={styles.payInput} value={monthlySalary} onChangeText={setMonthlySalary} keyboardType="number-pad" />
              <Text style={styles.payUnit}>원</Text>
            </View>
            <Text style={styles.helperText}>매월 고정된 금액을 지급합니다.</Text>
          </View>
        )}

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
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 16, color: colors.subText },
  infoValue: { fontSize: 16, color: colors.text, fontWeight: '600' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 24, marginBottom: 16 },
  payTypeContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  payTypeLabel: {
    fontSize: 16,
    color: colors.subText,
    marginBottom: 12,
  },
  toggleControl: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  toggleOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.subText,
  },
  toggleOptionActive: {
    color: colors.primary,
  },
  payInputCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payLabel: {
    fontSize: 16,
    color: colors.subText,
    marginBottom: 8,
  },
  payInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payInput: {
    flex: 1,
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
  },
  payUnit: {
    fontSize: 20,
    color: colors.text,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 12,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmployeeDetailScreen;