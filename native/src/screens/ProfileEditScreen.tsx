import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { updateProfileAPI } from '../../api/auth';

const ProfileEditScreen = ({ route, navigation }: any) => {
  // MyPageScreen에서 넘겨준 userInfo와 상태 변경 함수를 받습니다.
  const { userInfo, setUserInfo } = route.params || {};

  // 수정 가능한 정보의 상태 관리
  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    try {
      // 1. 백엔드 주석의 요구사항("기존 정보는 그대로 담아서")을 반영하여
      // 기존 userInfo 객체를 모두 복사한 뒤, 수정된 내용만 덮어씌웁니다.
      const updateData = { 
        ...userInfo, 
        name: name, 
        phone: phone,
        // 비밀번호를 새로 입력했다면 새 비밀번호로, 안 했다면 기존 비밀번호를 유지합니다.
        password: newPassword !== '' ? newPassword : userInfo.password
      };
      
      // 2. 백엔드 API 호출! (PUT /api/users)
      await updateProfileAPI(updateData);

      // 3. 앱(프론트엔드)의 로컬 상태도 업데이트해서 화면에 즉각 반영
      if (setUserInfo) {
        setUserInfo({ ...userInfo, name, phone });
      }

      Alert.alert('저장 완료', '개인정보가 성공적으로 수정되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('개인정보 수정 에러:', error);
      Alert.alert('수정 실패', '정보를 수정하는 도중 에러가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보 수정</Text>
        {/* ✅ 에러 원인 해결: 주석을 안쪽이나 바깥으로 빼서 띄어쓰기를 없앱니다 */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 1. 수정 불가 정보 (Read-Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 정보 (수정 불가)</Text>
          
          <Text style={styles.label}>아이디</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.username || '알 수 없음'} 
            editable={false} 
          />

          <Text style={styles.label}>소속 지점</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점'} 
            editable={false} 
          />

          <Text style={styles.label}>권한 (직급)</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={userInfo?.role === 'ADMIN' ? '관리자 (점주)' : '일반 직원'} 
            editable={false} 
          />
        </View>

        {/* 2. 수정 가능 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 정보</Text>
          
          <Text style={styles.label}>이름</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="이름을 입력하세요"
          />

          <Text style={styles.label}>전화번호</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="예: 010-1234-5678"
            keyboardType="phone-pad"
          />
        </View>

        {/* 3. 비밀번호 변경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          
          <Text style={styles.label}>현재 비밀번호</Text>
          <TextInput 
            style={styles.input} 
            value={currentPassword} 
            onChangeText={setCurrentPassword} 
            placeholder="현재 비밀번호를 입력하세요"
            secureTextEntry={true}
          />

          <Text style={styles.label}>새 비밀번호</Text>
          <TextInput 
            style={styles.input} 
            value={newPassword} 
            onChangeText={setNewPassword} 
            placeholder="변경할 비밀번호를 입력하세요"
            secureTextEntry={true}
          />
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>수정 완료</Text>
        </TouchableOpacity>

        {/* 회원 탈퇴 */}
        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawText}>회원 탈퇴</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 16 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginBottom: 6,
    marginLeft: 2
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#111827',
    marginBottom: 16,
    backgroundColor: '#FFFFFF'
  },
  disabledInput: { 
    backgroundColor: '#F3F4F6', 
    color: '#9CA3AF' 
  },
  saveButton: { 
    backgroundColor: '#2563EB', 
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
});

export default ProfileEditScreen;