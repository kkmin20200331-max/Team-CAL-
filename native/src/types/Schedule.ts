// 스케줄(근무) 데이터 하나의 형태를 정의하는 설계도입니다.
export interface Shift {
  id: string;
  userId?: string;
  fullDate: string; // 예: "2026-06-02"
  date: string;     // 예: "02"
  day: string;      // 예: "화"
  time: string;     // 예: "14:00 - 22:00" 또는 "휴무"
  storeName: string;
  reason?: string;

  // 근무 상태: 예정, 진행중, 완료, 대타요청, 또는 휴무
  status: 'SCHEDULED' | 'CONFIRMED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBSTITUTE_REQ' | 'OFF';

  // [선택] 실제 출근 시간 (예: "13:59")
  checkInTime?: string | null;

  // [선택] 실제 퇴근 시간 (예: "22:01")
  checkOutTime?: string | null;
}