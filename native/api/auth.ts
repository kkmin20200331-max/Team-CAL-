import axios from 'axios';

// ✅ [수정] baseURL을 다시 내부 IP 주소로 변경합니다.
// const NGROK_URL = 'https://imitate-flock-specimen.ngrok-free.dev/api'; // ngrok 주소 주석 처리
const LOCAL_URL = 'http://172.30.1.62:8080/api';

// ✅ [수정] API 인스턴스를 다른 파일에서 import할 수 있도록 export합니다.
export const API = axios.create({
  baseURL: LOCAL_URL,
  // baseURL: NGROK_URL,
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

// =========================================================
// API 함수 정의
// =========================================================

// ---------------------------------------------------------
// [사용자 관리 API] - UserC.java
// ---------------------------------------------------------

// 회원가입
export const signupAPI = (data: any) => API.post('/users', data);

// 로그인
export const loginAPI = (username: string, password: string) =>
  API.post('/users/login', { username, password });

// 닉네임 중복 확인
export const checkNicknameAPI = (nickname: string) =>
  API.get('/users/check-nickname', { params: { nickname } });

// 아이디 중복 확인
export const checkUsernameAPI = (username: string) =>
  API.get('/users/check-username', { params: { username } });

// 개인정보 수정
export const updateProfileAPI = (data: any) => 
  API.put(`/users`, data);

// 회원 삭제 (관리자용)
export const deleteUserAPI = (id: string) =>
  API.delete('/users', { params: { id } });

// 승인된 직원 목록 조회 (관리자용)
export const getStaffListAPI = (storeId: string) =>
  API.get('/users', { params: { store_id: storeId } });

// 승인 대기 직원 목록 조회 (관리자용)
export const getGuestListAPI = (storeId: string, role: string) =>
  API.get('/users/guest', { params: { store_id: storeId, role } });

// ---------------------------------------------------------
// [매장 관리 API] - StoreC.java
// ---------------------------------------------------------

// 매장 등록 (관리자용)
export const registerStoreAPI = (data: any) =>
  API.post('/store', data);

// 내가 관리하는 매장 목록 조회 (관리자용)
export const getMyStoreListAPI = (userId: string) =>
  API.get('/store', { params: { user_id: userId } });

// 매장 정보 수정 (관리자용)
export const updateStoreAPI = (data: any) =>
  API.put('/store', data);

// 매장 삭제 (관리자용)
export const deleteStoreAPI = (id: string) =>
  API.delete('/store', { params: { id } });

// 전체 매장 조회 (공통)
export const getAllStoresAPI = () =>
  API.get('/store/all');

// 직원 소속 매장 조회 (직원용)
export const getMyStoreAPI = (userId: string) =>
  API.get('/store/my', { params: { user_id: userId } });

// 매장 단건 조회 (공통)
export const getStoreByIdAPI = (id: string) =>
  API.get(`/store/${id}`);

// ---------------------------------------------------------
// [근무표 관리 API] - ShiftC.java
// ---------------------------------------------------------

// 근무표 단건 조회
export const getShiftByIdAPI = (id: string) =>
  API.get(`/shift/${id}`);

// 근무표 등록 (관리자용)
export const registerShiftAPI = (data: any) =>
  API.post('/shift', data);

// 매장별 기간별 근무표 조회 (관리자용)
export const getShiftListAPI = (storeId: string, startDate: string, endDate: string) =>
  API.get('/shift', {
    params: { store_id: storeId, start_date: startDate, end_date: endDate }
  });

// 근무표 수정 (관리자용)
export const updateShiftAPI = (data: any) =>
  API.put('/shift', data);

// 근무표 삭제 (관리자용)
export const deleteShiftAPI = (id: string) =>
  API.delete('/shift', { params: { id } });

// 고정 스케줄 기반 자동 생성 (관리자용)
export const generateAutomatedShiftsAPI = (storeId: string, startDate: string, endDate: string) =>
  API.post('/shift/fixed', null, {
    params: { store_id: storeId, start_date: startDate, end_date: endDate }
  });

// 내 근무표 조회 (직원용)
export const getMyShiftListAPI = (userId: string, startDate: string, endDate: string) =>
  API.get('/shift/staff', {
    params: { user_id: userId, start_date: startDate, end_date: endDate }
  });

// ---------------------------------------------------------
// [출퇴근 관리 API] - AttendanceC.java
// ---------------------------------------------------------

// 출퇴근 체크 (QR)
export const attendanceCheckAPI = (storeId: string, userId: string) =>
  API.post('/attendance/check', { store_id: storeId, user_id: userId });

// ---------------------------------------------------------
// [게시판 관리 API] - BoardPostC.java
// ---------------------------------------------------------

// 게시글 목록 조회
export const getBoardPostsAPI = (boardId: string) => 
  API.get(`/board/post`, { params: { board_id: boardId } });

// 게시글 단건 조회 (공통)
export const getBoardPostByIdAPI = (id: string) =>
  API.get(`/board/post/${id}`);

// 게시글 검색
export const searchBoardPostAPI = (storeId: string, keyword: string) =>
  API.get('/board/post/search', { params: { store_id: storeId, keyword } });

// 게시글 등록 (관리자)
export const createBoardPostAPI = (data: any) => 
  API.post(`/board/post`, data);

// 게시글 수정 (관리자)
export const updateBoardPostAPI = (data: any) =>
  API.put(`/board/post`, data);

// 게시글 삭제 (관리자)
export const deleteBoardPostAPI = (id: string) =>
  API.delete(`/board/post`, { params: { id } });

// ---------------------------------------------------------
// [휴무 신청 관리 API] - LeaveRequestC.java
// ---------------------------------------------------------

// [공통] 휴무 단건 상세 조회
export const getLeaveRequestAPI = (id: string) =>
  API.get(`/leave_request/${id}`);

// [관리자] 매장별 승인 대기 중인 휴무 신청 목록 조회
export const getLeaveRequestsAPI = (storeId: string) =>
  API.get(`/leave_request`, { params: { store_id: storeId } });

// [관리자] 휴무 신청 승인(APPROVED) 또는 거절(REJECTED) 처리
export const processLeaveRequestAPI = (id: string, status: 'APPROVED' | 'REJECTED') =>
  API.put(`/leave_request/${id}`, null, { params: { status } });

// [관리자] 휴무 승인 취소
export const ownerCancelApprovedLeaveAPI = (id: string) =>
  API.delete('/leave_request/owner', { params: { id } });

// [직원] 휴무 신청 보내기
export const requestLeaveAPI = (data: any) => 
  API.post(`/leave_request`, data);

// [직원] 내가 신청했던 휴무 취소하기
export const cancelLeaveRequestAPI = (id: string) =>
  API.delete('/leave_request', { params: { id } });

// [직원] 신청했던 휴무나 휴무 승인 내역 한달 단위 조회
export const getMyLeaveRequestsAPI = (userId: string, year: number, month: number, status?: string) =>
  API.get('/leave_request/staff', { params: { user_id: userId, year, month, status } });

// ---------------------------------------------------------
// [대타 관리 API] - SubstituteC.java
// ---------------------------------------------------------

// [공통] 모집글 목록 조회
export const getSubstitutePostsAPI = (storeId: string) =>
  API.get('/substitute', { params: { store_id: storeId } });

// [관리자] 특정 모집글 지원자 조회
export const getSubstituteApplicantsAPI = (postId: string) =>
  API.get('/substitute/manager', { params: { post_id: postId } });

// [관리자] 대타 승인
export const approveSubstituteAPI = (shiftId: string, selectedUserId: string, historyData: any) =>
  API.put('/substitute/manager', historyData, { params: { shift_id: shiftId, selected_user_id: selectedUserId } });

// [관리자] 모집글 취소
export const cancelSubstitutePostAPI = (postId: string) =>
  API.delete('/substitute/manager', { params: { post_id: postId } });

// [직원] 모집글 등록
export const createSubstitutePostAPI = (postData: any) =>
  API.post('/substitute/staff', postData);

// [직원] 대타 지원
export const applyForSubstituteAPI = (applicationData: any) =>
  API.post('/substitute/staff/apply', applicationData);

// [직원] 지원 취소
export const cancelSubstituteApplicationAPI = (id: string) =>
  API.delete('/substitute/staff', { params: { id } });

// [직원] 내 지원 내역 조회
export const getMySubstituteApplicationsAPI = (userId: string, status?: string) =>
  API.get('/substitute/staff', { params: { user_id: userId, status } });

// [직원] 내가 등록한 모집글 조회
export const getMySubstitutePostsAPI = (userId: string, status?: string) =>
  API.get('/substitute/staff/post', { params: { user_id: userId, status } });

// ---------------------------------------------------------
// [급여 관리 API] - PayrollC.java
// ---------------------------------------------------------

// [공통] 급여 조회
export const getPayrollAPI = (userId: string, storeId: string, startDate: string, endDate: string) =>
  API.get('/payroll', { params: { user_id: userId, store_id: storeId, start_date: startDate, end_date: endDate } });

// ---------------------------------------------------------
// [파일 관리 API] - FileC.java
// ---------------------------------------------------------

// [공통] 파일 등록
export const insertFileAPI = (fileData: any) =>
  API.post('/file', fileData);

// [공통] 파일 수정
export const updateFileAPI = (fileData: any) =>
  API.put('/file', fileData);

// [공통] 파일 삭제
export const deleteFileAPI = (id: string) =>
  API.delete(`/file/${id}`);

// [공통] 파일 단건 조회
export const getFileByIdAPI = (id: string) =>
  API.get(`/file/${id}`);

// [공통] 사용자별 파일 조회
export const getFilesByUserIdAPI = (userId: string) =>
  API.get(`/file/user/${userId}`);

// [근로계약서] 사용자별 근로계약서 조회
export const getContractsByUserIdAPI = (userId: string) =>
  API.get(`/file/contract/${userId}`);

// [보건증] 사용자별 보건증 조회
export const getHealthCertsByUserIdAPI = (userId: string) =>
  API.get(`/file/health-cert/${userId}`);

// ---------------------------------------------------------
// [스토어 멤버 관리 API] - StoreMemberC.java
// ---------------------------------------------------------

// [직원] 매장 근무 신청
export const applyForStoreAPI = (memberData: any) =>
  API.post('/store_member', memberData);

// [직원] 근무 가능 요일 설정
export const setAvailableDaysAPI = (storeId: string, userId: string, availableDays: string) =>
  API.put('/store_member/available-days', null, { params: { store_id: storeId, user_id: userId, available_days: availableDays } });

// [관리자] 직원 승인
export const approveStaffAPI = (userId: string, storeId: string) =>
  API.put('/store_member', null, { params: { user_id: userId, store_id: storeId } });

// [관리자] 직원 삭제 / 매장 직원 제거
export const removeStaffAPI = (storeId: string, userId: string) =>
  API.delete('/store_member', { params: { store_id: storeId, user_id: userId } });

// [관리자] 직원 급여 정보 조회
export const getPayInfoAPI = (userId: string, storeId: string) =>
  API.get('/store_member/pay', { params: { user_id: userId, store_id: storeId } });

// [관리자] 직원 급여 수정
export const updatePayInfoAPI = (payData: any) =>
  API.put('/store_member/pay', payData);

// [관리자] 대타 가능 직원 조회
export const getAvailableStaffAPI = (storeId: string) =>
  API.get('/store_member/available-days', { params: { store_id: storeId } });

// ---------------------------------------------------------
// [LINE 로그인 API] - LineLoginC.java
// ---------------------------------------------------------

// [LINE] 로그인 시작 (리다이렉트)
export const startLineLoginAPI = (userId: string) =>
  API.get(`/line/login`, { params: { userId } });

// [LINE] 콜백 처리 (백엔드에서 처리, 프론트 직접 호출 X)
export const lineLoginCallbackAPI = (code: string) =>
  API.get(`/line/callback`, { params: { code } });

// ---------------------------------------------------------
// [AI 혼잡도 분석 API] - AiCongestionC.java
// ---------------------------------------------------------

// [AI] 혼잡도 데이터 저장
export const saveCongestionLogAPI = (congestionData: any) =>
  API.post('/ai/congestion', congestionData);

// ---------------------------------------------------------
// [사용되지 않거나 중복된 API]
// ---------------------------------------------------------

/*
// ✅ [추가] 직원 상태 변경 API -> 백엔드에 없음
export const updateUserStatusAPI = (userId: string, status: string) =>
  API.patch(`/users/${userId}`, { status });

// ✅ [추가] 매장 정보 수정 API -> updateStoreAPI와 중복
export const updateStoreInfoAPI = (storeId: string, data: any) =>
  API.put(`/stores/${storeId}`, data);

// ✅ [추가] 내 스케줄 조회 API (직원용) -> getMyShiftListAPI와 유사, 백엔드에 없음
export const getMyScheduleAPI = (userId: string, storeId: string) => 
  API.get(`/shifts/my?user_id=${userId}&store_id=${storeId}`);

// ✅ [추가] 출퇴근 기록 조회 API -> 백엔드에 없음
export const getAttendanceRecordsAPI = (userId: string, month: string) =>
  API.get(`/attendance?user_id=${userId}&month=${month}`);

// [QR 출퇴근] 출근 기록 전송용 -> attendanceCheckAPI로 통합됨
export const checkInAPI = (userId: string, storeId: string) => 
  API.post(`/attendance/check-in`, { user_id: userId, store_id: storeId });

// [QR 출퇴근] 퇴근 기록 전송용 -> attendanceCheckAPI로 통합됨
export const checkOutAPI = (userId: string, storeId: string) => 
  API.post(`/attendance/check-out`, { user_id: userId, store_id: storeId });
*/
