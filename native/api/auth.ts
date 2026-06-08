import axios from 'axios';

// ✅ [수정] 안드로이드 에뮬레이터용 주소(10.0.2.2)로 직접 연결합니다.
// (만약 본인 스마트폰 기계로 직접 연결해서 테스트 중이시라면 PC의 IP주소 예: 192.168.x.x 를 넣으셔야 합니다)
const API = axios.create({
  baseURL: 'http://10.100.0.120:8080/api',   
  // baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // 기존 환경변수 코드 주석 처리
  timeout: 10000, // ✅ [추가] 10초 이상 서버 응답이 없으면 에러로 처리 (무한 로딩 방지)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ [추가] 요청(Request) 인터셉터: 프론트엔드에서 백엔드로 데이터를 보내기 "직전"에 실행됨
API.interceptors.request.use(
  (config) => {
    console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`);
    // 💡 나중에 JWT 로그인 토큰을 사용하게 되면 여기서 AsyncStorage에서 토큰을 꺼내 헤더에 자동으로 붙여줍니다.
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ [추가] 응답(Response) 인터셉터: 백엔드에서 응답이 화면(컴포넌트)으로 가기 "직전"에 가로챔
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API 에러] ${error.config?.url}:`, error.message);
    // 💡 예: error.response?.status === 401(권한 없음)일 때 강제 로그아웃 시키는 등의 전역 에러 처리를 여기서 합니다.
    return Promise.reject(error);
  }
);

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

// ✅ [추가] 내 스케줄 조회 API (직원용)
export const getMyScheduleAPI = (userId: string, storeId: string) => 
  API.get(`/shifts/my?user_id=${userId}&store_id=${storeId}`);

// ✅ [추가] 휴무 신청 API
export const requestLeaveAPI = (data: { shift_id: string; user_id: string; reason: string }) => 
  API.post(`/leave-requests`, data);

// ---------------------------------------------------------
// 💡 [예정] 앞으로 연동할 빈 껍데기 API 함수들을 미리 선언해 둡니다.
// ---------------------------------------------------------

// [대시보드] 이번 주 통계 데이터 조회용
export const getWeeklyStatsAPI = (userId: string, storeId: string) => 
  API.get(`/stats/weekly?user_id=${userId}&store_id=${storeId}`);

// [게시판] 사내 게시판 목록 조회용
export const getBoardPostsAPI = (storeId: string) => 
  API.get(`/board?store_id=${storeId}`);

// [QR 출퇴근] 출근 / 퇴근 기록 전송용
export const checkInAPI = (userId: string, storeId: string) => 
  API.post(`/attendance/check-in`, { user_id: userId, store_id: storeId });

export const checkOutAPI = (userId: string, storeId: string) => 
  API.post(`/attendance/check-out`, { user_id: userId, store_id: storeId });

// [게시판] 새 글 작성 API (직원/관리자 공통)
export const createBoardPostAPI = (data: any) => 
  API.post(`/board`, data);
