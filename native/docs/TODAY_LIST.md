# 🧑‍💻 Today's Work (오늘의 작업 목록)

## 5. Native API 정의 전체 동기화

- **문제 상황**: 프론트엔드 `native/api/auth.ts`에 정의된 일부 API 함수들이 실제 백엔드 컨트롤러의 URL, 파라미터, HTTP 메소드와 일치하지 않아 API 호출 시 오류가 발생할 가능성이 있었습니다.
- **해결 과정**:
  1. **백엔드 컨트롤러 전체 분석**: `UserC`, `StoreC`, `ShiftC`, `BoardPostC`, `LeaveRequestC`, `SubstituteC`, `PayrollC`, `FileC`, `StoreMemberC`, `LineLoginC`, `AiCongestionC` 등 모든 컨트롤러의 Java 코드를 분석하여 API 명세를 확인했습니다.
  2. **`auth.ts` 파일 전체 수정**: 분석한 명세를 바탕으로 `auth.ts` 파일의 모든 API 함수를 실제 백엔드와 100% 일치하도록 수정했습니다.
     - 잘못된 URL 경로 및 파라미터 수정
     - 백엔드에 존재하지 않는 API 함수 주석 처리
     - 각 API 그룹별로 해당하는 컨트롤러 파일명을 주석으로 명시하여 가독성 향상
- **결과**: 프론트엔드와 백엔드 간의 API 명세 불일치 문제를 해결하여, 향후 개발 시 발생할 수 있는 통신 오류를 사전에 방지했습니다.

## 6. LINE 연동 기능 테스트 및 환경 구축

- **목표**: 사용자가 자신의 계정에 LINE 알림을 받을 수 있도록 연동하는 기능의 실제 동작 여부를 확인하고, 테스트 환경을 구축합니다.
- **문제 해결 과정**:
  1. **터널링 서비스 도입**: 로컬에서 실행 중인 백엔드 서버를 외부(LINE 서버, 모바일 앱)에서 접속할 수 있도록 터널링 서비스 도입을 결정했습니다.
  2. **`cloudflared` 호환성 문제 식별**: 초기에는 `cloudflared`를 사용하려 했으나, 사용자 PC 환경(보안 프로그램, 네트워크 설정 등)과의 호환성 문제로 인해 터널 연결에 실패했습니다.
  3. **`ngrok`으로 전환 및 성공**: 대안으로 `ngrok`을 도입하여 터널링에 성공했습니다. 이 과정에서 `ngrok` 설치, 계정 인증, 터널 실행 방법을 확립했습니다.
  4. **통신 환경 통일**: `ngrok`으로 생성된 공개 주소(`https://...ngrok-free.dev`)를 기준으로 모든 관련 설정을 통일했습니다.
     - **프론트엔드**: `native/api/auth.ts`의 `baseURL`을 `ngrok` 주소로 변경.
     - **백엔드**: `application.properties`의 `line.login.redirect-uri` 값을 `ngrok` 주소로 변경하도록 백엔드 담당자에게 요청.
     - **LINE 서버**: LINE Developers Console의 Callback URL을 `ngrok` 주소로 변경하도록 백엔드 담당자에게 요청.
  5. **테스트 화면 구현**: LINE 연동 과정을 테스트하기 위한 임시 화면(`LineTestScreen.tsx`)과 시작점(`App.tsx` 수정)을 구현했습니다.
- **현재 상태 및 다음 단계**:
  - **현재 상태**: 백엔드 및 LINE Developers Console의 주소 변경이 완료되면 즉시 테스트 가능한 상태입니다.
  - **다음 단계**: 백엔드 담당자의 설정 변경 완료 후, 최종 연동 테스트를 진행하고 성공 여부를 확인합니다.

---
---

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
