import axios from "axios";

// ✅ [수정] 안드로이드 에뮬레이터용 주소(10.0.2.2)로 직접 연결합니다.
// (만약 본인 스마트폰 기계로 직접 연결해서 테스트 중이시라면 PC의 IP주소 예: 192.168.x.x 를 넣으셔야 합니다)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("EXPO_PUBLIC_API_BASE_URL is not set.");
}

export const API = axios.create({
  baseURL: API_BASE_URL,
  // baseURL: NGROK_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ [추가] 요청(Request) 인터셉터: 프론트엔드에서 백엔드로 데이터를 보내기 "직전"에 실행됨
API.interceptors.request.use(
  (config) => {
    console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`);
    // 💡 나중에 JWT 로그인 토큰을 사용하게 되면 여기서 AsyncStorage에서 토큰을 꺼내 헤더에 자동으로 붙여줍니다.
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ [추가] 응답(Response) 인터셉터: 백엔드에서 응답이 화면(컴포넌트)으로 가기 "직전"에 가로챔
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API 에러] ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    // 💡 예: error.response?.status === 401(권한 없음)일 때 강제 로그아웃 시키는 등의 전역 에러 처리를 여기서 합니다.
    return Promise.reject(error);
  },
);

export const loginAPI = (username: string, password: string) =>
  API.post("/users/login", { username, password });

// 메모: 백엔드 users 테이블 기준 필수값(id, username, password, name, phone, role, status)을 모두 보냅니다.
export const signupAPI = (data: {
  id: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "PENDING";
  brandName?: string;
  branchName?: string | null;
  openTime?: string;
  closeTime?: string;
  maxCapacity?: number;
  selectedBrand?: string;
  selectedBranch?: string;
  storeAddress?: string;
  storeType?: string;
}) => API.post("/users", data);

// ✅ [추가] 개인정보 수정 API
export const updateProfileAPI = (data: any) => API.put(`/users`, data);

export const getMyStoreAPI = (userId: string) =>
  API.get(`/store/my`, { params: { user_id: userId } });

export const getMyStoreMembershipsAPI = (userId: string) =>
  API.get(`/store/my-memberships`, { params: { user_id: userId } });

export const getStoresAPI = (userId: string) =>
  API.get(`/store`, { params: { user_id: userId } });

export const getAllStoresAPI = () =>
  API.get(`/store/all`);

export const createStoreAPI = (data: {
  id: string;
  name: string;
  type?: string;
  address?: string;
  capacity?: number;
  open_time?: string;
  close_time?: string;
  owner_user_id?: string;
}) => API.post(`/store`, data);

export const requestStoreJoinAPI = (userId: string, storeId: string) =>
  API.post(`/store_member`, { user_id: userId, store_id: storeId });

export const approveStoreMemberAPI = (userId: string, storeId: string) =>
  API.put(`/store_member`, null, { params: { user_id: userId, store_id: storeId } });

export const rejectStoreMemberAPI = (userId: string, storeId: string) =>
  API.delete(`/store_member`, { params: { user_id: userId, store_id: storeId } });

// ✅ [추가] 내 스케줄 조회 API (직원용)
export const getMyScheduleAPI = (
  userId: string,
  startDate: string,
  endDate: string,
) =>
  API.get(`/shift/staff`, {
    params: { user_id: userId, start_date: startDate, end_date: endDate },
  });

// ✅ [추가] 휴무 신청 API
export const requestLeaveAPI = (data: {
  shift_id: string;
  user_id: string;
  reason: string;
}) => API.post(`/leave_request`, data);

// ---------------------------------------------------------
// 💡 [예정] 앞으로 연동할 빈 껍데기 API 함수들을 미리 선언해 둡니다.
// ---------------------------------------------------------

// [대시보드] 이번 주 통계 데이터 조회용
export const getWeeklyStatsAPI = (userId: string, storeId: string) =>
  API.get(`/stats/weekly?user_id=${userId}&store_id=${storeId}`);

// [게시판] 사내 게시판 목록 조회용
export const getBoardPostsAPI = (storeId: string) =>
  API.get(`/board`, { params: { store_id: storeId } });

export const getBoardPostListAPI = (boardId: string) =>
  API.get(`/board/post`, { params: { board_id: boardId } });

export const createBoardAPI = (data: any) => API.post(`/board`, data);

export const deleteBoardAPI = (boardId: string) =>
  API.delete(`/board`, { params: { id: boardId } });

export const deleteBoardPostAPI = (postId: string) =>
  API.delete(`/board/post`, { params: { id: postId } });

export const getBoardPostAPI = (postId: string) => API.get(`/board/post/${postId}`);

export const updateBoardPostAPI = (data: any) => API.put(`/board/post`, data);

export const getStoreStaffAPI = (storeId: string) =>
  API.get(`/users`, { params: { store_id: storeId } });

export const getStorePendingStaffAPI = (storeId: string) =>
  API.get(`/users/pending`, { params: { store_id: storeId, role: "admin" } });

export const getStoreShiftsAPI = (
  storeId: string,
  startDate: string,
  endDate: string,
) =>
  API.get(`/shift`, {
    params: { store_id: storeId, start_date: startDate, end_date: endDate },
  });

export const getPayrollAPI = (
  userId: string,
  storeId: string,
  startDate: string,
  endDate: string,
) =>
  API.get(`/payroll`, {
    params: {
      user_id: userId,
      store_id: storeId,
      start_date: startDate,
      end_date: endDate,
    },
  });

export const getMonthlyAttendanceAPI = (
  userId: string,
  storeId: string,
  yearMonth: string,
) =>
  API.get(`/attendance/monthly`, {
    params: { user_id: userId, store_id: storeId, yearMonth },
  });

export const getNotificationsAPI = (userId: string) =>
  API.get(`/notification`, { params: { user_id: userId } });

export const markNotificationAsReadAPI = (id: string) =>
  API.put(`/notification/read`, null, { params: { id } });

export const markAllNotificationsAsReadAPI = (userId: string) =>
  API.put(`/notification/read-all`, null, { params: { user_id: userId } });

// [QR 출퇴근] QR 토큰 검증 후 출근/퇴근 토글
export const checkAttendanceByQrAPI = (userId: string, qrToken: string) =>
  API.post(`/attendance/qr/check`, { user_id: userId, qr_token: qrToken });

// 기존 수동 출퇴근 토글
export const checkAttendanceAPI = (userId: string, storeId: string) =>
  API.post(`/attendance/check`, { user_id: userId, store_id: storeId });

// [게시판] 새 글 작성 API (직원/관리자 공통)
export const createBoardPostAPI = (data: any) => API.post(`/board/post`, data);

export const getShiftAPI = (id: string) => API.get(`/shift/${id}`);

export const getSubstitutePostsAPI = (storeId: string) =>
  API.get(`/substitute`, { params: { store_id: storeId } });

export const getSubstituteApplicationsAPI = (postId: string) =>
  API.get(`/substitute/manager`, { params: { post_id: postId } });

export const approveSubstituteAPI = (
  shiftId: string,
  selectedUserId: string,
  data: any,
) =>
  API.put(`/substitute/manager`, data, {
    params: { shift_id: shiftId, selected_user_id: selectedUserId },
  });

export const cancelSubstitutePostAPI = (postId: string) =>
  API.delete(`/substitute/manager`, { params: { post_id: postId } });

// 대타 모집글 등록 (직원)
export const createSubstitutePostAPI = (data: {
  id: string;
  shift_id: string;
  store_id: string;
  requester_user_id: string;
  reason?: string;
  status: string;
}) => API.post(`/substitute/staff`, data);

// 대타 지원 (직원)
export const applySubstituteAPI = (data: {
  id: string;
  substitute_post_id: string;
  applicant_user_id: string;
  message?: string;
  status: string;
}) => API.post(`/substitute/staff/apply`, data);

// 대타 지원 취소 (직원)
export const cancelSubstituteApplicationAPI = (id: string) =>
  API.delete(`/substitute/staff`, { params: { id } });

// 내 대타 지원 내역 조회 (직원)
export const getMySubstituteApplicationsAPI = (userId: string, status?: string) =>
  API.get(`/substitute/staff`, { params: { user_id: userId, status } });

// 내가 작성한 대타 모집글 조회 (직원)
export const getMySubstitutePostsAPI = (userId: string, status?: string) =>
  API.get(`/substitute/staff/post`, { params: { user_id: userId, status } });

// 보건증 목록 조회 API
export const getHealthCertsAPI = (userId: string) =>
  API.get(`/file/health-cert/${userId}`);

// 근로계약서 목록 조회 API
export const getContractsAPI = (userId: string) =>
  API.get(`/file/contract/${userId}`);

// 파일 업로드 API
export const uploadFileAPI = (formData: FormData) =>
  API.post(`/file/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// 추가 보강 API
export const getStaffListAPI = (storeId: string) =>
  API.get('/users', { params: { store_id: storeId } });

export const registerShiftAPI = (data: any) =>
  API.post('/shift', data);

export const updateShiftAPI = (data: any) =>
  API.put('/shift', data);

export const deleteShiftAPI = (id: string) =>
  API.delete('/shift', { params: { id } });

export const getLeaveRequestsAPI = (storeId: string) =>
  API.get('/leave_request', { params: { store_id: storeId } });

export const processLeaveRequestAPI = (id: string, status: string) =>
  API.put(`/leave_request/${id}`, null, { params: { status } });

export const getAttendanceRecordsAPI = (userId: string, yearMonth: string, storeId?: string) =>
  API.get('/attendance/monthly', { params: { user_id: userId, yearMonth, store_id: storeId } });

export const updateStoreAPI = (data: any) =>
  API.put('/store', data);

export const getSubstituteApplicantsAPI = getSubstituteApplicationsAPI;
export const applyForSubstituteAPI = applySubstituteAPI;

// ✅ [추가] 게시판 댓글 API 연동 (댓글 조회, 생성, 삭제)
export const getCommentsAPI = (postId: string) =>
  API.get("/board/comment", { params: { post_id: postId } });

export const createCommentAPI = (data: {
  id: string;
  post_id: string;
  store_id: string;
  user_id: string;
  content: string;
}) => API.post("/board/comment", data);

export const deleteCommentAPI = (id: string, postId: string, userId: string) =>
  API.delete("/board/comment", { params: { id, post_id: postId, user_id: userId } });

// LINE 연동 관련 API
export const getLineInfoAPI = (userId: string) =>
  API.get('/user-line', { params: { user_id: userId } });

export const deleteLineInfoAPI = (userId: string) =>
  API.delete('/user-line', { params: { user_id: userId } });

export const updateUserLanguageAPI = (userId: string, language: string) =>
  API.put(`/users/${encodeURIComponent(userId)}/language`, { language });



