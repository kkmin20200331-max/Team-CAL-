import axios from 'axios';

// ✅ [수정] 안드로이드 에뮬레이터용 주소(10.0.2.2)로 직접 연결합니다.
// (만약 본인 스마트폰 기계로 직접 연결해서 테스트 중이시라면 PC의 IP주소 예: 192.168.x.x 를 넣으셔야 합니다)
const API = axios.create({
  baseURL: 'http://10.100.0.227:8080/api',   
  // baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // 기존 환경변수 코드 주석 처리
});

export const loginAPI = (username: string, password: string) =>
  API.post('/users/login', { username, password });

// 메모: 백엔드 users 테이블 기준 필수값(id, username, password, name, phone, role, status)을 모두 보냅니다.
export const signupAPI = (data: {
  id: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'STAFF';
  status: 'ACTIVE' | 'PENDING';
  brandName?: string;
  branchName?: string | null;
  openTime?: string;
  closeTime?: string;
  maxCapacity?: number;
  selectedBrand?: string;
  selectedBranch?: string;
}) => API.post('/users', data);

// ✅ [추가] 개인정보 수정 API
export const updateProfileAPI = (data: any) => 
  API.put(`/users`, data);
