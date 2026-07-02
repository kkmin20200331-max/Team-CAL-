# 📝 Team-CAL API 명세서 (API Specification)

> **Note:** 백엔드 Spring Boot 컨트롤러 코드를 전수 분석하여 실시간 동작 중인 100% 매칭되는 명세서입니다.

---

## 🔐 1. 인증 및 사용자 API

> 사용자 회원가입, 로그인, 닉네임 중복검사, 사업자번호 검증, 프로필 이미지 업로드 및 LINE 연동 정보 관리 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| register | `POST` | `/api/user-line` | - | `-` | `public void` |
| getLineInfo | `GET` | `/api/user-line` | `user_id` (Query) | `-` | `public UserLineVO` |
| delete | `DELETE` | `/api/user-line` | `user_id` (Query) | `-` | `public void` |
| registerUser | `POST` | `/api/users` | - | `UserVo` | `public ResponseEntity<?>` |
| approveStaff | `PUT` | `/api/users` | - | `UserVo` | `public void` |
| delUser | `DELETE` | `/api/users` | `id` (Query) | `-` | `public void` |
| getStaff | `GET` | `/api/users` | `store_id` (Query) | `-` | `public List<UserVo>` |
| approveUser | `PUT` | `/api/users/approve` | `id` (Query) | `-` | `public void` |
| checkNickname | `GET` | `/api/users/check-nickname` | `nickname` (Query) | `-` | `public ResponseEntity<?>` |
| checkUsername | `GET` | `/api/users/check-username` | `username` (Query) | `-` | `public ResponseEntity<?>` |
| getGuest | `GET` | `/api/users/guest` | `store_id` (Query), `role` (Query) | `-` | `public List<UserVo>` |
| login | `POST` | `/api/users/login` | - | `UserVo` | `public ResponseEntity<?>` |
| getPendingStaff | `GET` | `/api/users/pending` | `store_id` (Query), `role` (Query) | `-` | `public List<UserVo>` |
| validateBusiness | `POST` | `/api/users/validate-business` | - | `Map<String, String>` | `public ResponseEntity<?>` |
| uploadProfileImage | `POST` | `/api/users/{id}/profile-image` | `id` (Path), `file` (Query) | `-` | `public ResponseEntity<Map<String, String>>` |

## 🔄 2. 대타 관리 API

> 근무 대타 모집글 등록, 지원, 매칭 승인 및 신청 내역 관리 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| getPostList | `GET` | `/api/substitute` | `store_id` (Query) | `-` | `public List<SubstitutePostVO>` |
| getApplicationList | `GET` | `/api/substitute/manager` | `post_id` (Query) | `-` | `public List<SubstituteApplicationVO>` |
| approveSubstitute | `PUT` | `/api/substitute/manager` | `shift_id` (Query), `selected_user_id` (Query) | `SubstituteHistoryVO` | `public void` |
| cancelPost | `DELETE` | `/api/substitute/manager` | `post_id` (Query) | `-` | `public void` |
| createPost | `POST` | `/api/substitute/staff` | - | `SubstitutePostVO` | `public void` |
| cancelApplication | `DELETE` | `/api/substitute/staff` | `id` (Query) | `-` | `public void` |
| getMyApplications | `GET` | `/api/substitute/staff` | `user_id` (Query), `status` (Query) | `-` | `public List<SubstituteApplicationVO>` |
| apply | `POST` | `/api/substitute/staff/apply` | - | `SubstituteApplicationVO` | `public void` |
| getMyPosts | `GET` | `/api/substitute/staff/post` | `user_id` (Query), `status` (Query) | `-` | `public List<SubstitutePostVO>` |

## 🗓 3. 스케줄 및 휴무 API

> 근무 스케줄(Shift) 등록/조회/수정, 고정 스케줄 설정, 휴무 신청 및 승인(Leave Request) API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| registerFixedschedule | `POST` | `/api/fixedschedule` | - | `FixedscheduleVO` | `public void` |
| getFixedScheduleList | `GET` | `/api/fixedschedule` | `store_id` (Query) | `-` | `public List<FixedscheduleVO>` |
| updateFixedSchedule | `PUT` | `/api/fixedschedule` | - | `FixedscheduleVO` | `public void` |
| delFixedSchedule | `DELETE` | `/api/fixedschedule` | `id` (Query) | `-` | `public void` |
| getFixedSchedule | `GET` | `/api/fixedschedule/{id}` | `id` (Path) | `-` | `public FixedscheduleVO` |
| getLeaveRequestList | `GET` | `/api/leave_request` | `store_id` (Query) | `-` | `public List<LeaveRequestVO>` |
| registerLeaveRequest | `POST` | `/api/leave_request` | - | `LeaveRequestVO` | `public void` |
| cancelLeaveRequest | `DELETE` | `/api/leave_request` | `id` (Query) | `-` | `public void` |
| ownerCancelApprovedLeave | `DELETE` | `/api/leave_request/owner` | `id` (Query) | `-` | `public void` |
| getMyLeaveRequests | `GET` | `/api/leave_request/staff` | `user_id` (Query), `year` (Query), `month` (Query), `status` (Query) | `-` | `public List<LeaveRequestVO>` |
| getLeaveRequest | `GET` | `/api/leave_request/{id}` | `id` (Path) | `-` | `public LeaveRequestVO` |
| processLeaveRequest | `PUT` | `/api/leave_request/{id}` | `id` (Path), `status` (Query) | `-` | `public void` |
| registerShift | `POST` | `/api/shift` | - | `ShiftVO` | `public void` |
| getShiftList | `GET` | `/api/shift` | `store_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public List<ShiftVO>` |
| updateShift | `PUT` | `/api/shift` | - | `ShiftVO` | `public void` |
| delShift | `DELETE` | `/api/shift` | `id` (Query) | `-` | `public void` |
| applyAiSchedule | `POST` | `/api/shift/ai-apply` | - | `AiScheduleRequestVO` | `public void` |
| generateAutomatedShifts | `POST` | `/api/shift/ai-generate` | `store_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public void` |
| previewAiSchedule | `POST` | `/api/shift/ai-preview` | - | `AiScheduleRequestVO` | `public AiSchedulePreviewVO` |
| applyFixedShifts | `POST` | `/api/shift/fixed` | `store_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public void` |
| getMyShiftList | `GET` | `/api/shift/staff` | `user_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public List<ShiftVO>` |
| getShift | `GET` | `/api/shift/{id}` | `id` (Path) | `-` | `public ShiftVO` |

## 🏢 4. 출퇴근 및 QR 체크 API

> QR 출퇴근 확인 및 출퇴근 기록 보존 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| attendanceCheck | `POST` | `/api/attendance/check` | - | `Map<String,String>` | `public String` |
| getMonthlyAttendance | `GET` | `/api/attendance/monthly` | `store_id` (Query), `user_id` (Query), `yearMonth` (Query) | `-` | `public List<AttendanceVO>` |
| checkByQr | `POST` | `/api/attendance/qr/check` | - | `Map<String, String>` | `public ResponseEntity<Map<String, String>>` |
| generateQr | `POST` | `/api/attendance/qr/{store_id}` | `store_id` (Path) | `-` | `public AttendanceQrVO` |

## 📊 5. 통계 및 급여 API

> 주간/월간 근무 통계 조회 및 매장/개인 급여 정산 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| getPayroll | `GET` | `/api/payroll` | `user_id` (Query), `store_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public PayrollResultVO` |
| getStorePayroll | `GET` | `/api/payroll/store` | `store_id` (Query), `year_month` (Query) | `-` | `public List<PayrollEntryVO>` |

## 📢 6. 게시판 API

> 매장 공지사항, 건의사항 등 게시글 등록/수정/삭제 및 댓글 기능 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| registerBoard | `POST` | `/api/board` | - | `BoardVO` | `public void` |
| updateBoard | `PUT` | `/api/board` | - | `BoardVO` | `public void` |
| deleteBoard | `DELETE` | `/api/board` | `id` (Query) | `-` | `public void` |
| getBoardList | `GET` | `/api/board` | `store_id` (Query) | `-` | `public List<BoardVO>` |
| getCommentList | `GET` | `/api/board/comment` | `post_id` (Query) | `-` | `public List<BoardCommentVO>` |
| createComment | `POST` | `/api/board/comment` | - | `BoardCommentVO` | `public void` |
| updateComment | `PUT` | `/api/board/comment` | - | `BoardCommentVO` | `public void` |
| deleteComment | `DELETE` | `/api/board/comment` | `id` (Query), `post_id` (Query), `user_id` (Query) | `-` | `public void` |
| getPostList | `GET` | `/api/board/post` | `board_id` (Query) | `-` | `public List<BoardPostVO>` |
| createPost | `POST` | `/api/board/post` | - | `BoardPostVO` | `public void` |
| updatePost | `PUT` | `/api/board/post` | - | `BoardPostVO` | `public void` |
| deletePost | `DELETE` | `/api/board/post` | `id` (Query) | `-` | `public void` |
| searchPost | `GET` | `/api/board/post/search` | `store_id` (Query), `keyword` (Query) | `-` | `public List<BoardPostVO>` |
| getPost | `GET` | `/api/board/post/{id}` | `id` (Path) | `-` | `public BoardPostVO` |
| getBoard | `GET` | `/api/board/{id}` | `id` (Path) | `-` | `public BoardVO` |

## Store 및 StoreMember 관리 API

> 가게 등록/조회/수정/삭제 및 직원 채용 승인, 권한 및 시급 정보 변경 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| registerStore | `POST` | `/api/store` | - | `StoreVo` | `public void` |
| getStoreList | `GET` | `/api/store` | `user_id` (Query) | `-` | `public List<StoreVo>` |
| updateStore | `PUT` | `/api/store` | - | `StoreVo` | `public void` |
| delStore | `DELETE` | `/api/store` | `id` (Query) | `-` | `public void` |
| getAllStores | `GET` | `/api/store/all` | - | `-` | `public List<StoreVo>` |
| getMyStore | `GET` | `/api/store/my` | `user_id` (Query) | `-` | `public StoreVo` |
| getMyStoreMemberships | `GET` | `/api/store/my-memberships` | `user_id` (Query) | `-` | `public List<StoreVo>` |
| getStore | `GET` | `/api/store/{id}` | `id` (Path) | `-` | `public StoreVo` |
| approveRegister | `POST` | `/api/store_member` | - | `StoreMemberVo` | `public void` |
| updateStoreMember | `PUT` | `/api/store_member` | `user_id` (Query), `store_id` (Query) | `-` | `public void` |
| deleteStoreMember | `DELETE` | `/api/store_member` | `store_id` (Query), `user_id` (Query) | `-` | `public void` |
| updateAvailableDays | `PUT` | `/api/store_member/available-days` | `store_id` (Query), `user_id` (Query), `available_days` (Query) | `-` | `public void` |
| getAvailableMemberList | `GET` | `/api/store_member/available-days` | `store_id` (Query) | `-` | `public List<StoreMemberVo>` |
| getMemberInfo | `GET` | `/api/store_member/pay` | `user_id` (Query), `store_id` (Query) | `-` | `public StoreMemberVo` |
| updatePayInfo | `PUT` | `/api/store_member/pay` | - | `StoreMemberVo` | `public void` |
| approveRequestById | `PUT` | `/api/store_member/{id}/approve` | `id` (Path) | `-` | `public void` |
| rejectRequestById | `DELETE` | `/api/store_member/{id}/reject` | `id` (Path) | `-` | `public void` |

## 🖼️ 파일 및 서류 관리 API (보건증/근로계약서)

> 보건증 및 근로계약서 파일 업로드, 조회, 관리자 최종 승인 및 OCR 처리 요청 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| insertFile | `POST` | `/api/file` | - | `FileVO` | `public void` |
| updateFile | `PUT` | `/api/file` | - | `FileVO` | `public void` |
| getContractsByUserId | `GET` | `/api/file/contract/{userId}` | `userId` (Path) | `-` | `public List<FileVO>` |
| getHealthCertsByUserId | `GET` | `/api/file/health-cert/{userId}` | `userId` (Path) | `-` | `public List<FileVO>` |
| getFilesByStoreId | `GET` | `/api/file/store/{storeId}` | `storeId` (Path) | `-` | `public List<FileVO>` |
| uploadToSupabase | `POST` | `/api/file/supabase/upload` | `user_id` (Query), `file_type` (Query), `file` (Query) | `-` | `public ResponseEntity<?>` |
| deleteFromSupabase | `DELETE` | `/api/file/supabase/{id}` | `id` (Path) | `-` | `public ResponseEntity<?>` |
| uploadFile | `POST` | `/api/file/upload` | `store_id` (Query), `user_id` (Query), `file_type` (Query), `file` (Query) | `-` | `public FileVO` |
| getFilesByUserId | `GET` | `/api/file/user/{userId}` | `userId` (Path) | `-` | `public List<FileVO>` |
| deleteFile | `DELETE` | `/api/file/{id}` | `id` (Path) | `-` | `public void` |
| getFileById | `GET` | `/api/file/{id}` | `id` (Path) | `-` | `public FileVO` |
| runOcr | `POST` | `/api/file/{id}/ocr` | `id` (Path) | `-` | `public FileVO` |
| createSignedUrl | `GET` | `/api/file/{id}/signed-url` | `id` (Path) | `-` | `public Map<String, String>` |
| updateStatus | `PUT` | `/api/file/{id}/status` | `id` (Path), `status` (Query) | `-` | `public ResponseEntity<Void>` |
| getLegacySignedUrl | `GET` | `/api/file/{id}/url` | `id` (Path) | `-` | `public ResponseEntity<?>` |

## 🤖 AI Insights & CCTV 연동 API

> CCTV 연동 카메라 관리, OpenCV 혼잡도 저장, AI 스케줄 및 혼잡도 예측 분석 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| analyze | `POST` | `/api/ai-insights/analyze` | - | `AiInsightAnalyzeRequestVO` | `public ResponseEntity<String>` |
| analyzeWithLlm | `POST` | `/api/ai-insights/analyze/llm` | - | `AiInsightAnalyzeRequestVO` | `public ResponseEntity<String>` |
| saveCongestionLog | `POST` | `/api/ai/congestion` | - | `OpenCvCongestionPayloadVO` | `public ResponseEntity<Map<String, Object>>` |
| latestAggregate | `GET` | `/api/cctv/aggregate/latest` | - | `-` | `public ResponseEntity<String>` |
| metrics | `GET` | `/api/cctv/metrics` | - | `-` | `public ResponseEntity<String>` |
| startCamera | `POST` | `/api/cctv/start` | - | `Map<String, Object>` | `public ResponseEntity<String>` |
| status | `GET` | `/api/cctv/status` | - | `-` | `public ResponseEntity<String>` |
| stopCamera | `POST` | `/api/cctv/stop` | - | `-` | `public ResponseEntity<String>` |
| savePeopleLog | `POST` | `/people_log` | - | `PeopleLogVO` | `public void` |
| getPeopleLogList | `GET` | `/people_log` | `store_id` (Query), `start_date` (Query), `end_date` (Query) | `-` | `public List<PeopleLogVO>` |
| saveOpenCvData | `POST` | `/people_log/opencv` | `store_id` (Query) | `-` | `public void` |

## 💬 LINE 연동 및 알림 API

> LINE 알림 웹훅 처리, 로그인 인증 콜백 및 푸시 알림 내역 관리 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| callback | `GET` | `/api/line/callback` | `code` (Query), `state` (Query), `error` (Query), `error_description` (Query) | `-` | `public RedirectView` |
| lineLogin | `GET` | `/api/line/login` | `userId` (Query) | `-` | `public RedirectView` |
| test | `GET` | `/api/line/test` | - | `-` | `public String` |
| webhook | `POST` | `/api/line/webhook` | - | `String` | `public ResponseEntity<String>` |
| getNotifications | `GET` | `/api/notification` | `user_id` (Query) | `-` | `public List<NotificationVO>` |
| createNotification | `POST` | `/api/notification` | - | `NotificationVO` | `public void` |
| markAsRead | `PUT` | `/api/notification/read` | `id` (Query) | `-` | `public void` |
| markAllAsRead | `PUT` | `/api/notification/read-all` | `user_id` (Query) | `-` | `public void` |
| countUnread | `GET` | `/api/notification/unread-count` | `user_id` (Query) | `-` | `public Map<String, Integer>` |

## 기타 API

| 기능 (컨트롤러 메소드) | Method | URL | Parameters | Request Body | 리턴 타입 |
| --- | --- | --- | --- | --- | --- |
| getApplications | `GET` | `/api/admin-applications` | `status` (Query) | `-` | `public List<AdminApplicationVo>` |
| approveApplication | `PUT` | `/api/admin-applications/{id}/approve` | `id` (Path) | `Map<String, String>` | `public void` |
| rejectApplication | `PUT` | `/api/admin-applications/{id}/reject` | `id` (Path) | `Map<String, String>` | `public void` |

