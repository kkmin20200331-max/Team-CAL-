import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
<<<<<<< HEAD
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';
=======
import { User } from '../../types/User';
import Ionicons from '@expo/vector-icons/Ionicons';
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

type Props = {
  navigation: any;
};

const ProfileEditScreen = ({ navigation }: Props) => {
  const { userInfo, login } = useApp();
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(userInfo?.profileImage || null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadImage(result.assets[0].base64);
    }
  };

  const uploadImage = async (base64: string) => {
    setUploading(true);
    try {
      // 1. 현재 Supabase에 로그인된 사용자 정보를 가져옵니다.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인된 사용자를 찾을 수 없습니다.');

      // 2. 파일 경로를 앱의 userId가 아닌, Supabase의 user.id (auth.uid())로 생성합니다.
      const filePath = `${user.id}/${new Date().getTime()}.png`;
      const contentType = 'image/png';

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { contentType });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setProfileImage(urlData.publicUrl);

    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('업로드 실패', error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
<<<<<<< HEAD
    if (!userInfo) return;

    const updatedUserInfo = {
      ...userInfo,
      name,
      phone,
      profileImage: profileImage || undefined,
    };
    
    login(updatedUserInfo, true); 
=======
    try {
      const { profileImage: _, ...restUserInfo } = userInfo || {};
      const updateData = { 
        ...restUserInfo, 
        name: name, 
        phone: phone,
        password: newPassword !== '' ? newPassword : (userInfo?.password || '1234')
      };
      
      await updateProfileAPI(updateData);

      if (setUserInfo && userInfo) {
        setUserInfo({ ...userInfo, name, phone, profileImage: profileImage || undefined });
      }
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

    Alert.alert(t('saveCompleteTitle'), t('saveCompleteMsg'), [
      { text: t('confirm'), onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileEdit')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} disabled={uploading}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{name.substring(0, 1)}</Text>
              </View>
            )}
<<<<<<< HEAD
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditBadgeText}>📷</Text>
              </View>
            )}
=======
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color={isDarkMode ? '#FFF' : '#374151'} />
            </View>
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('accountInfoReadonly')}</Text>
          <Text style={styles.label}>{t('idLabel')}</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={userInfo?.username || t('unknown')} editable={false} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myInfoSection')}</Text>
          <Text style={styles.label}>{t('nameLabel')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('namePlaceholder')} />
          <Text style={styles.label}>{t('phoneLabel')}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('phonePlaceholder')} keyboardType="phone-pad" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('changePasswordSection')}</Text>
          <Text style={styles.label}>{t('currentPasswordLabel')}</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder={t('currentPasswordPlaceholder')} secureTextEntry={true} />
          <Text style={styles.label}>{t('newPasswordLabel')}</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder={t('newPasswordPlaceholder')} secureTextEntry={true} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('editCompleteBtn')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
<<<<<<< HEAD
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: colors.text },
=======
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    backgroundColor: colors.card
  },
  backButton: { padding: 4, width: 40, justifyContent: 'center', alignItems: 'flex-start' },
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  container: { flex: 1, padding: 20 },
  
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 40, fontWeight: 'bold', color: colors.primary },
  avatarEditBadge: { position: 'absolute', right: 0, bottom: 0, backgroundColor: colors.card, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
<<<<<<< HEAD
  avatarEditBadgeText: { fontSize: 14 },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 50 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.subText, marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 16, backgroundColor: colors.card },
  disabledInput: { backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', color: colors.subText },
  saveButton: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
=======

  section: { marginBottom: 32 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.text, 
    marginBottom: 16 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.subText, 
    marginBottom: 6,
    marginLeft: 2
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: colors.text,
    marginBottom: 16,
    backgroundColor: colors.card
  },
  disabledInput: { 
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', 
    color: colors.subText 
  },
  saveButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  withdrawButton: { 
    alignItems: 'center', 
    paddingVertical: 10,
    marginBottom: 40 
  },
  withdrawText: { 
    color: '#9CA3AF', 
    fontSize: 13, 
    textDecorationLine: 'underline' 
  }
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
});

export default ProfileEditScreen;
