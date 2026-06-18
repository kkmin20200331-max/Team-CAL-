# 🧑‍💻 Today's Work (오늘의 작업 목록)

## 1. 관리자 기능 강화 및 역할 분리

- **관리자용 직원 관리 API 추가**:
  - 직원의 보건증 및 근로계약서 목록을 조회하는 API 함수 (`getHealthCertificatesAPI`, `getEmploymentContractsAPI`)를 `api/auth.ts`에 추가했습니다.
  - 직원의 휴무 신청 내역을 조회하고, 승인/거절하는 API 함수 (`getLeaveRequestsAPI`, `approveLeaveRequestAPI`, `denyLeaveRequestAPI`)를 추가했습니다.
- **마이페이지 역할 분리 (관리자/직원)**:
  - `MyPageScreen.tsx`를 수정하여, 접속한 사용자의 역할(`role`)이 'ADMIN'일 경우 '직원 관리' 메뉴가 표시되도록 구현했습니다.
  - '직원 관리' 메뉴에는 '보건증 관리', '근로계약서 관리', '휴무 신청 관리' 등의 하위 메뉴를 추가했습니다.
  - 기존의 '나의 급여', '내 보건증/계약서' 등의 메뉴는 'STAFF' 역할의 직원에게만 보이도록 조정했습니다.

## 2. 직원 기능 추가

- **문서 업로드 API 추가**:
  - 직원이 자신의 보건증과 근로계약서 파일을 업로드할 수 있는 API 함수 (`uploadHealthCertificateAPI`, `uploadEmploymentContractAPI`)를 `api/auth.ts`에 추가했습니다.
- **문서 업로드 화면 구현**:
  - `HealthCertScreen.tsx`과 `ContractScreen.tsx` 파일에 이미지 선택 및 `FormData`를 이용한 파일 업로드 로직을 구현하고, 실제 API와 연동했습니다.

## 3. 다크 모드 UI 전체 리팩토링 및 버그 수정

- **문제 상황**: 앱 전체적으로 다크 모드 적용 시, 일부 텍스트, 아이콘, 배경 등이 하드코딩된 색상(예: `black`, `#FFFFFF`)으로 인해 보이지 않거나 어색하게 표시되는 문제가 있었습니다.
- **해결 과정**:
  1. **중앙 테마 시스템 강화**: `contexts/ThemeContext.tsx`에 `primary`, `red`, `green`, `saturday`, `disabled` 등 의미 기반의 색상 변수를 라이트/다크 모드에 맞게 추가하여, 색상 관리의 중앙 소스를 강화했습니다.
  2. **전체 화면 및 컴포넌트 스캔**: `screens`와 `components` 디렉터리 하위의 모든 `.tsx` 파일을 체계적으로 검토했습니다.
  3. **하드코딩 색상 교체**: 발견된 모든 하드코딩 색상 값을 `ThemeContext`에서 제공하는 `colors` 객체의 변수로 교체했습니다. (예: `color: '#000'` -> `color: colors.text`)
  4. **`isDarkMode` Prop 제거**: 각 컴포넌트에 `isDarkMode` prop을 전달하여 조건부 스타일링을 하던 기존 방식을 제거하고, `useTheme()` 훅을 통해 테마 색상을 직접 사용하도록 통일하여 코드의 일관성과 단순성을 높였습니다.
- **수정된 주요 화면**:
  - `screens/auth/*` (로그인, 회원가입 등)
  - `screens/board/*` (게시판, 글쓰기, 상세, 알림)
  - `screens/main/*` (대시보드, QR, 지점선택)
  - `screens/mypage/*` (마이페이지, 보건증, 계약서)
  - `screens/schedule/*` (스케줄, 월간보기)
  - `components/dashboard/*` (대시보드 카드 컴포넌트)
  - `components/common/*` (공용 모달 컴포넌트)

## 4. 결과

- 관리자와 직원의 역할에 따른 명확한 기능 분리와 사용성을 개선했습니다.
- 앱 전체의 다크 모드 UI 일관성을 확보하여 사용자 경험을 크게 향상시켰습니다.
- 중앙화된 테마 시스템을 통해 향후 유지보수 및 디자인 변경이 용이하도록 코드 구조를 개선했습니다.
