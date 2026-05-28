import axios from 'axios';

const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
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
