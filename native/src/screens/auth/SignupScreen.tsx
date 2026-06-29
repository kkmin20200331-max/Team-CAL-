import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { signupAPI } from '../../../api/auth';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';

type SignupScreenNavigationProp = StackNavigationProp<any, 'Signup'>;

type Props = {
  navigation: SignupScreenNavigationProp;
  route: { params: { role: 'STAFF' | 'ADMIN' } };
};

const STORE_CATEGORIES = ["카페", "음식점", "패스트푸드", "의류/잡화", "서비스", "기타"];

export default function SignupScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { login } = useApp();
  const { t } = useLanguage();

  const [inputs, setInputs] = useState({
    id: "",
    password: "",
    passwordCheck: "",
    name: "",
    phone: "",
    isFranchise: true,
    brandName: "",
    branchName: "",
    address: "", // 주소 상태 추가
    openTime: new Date(),
    closeTime: new Date(),
    maxCapacity: "",
  });
  const [storeCategory, setStoreCategory] = useState(STORE_CATEGORIES[0]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'openTime' | 'closeTime'>('openTime');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: string, value: any) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const showTimepicker = (target: 'openTime' | 'closeTime') => {
    setPickerTarget(target);
    setTimePickerVisible(true);
  };

  const handleTimeConfirm = (selectedDate: Date) => {
    handleInputChange(pickerTarget, selectedDate);
    setTimePickerVisible(false);
  };

  const getLocalizedCategory = (cat: string) => {
    switch (cat) {
      case '카페': return t('catCafe');
      case '음식점': return t('catRestaurant');
      case '패스트푸드': return t('catFastfood');
      case '의류/잡화': return t('catClothing');
      case '서비스': return t('catService');
      case '기타': return t('catOther');
      default: return cat;
    }
  };

  const handleSignup = async () => {
    if (isSubmitting) return;

    const { id, password, passwordCheck, name, phone, isFranchise, brandName, branchName, address, openTime, closeTime, maxCapacity } = inputs;

    if (!id || !password || !passwordCheck || !name || !phone) {
      Alert.alert(t('inputError'), t('requiredFieldsMsg'));
      return;
    }
    if (role === 'ADMIN' && (!brandName || !branchName || !address)) {
      Alert.alert(t('inputError'), t('adminFieldsMsg'));
      return;
    }
    if (password !== passwordCheck) {
      Alert.alert(t('passwordError'), t('passwordMismatchMsg'));
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = `U_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`.slice(0, 21);
      const signupData: any = {
        id: userId,
        username: id,
        password,
        name,
        phone,
        role,
        status: "ACTIVE",
      };

      if (role === 'ADMIN') {
        signupData.isFranchise = isFranchise;
        signupData.brandName = brandName;
        signupData.branchName = branchName;
        signupData.storeAddress = address; // 주소 정보 추가 (backend: storeAddress)
        signupData.openTime = formatTime(openTime);
        signupData.closeTime = formatTime(closeTime);
        signupData.maxCapacity = parseInt(maxCapacity, 10) || 0;
        signupData.storeType = storeCategory; // 업종 정보 추가 (backend: storeType)
      }
      
      const response = await signupAPI(signupData);

      Toast.show({
        type: 'success',
        text1: t('signupSuccess'),
        text2: `${name}${t('welcomeMsg')}`,
      });

      login(response.data, false);

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const serverMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.message;

        if (status === 409) {
          Alert.alert(t('signupFailed'), serverMessage || t('alreadyUsedInfoMsg'));
        } else if (status === 403) {
          Alert.alert(
            t('signupFailed'),
            t('corsErrorMsg'),
          );
        } else {
          Alert.alert(t('signupFailed'), serverMessage || `${t('serverErrorMsg')}${status}`);
        }
      } else if (axios.isAxiosError(error) && error.request) {
        Alert.alert(t('signupFailed'), t('backendConnectionErrorMsg'));
      } else {
        Alert.alert(t('signupFailed'), t('unknownErrorMsg'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === 'ADMIN' ? t('adminSignup') : t('staffSignup')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>{t('basicInfo')}</Text>
          <TextInput style={styles.input} placeholder={t('usernameLabel')} placeholderTextColor={colors.subText} value={inputs.id} onChangeText={(text) => handleInputChange('id', text)} />
          <TextInput style={styles.input} placeholder={t('passwordLabel')} placeholderTextColor={colors.subText} value={inputs.password} onChangeText={(text) => handleInputChange('password', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder={t('passwordCheckLabel')} placeholderTextColor={colors.subText} value={inputs.passwordCheck} onChangeText={(text) => handleInputChange('passwordCheck', text)} secureTextEntry={true} />
          <TextInput style={styles.input} placeholder={t('namePlaceholder')} placeholderTextColor={colors.subText} value={inputs.name} onChangeText={(text) => handleInputChange('name', text)} />
          <TextInput style={styles.input} placeholder={t('phonePlaceholder')} placeholderTextColor={colors.subText} value={inputs.phone} onChangeText={(text) => handleInputChange('phone', text)} keyboardType="phone-pad" />

          {role === 'ADMIN' && (
            <>
              <Text style={styles.sectionTitle}>{t('storeInfo')}</Text>
              
              <Text style={styles.inputLabel}>{t('categoryLabel')}</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
                <Text style={styles.pickerButtonText}>{getLocalizedCategory(storeCategory)}</Text>
                <Ionicons name="chevron-down-outline" size={16} color={colors.subText} />
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <Text style={styles.inputLabel}>{t('isFranchiseLabel')}</Text>
                <Switch
                  trackColor={{ false: "#767577", true: colors.primary }}
                  thumbColor={inputs.isFranchise ? "#f4f3f4" : "#f4f3f4"}
                  onValueChange={(value) => handleInputChange('isFranchise', value)}
                  value={inputs.isFranchise}
                />
              </View>
              <TextInput style={styles.input} placeholder={t('brandNamePlaceholder')} placeholderTextColor={colors.subText} value={inputs.brandName} onChangeText={(text) => handleInputChange('brandName', text)} />
              <TextInput style={styles.input} placeholder={t('branchNamePlaceholder')} placeholderTextColor={colors.subText} value={inputs.branchName} onChangeText={(text) => handleInputChange('branchName', text)} />
              <TextInput style={styles.input} placeholder={t('storeAddressPlaceholder')} placeholderTextColor={colors.subText} value={inputs.address} onChangeText={(text) => handleInputChange('address', text)} />
              
              <View style={styles.timeContainer}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.inputLabel}>{t('openTimeLabel')}</Text>
                  <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('openTime')}>
                    <Text style={styles.timeText}>{formatTime(inputs.openTime)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.inputLabel}>{t('closeTimeLabel')}</Text>
                  <TouchableOpacity style={styles.timeButton} onPress={() => showTimepicker('closeTime')}>
                    <Text style={styles.timeText}>{formatTime(inputs.closeTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>{t('maxCapacityLabel')}</Text>
              <TextInput style={styles.input} placeholder={t('numbersOnlyPlaceholder')} placeholderTextColor={colors.subText} value={inputs.maxCapacity} onChangeText={(text) => handleInputChange('maxCapacity', text)} keyboardType="number-pad" />
            </>
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? t('signingUp') : t('signupComplete')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectStoreCategory')}</Text>
            {STORE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.modalOption, storeCategory === cat && styles.modalOptionSelected]}
                onPress={() => {
                  setStoreCategory(cat);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, storeCategory === cat && styles.modalOptionTextSelected]}>{getLocalizedCategory(cat)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {isTimePickerVisible && (
        <TimePickerModal
          isVisible={isTimePickerVisible}
          initialDate={pickerTarget === 'openTime' ? inputs.openTime : inputs.closeTime}
          onClose={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
        />
      )}
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardAvoidingContainer: {
    flex: 1,
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
  backButtonContainer: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  formContainer: { 
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: colors.card, color: colors.text, fontSize: 16 },
  inputLabel: { fontSize: 16, color: colors.subText, marginBottom: 8 },
  button: { 
    backgroundColor: colors.primary,
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: { 
    color: '#FFFFFF',
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeInputWrapper: {
    width: '48%',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  timeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text,
  },
  modalOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});