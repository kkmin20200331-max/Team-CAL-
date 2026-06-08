// 사용자(User) 데이터의 형태를 정의하는 설계도입니다.
export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  
  // 역할: 관리자, 직원, 또는 승인 대기자
  role: 'ADMIN' | 'STAFF' | 'GUEST';
  
  // 계정 상태: 활성, 또는 승인 대기 중
  status: 'ACTIVE' | 'PENDING';

  // [선택] 프로필 이미지 주소
  profileImage?: string;

  // [선택] 매장 ID
  store_id?: string;

  // [선택] 브랜드 이름 (예: 컴포즈커피)
  brandName?: string;

  // [선택] 지점 이름 (예: 미금점)
  branchName?: string;
}
