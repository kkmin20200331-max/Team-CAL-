# ShiftOps — 소규모 매장 통합 인력·운영 관리 플랫폼

> **팀 프로젝트** | 풀스택 + AI + 모바일
> **기간**: 2026년
> **형태**: 팀 개발 (Team CAL)

---

## 📌 프로젝트 개요

**ShiftOps**는 소규모 매장(카페, 음식점, 편의점 등)의 사장님과 아르바이트 직원을 위한 **통합 인력·운영 관리 플랫폼**입니다.
스케줄 관리, QR 출퇴근, 급여 자동 계산, AI 기반 혼잡도 분석 및 자동 스케줄 생성, 문서 OCR, 대타 모집, LINE 알림까지 실무에서 필요한 기능을 하나의 서비스로 제공합니다.

| 구분 | 내용 |
|------|------|
| 웹 어드민 | 사장님용 웹 대시보드 (React + Vite + TypeScript) |
| 모바일 앱 | 직원용 앱 (React Native + Expo) |
| 백엔드 | REST API 서버 (Spring Boot 3.x + Java 17) |
| AI 서버 | 비전·스케줄 AI 추론 서버 (FastAPI + Python) |
| DB | Oracle Cloud (ATP) + Redis |
| 파일 스토리지 | Supabase Storage |

---

## 🏗️ 시스템 아키텍처

```
┌────────────────────────────────────────────────────────────┐
│  Client Layer                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │  Web Admin (React)   │  │  Mobile App (React Native)  │ │
│  │  Vite + TypeScript   │  │  Expo + TypeScript          │ │
│  └──────────┬───────────┘  └──────────────┬──────────────┘ │
└─────────────┼────────────────────────────┼────────────────┘
              │ REST API                   │ REST API
┌─────────────▼────────────────────────────▼────────────────┐
│  Backend Layer                                            │
│  Spring Boot 3.x  │  Java 17  │  MyBatis  │  HikariCP    │
│  Controller → Service → Mapper → Oracle Cloud DB          │
│  Redis (QR 세션 / 캐시)  │  Supabase Storage (파일)       │
└──────────────────────────────┬────────────────────────────┘
                               │ HTTP
┌──────────────────────────────▼────────────────────────────┐
│  AI Server Layer (FastAPI / Python)                       │
│  YOLO11s  │  OpenCV  │  OpenAI / Gemini LLM               │
│  CCTV 혼잡도 분석, AI 인사이트, AI 스케줄 생성, OCR        │
└──────────────────────────────┬────────────────────────────┘
                               │ Webhook
┌──────────────────────────────▼─────┐
│  LINE Messaging API                │
│  (알림 / 대타 모집 / 근태 Push)    │
└────────────────────────────────────┘
```

---

## 🛠️ 기술 스택

### Backend
| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | Java 17, Spring Boot 3.5 |
| ORM / DB 접근 | MyBatis 3.0, HikariCP |
| DB | Oracle Cloud ATP (TCPS/TLS), Redis |
| 파일 스토리지 | Supabase Storage |
| 외부 API | LINE Messaging API, LINE Login OAuth2, 공공데이터포털(사업자등록번호 검증), Google Translate API |
| 빌드 | Gradle |

### AI Server
| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | Python 3.x, FastAPI, Uvicorn |
| 비전 AI | YOLO11s / YOLOv8 (Ultralytics), OpenCV |
| LLM | OpenAI GPT / Google Gemini (전환 가능한 Provider 패턴) |
| OCR | Naver CLOVA OCR |
| 비동기 처리 | 멀티스레드 추론 Worker + 전송 큐 |

### Frontend (Web Admin)
| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | TypeScript, React 18, Vite 6 |
| UI 라이브러리 | shadcn/ui (Radix UI), MUI, Tailwind CSS v4 |
| 상태 / 라우팅 | React Router v7, React Hook Form |
| 차트 | Recharts |
| 애니메이션 | Framer Motion |

### Mobile (직원 앱)
| 분류 | 기술 |
|------|------|
| 언어 / 프레임워크 | TypeScript, React Native 0.81, Expo SDK 54 |
| 네비게이션 | React Navigation (Stack + BottomTab) |
| 상태관리 | Zustand |
| 기타 | expo-camera (QR 스캔), expo-notifications (Push 알림) |

---

## ✨ 핵심 기능

### 1. 스케줄 관리 (월간 / 주간 / 일간)
- 관리자가 월간·주간·일간 뷰에서 근무표를 직접 작성·편집
- 고정 스케줄(고정 요일·시간대) 등록 및 반영
- 직원별 가용 요일 설정, 연차·휴가 신청 및 승인 워크플로우

### 2. AI 자동 스케줄 생성
- **CCTV 혼잡도 데이터(People Log)** + **기존 근무표** + **고정 스케줄** + **연차 정보**를 종합 입력
- 시간 슬롯별 예상 고객 수 계산 → 필요 인원 산출 → 후보 직원 자동 배정
- 신입 단독 근무 방지, 마감 담당자 우선 배정 등 운영 규칙 반영
- 인접 슬롯 병합으로 불필요한 분절 방지
- LLM(GPT 또는 Gemini)으로 배정 이유 한국어 자동 생성

### 3. AI 인사이트 대시보드
- CCTV 혼잡도, YOLO 감지 고객 수, 외부 요인 종합 분석
- `STAFFING`, `CONVERSION`, `CONGESTION`, `SCHEDULE` 4가지 유형 인사이트 카드 생성
- 위험도(LOW / MEDIUM / HIGH), 혼잡도 레벨, 스케줄 적합도 등 운영 지표 출력
- LLM Provider를 OpenAI↔Gemini 간 환경 변수 1개로 전환 가능

### 4. CCTV 혼잡도 분석 (OpenCV + YOLO)
- RTSP 스트림 / 동영상 파일 / 웹캠 소스 지원
- 병렬 YOLO 추론 Worker로 고속 처리 (INFERENCE_WORKERS 설정)
- 프레임 샘플링 ↔ 추론을 분리하여 처리 지연 방지
- 집계 JSON을 Spring Boot에 주기적으로 POST 전송, 실패 시 파일 로그 기록 후 재시도

### 5. QR 출퇴근
- 관리자가 웹/앱에서 **30초 유효 QR 토큰** 생성
- 직원이 앱의 expo-camera로 QR 스캔 → 서버에서 토큰 검증 → 자동 출퇴근 처리
- 스캔 시점에 기존 유효 QR 전량 무효화 (재사용 공격 방지)

### 6. 급여 자동 계산
- 출퇴근 기록 + 고정 스케줄 + 대타 정보를 합산하여 월급 자동 계산
- 주 단위 초과근무 판정, 야간 수당 자동 적용
- 관리자 웹에서 직원별 급여 명세 조회

### 7. 대타 모집 시스템
- 직원이 대타 모집 글 등록 → 다른 직원 지원 → 관리자 승인
- 승인 시 LINE Messaging으로 관련자 전원에게 즉시 Push 알림 발송

### 8. 문서 OCR
- 보건증 / 근로계약서 / 신분증 / 통장사본 업로드 시 Naver CLOVA OCR 자동 호출
- 성명, 발급일, 만료일, 증번호, 계약 시작일, 계좌번호 자동 추출
- OCR 미설정 환경에서는 Fallback OCR로 안전하게 처리 (수동 확인 안내)

### 9. LINE 소셜 로그인 & 알림
- LINE Login OAuth2로 소셜 회원가입/로그인
- LINE Messaging API로 대타 승인·거절, 스케줄 변경 등 실시간 Push 알림

### 10. 사업자등록번호 실시간 검증
- 관리자(사장님) 회원가입 시 **공공데이터포털 국세청 API** 실시간 호출
- 계속사업자 / 휴업 / 폐업 / 미등록 상태 분기 처리

### 11. 게시판 & 다국어 지원
- 카테고리별 게시판, 댓글, 파일 첨부, Supabase Storage 연동
- 한국어 / 일본어 / 영어 전환 (i18n)

---

## 📁 프로젝트 구조

```
calpeace/
├── backend/          # Spring Boot REST API 서버
│   └── src/main/java/com/dm/backend/
│       ├── controller/   # 24개 REST 컨트롤러
│       ├── service/      # 25개 비즈니스 서비스
│       ├── mapper/       # 17개 MyBatis 매퍼
│       └── vo/           # Value Object (DTO)
├── frontend/         # React + Vite 웹 어드민
│   └── src/app/
│       ├── pages/admin/      # 15개 어드민 페이지
│       ├── pages/auth/       # 로그인 / 회원가입
│       └── components/       # 공통 UI 컴포넌트
├── native/           # React Native Expo 모바일 앱
│   └── src/
│       ├── screens/  # auth / admin / main / schedule / board / mypage
│       └── contexts/ # App / Theme / Language / Board / Schedule / Notification
└── opencv/           # FastAPI AI 서버
    └── app/
        ├── api/      # 6개 라우터 (camera / inference / ai_insight / schedule / ocr / health)
        ├── services/ # YOLO 추론, LLM 클라이언트, Spring 전송, 스케줄 생성, OCR
        └── schemas/  # Pydantic 스키마
```

---

## 🔑 기술적 도전 & 해결 방법

### ① YOLO 추론과 프레임 샘플링의 분리
**문제**: 고해상도 영상에서 YOLO 추론 속도가 프레임 캡처 속도보다 느려 프레임 유실 발생
**해결**: 샘플링 스레드 / 추론 Worker Pool / Spring 전송 스레드를 완전 분리
→ 추론이 지연되어도 샘플링 타이밍이 밀리지 않으며, 전송 실패 시 JSON Lines 로그에 기록 후 재시도

### ② LLM Provider 교체 가능한 설계
**문제**: OpenAI 비용 또는 정책 변경에 유연하게 대응 필요
**해결**: `LLM_PROVIDER=openai|gemini` 환경 변수 하나로 OpenAI ↔ Google Gemini를 런타임 교체
→ 스케줄 설명 생성, AI 인사이트 생성 모두 동일 인터페이스 사용

### ③ QR 토큰 보안 (30초 만료)
**문제**: 캡처된 QR 이미지 재사용 공격 방지
**해결**: 서버 측 UUID 토큰 발급 + DB 만료시간(30초) 관리, 스캔 즉시 무효화
→ 유효 QR 생성 시 해당 매장 기존 QR 전량 무효화

### ④ AI 스케줄 생성의 규칙 기반 안전망
**문제**: LLM 오류 또는 미설정 시 스케줄 생성 중단
**해결**: 규칙 기반 로직(Python)으로 항상 유효한 스케줄을 생성 후 LLM은 설명 문구(reason)만 보강
→ LLM 비활성화 시에도 Fallback 설명 자동 생성

### ⑤ Oracle Cloud ATP 연결 안정성
**문제**: TCPS(TLS) 연결 + Wallet 인증서 + 커넥션 풀 튜닝이 복잡
**해결**: HikariCP 세부 설정(keepAlive, validation-timeout, ReadTimeout 등) 최적화
→ 장시간 유휴 후 재연결, 네트워크 지연 상황에서도 안정적 운용

---

## 🔗 연동 외부 서비스

| 서비스 | 용도 |
|--------|------|
| Oracle Cloud ATP | 메인 RDBMS (TLS 보안 연결) |
| Redis | QR 세션 / 임시 캐시 |
| Supabase Storage | 이미지·문서 파일 저장 |
| LINE Messaging API | 직원 Push 알림 (대타·스케줄·근태) |
| LINE Login OAuth2 | 소셜 로그인 |
| Naver CLOVA OCR | 문서 자동 인식 |
| OpenAI GPT | AI 인사이트 / 스케줄 설명 생성 |
| Google Gemini API | OpenAI 대체 LLM |
| 공공데이터포털 (국세청) | 사업자등록번호 실시간 검증 |
| Google Translate API | 다국어 번역 보조 |
| Ultralytics YOLO | 영상 내 인원 감지 |

---

## 💡 나의 기여 (역할)

> *(이 항목은 본인 기여도에 맞게 수정하세요)*

- **백엔드**: Spring Boot API 설계 및 구현 (스케줄, 급여, 대타, QR 출퇴근, 사용자 인증)
- **AI 서버**: FastAPI 서버 설계, YOLO 비전 파이프라인 구현, LLM 연동 (OpenAI/Gemini)
- **프론트엔드**: React 어드민 대시보드 UI 구현, AI 인사이트 시각화
- **모바일**: React Native 앱 화면 구현, QR 출퇴근 기능
- **인프라**: Oracle Cloud ATP 연결 설정, Supabase Storage 연동

---

## 🚀 실행 방법

### Backend
```bash
cd backend
./gradlew bootRun
```

### AI Server
```bash
cd opencv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# Swagger: http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Mobile App
```bash
cd native
npm install
npx expo start
```

---

*© 2026 Team CAL — ShiftOps*
