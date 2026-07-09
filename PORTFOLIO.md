# 바이트메이트 / Team-CAL Portfolio

소규모 매장 운영을 위한 통합 인력·근태·급여·문서·AI 분석 관리 서비스입니다.

> Full Stack + AI + Mobile + Docker Infra  
> Team CAL, 2026  
> 운영 도메인: `https://www.bitemate.kro.kr`

---

## 1. 프로젝트 개요

바이트메이트는 카페, 음식점, 매장 운영자가 직원 근무표, 출퇴근, 급여, 대타 모집, 문서, 게시판, 고객 행동 분석을 한 흐름에서 관리할 수 있도록 만든 서비스입니다.

관리자는 웹에서 매장 운영 데이터를 관리하고, 직원은 모바일/웹에서 근무표 확인, QR 출퇴근, 대타 신청, 게시판 확인, 급여 확인을 수행합니다.

프로젝트의 목표는 단순 CRUD가 아니라 실제 매장 운영 중 반복적으로 생기는 문제를 하나의 운영 도구로 연결하는 것입니다.

- 근무표 작성과 고정 근무 반영
- QR 기반 출퇴근 기록
- 출퇴근 기반 급여 계산
- 직원 대타 모집과 관리자 승인
- 보건증/계약서 등 문서 만료 관리
- LINE 계정 연동과 push 알림
- OpenCV 기반 고객 행동 분석
- Docker Compose 기반 운영 배포

---

## 2. 주요 기능

| 영역 | 기능 |
| --- | --- |
| 근무표 관리 | 월간/주간/일간 근무표, 고정 근무 자동 반영, AI 스케줄 생성 |
| 근태 관리 | QR 출근/퇴근, 지각/결근/퇴근 상태 확인 |
| 급여 관리 | 근무 기록 기반 급여 계산, 주급 신청 알림 |
| 대타 모집 | 직원 대타 신청, 관리자 승인/거절 |
| 문서 관리 | 보건증/근로계약서 업로드, OCR 추출, 만료 관리 |
| 게시판 | 관리자/직원 공지 및 댓글 |
| 고객 분석 | OpenCV/YOLO 기반 고객 수 분석, 시간대별 혼잡도 |
| 알림 | LINE Login 연동, LINE Messaging push |
| 모바일 | Expo 기반 직원 앱, QR 스캔, 근무/알림 확인 |

---

## 3. 시스템 구조

```txt
Browser / Mobile
  -> https://www.bitemate.kro.kr
  -> Nginx Reverse Proxy
      -> frontend Docker container :3000
      -> /api/* -> backend Docker container :8080

backend Docker container
  -> Oracle Cloud ATP
  -> Supabase Storage
  -> LINE Messaging / LINE Login
  -> Public Data / Google Translate
  -> OpenCV Docker container http://opencv:8000

opencv Docker container
  -> FastAPI
  -> OpenCV + YOLO
  -> OCR / image inference
```

운영 환경에서는 외부에 80/443만 열고, Spring Boot 8080과 OpenCV 8000은 Docker 네트워크 내부에서 통신하도록 구성했습니다.

---

## 4. 기술 스택

### Backend

| 분류 | 기술 |
| --- | --- |
| Language/Framework | Java 17, Spring Boot 3.5 |
| DB Access | MyBatis, HikariCP |
| Database | Oracle Cloud ATP |
| File/Storage | Supabase Storage |
| External API | LINE Messaging API, LINE Login OAuth2, Google Translate, 공공데이터 |
| Build/Deploy | Gradle, Docker |

### Frontend

| 분류 | 기술 |
| --- | --- |
| Language/Framework | TypeScript, React, Vite |
| Routing/State | React Router, React Hook Form |
| UI | shadcn/ui, Radix UI, MUI, Tailwind CSS |
| Chart | Recharts |
| Deploy | Docker + Nginx |

### Mobile

| 분류 | 기술 |
| --- | --- |
| Language/Framework | TypeScript, React Native, Expo |
| Navigation | React Navigation |
| State | Zustand |
| Native 기능 | expo-camera, expo-notifications |

### AI / OpenCV

| 분류 | 기술 |
| --- | --- |
| Server | Python, FastAPI, Uvicorn |
| Vision | OpenCV, Ultralytics YOLO |
| OCR | Naver CLOVA OCR |
| Deploy | Docker, OpenCV base image |

### Infra

| 분류 | 기술 |
| --- | --- |
| Server | Azure VM |
| Reverse Proxy | Nginx |
| Container | Docker Compose |
| Registry | Docker Hub |
| CI/CD | GitHub Actions |
| TLS | acme.sh + Nginx SSL |

---

## 5. 구현 포인트

### 5.1 QR 출퇴근

관리자가 발급한 QR을 직원이 스캔하면 하루 첫 스캔은 출근, 이후 스캔은 퇴근 또는 퇴근 시간 갱신으로 처리합니다. QR에는 만료 시간이 있으며, 새 QR 발급 시 기존 QR을 무효화해 캡처 재사용 위험을 줄였습니다.

### 5.2 고정 근무와 근무표

직원이 매주 같은 요일/시간에 근무하는 경우 고정 근무를 등록하고, 근무표 조회 시 해당 기간에 자동 반영되도록 구성했습니다.

### 5.3 AI 스케줄 생성

AI 스케줄 생성은 LLM만 호출하지 않고 운영 데이터를 기반으로 먼저 규칙 기반 후보를 만듭니다.

```txt
매장 운영 시간
  -> 직원 가능 요일/시간
  -> 고정 근무/휴무/대타 충돌 제외
  -> 예상 고객 수 기반 필요 인원 산정
  -> 배정 후보 생성
  -> LLM 또는 fallback 설명 생성
```

LLM이 실패해도 스케줄 자체는 규칙 기반으로 생성되도록 설계했습니다.

### 5.4 OpenCV 고객 분석

OpenCV/FastAPI 서버가 이미지 또는 영상 프레임에서 사람 수를 추론하고, backend가 결과를 `people_log`에 저장합니다.

```txt
Browser webcam frame
  -> POST /api/cctv/frame
  -> Spring Boot
  -> OpenCV /api/v1/inference/image
  -> PEOPLE_LOG 저장
```

Azure VM 운영 환경에서는 서버가 사용자의 로컬 웹캠에 직접 접근할 수 없기 때문에 브라우저가 `getUserMedia`로 프레임을 캡처해 서버로 업로드하는 구조를 사용했습니다.

### 5.5 LINE 계정 연동과 알림

LINE Login OAuth2 callback으로 서비스 사용자와 LINE userId를 매핑하고, 대타 신청, 근무 요청, 주급 신청 같은 이벤트에서 LINE push 알림을 보낼 수 있도록 구성했습니다.

```txt
LINE 연동 버튼
  -> /api/line/login
  -> LINE Login
  -> /api/line/callback
  -> LINE profile 조회
  -> USER_LINE 저장
```

### 5.6 급여와 주급 신청

급여 화면은 출퇴근/근무표 데이터를 기반으로 월 급여를 계산합니다. 주급 신청 카드의 이번 주 예상 급여는 화면에서 임시 계산하지 않고 `/payroll`을 주간 범위로 호출해 backend 계산 결과를 사용하도록 정리했습니다.

```txt
GET  /api/payroll
POST /api/payroll/weekly-request
```

---

## 6. 운영 배포 구조

초기에는 VM에서 backend, frontend, OpenCV를 각각 직접 실행했지만 운영 안정성을 위해 Docker Compose 구조로 전환했습니다.

```txt
Nginx
  -> frontend container
  -> backend container

backend container
  -> opencv container
  -> Oracle Cloud DB
```

backend가 OpenCV를 호출할 때는 `127.0.0.1:8000`이 아니라 Compose 서비스명인 `http://opencv:8000`을 사용합니다.

---

## 7. CI/CD

GitHub Actions workflow를 서비스별로 분리했습니다.

| Workflow | 역할 |
| --- | --- |
| Backend Docker | backend image build/push |
| Frontend Docker | frontend image build/push |
| OpenCV Docker | OpenCV image build/push |
| Native CI | Expo/TypeScript 검증 |

Docker image tag는 Git SHA 기반으로 추적합니다.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx
```

운영 VM에서는 최종 반영 시 아래 명령으로 컨테이너를 갱신합니다.

```bash
docker compose pull
docker compose up -d
docker ps
```

---

## 8. 최근 품질 정리

프론트엔드에서 실제 운영 중 불필요하거나 불안정했던 기능을 정리했습니다.

- 관리자 게시판 첨부파일 업로드 제거
- 관리자 게시판 임시저장 제거
- 고객 행동 분석의 미사용 리포트 버튼 제거
- 문서관리의 일괄 OCR 버튼 제거
- 보건증/문서관리 페이지의 좁은 화면 overflow 정리
- 직원 게시판 Supabase 환경 변수 누락 시 React 중단 방지
- 주급 신청 카드의 예상 금액을 backend `/payroll` 계산 결과 기준으로 정리

검증:

```bash
cd frontend
npm.cmd run build
```

---

## 9. 운영 중 해결한 문제

### 9.1 OpenCV Docker 네트워크

backend 컨테이너에서 OpenCV를 `127.0.0.1:8000`으로 호출하면 backend 자기 자신을 바라보므로 실패했습니다.

해결:

```env
FASTAPI_BASE_URL=http://opencv:8000
```

### 9.2 Supabase Storage RLS

게시판 파일 첨부에서 Supabase Storage 직접 업로드 시 RLS 오류가 발생했습니다.

```txt
new row violates row-level security policy
```

관리자 게시판 첨부파일은 미사용 기능으로 판단해 제거했습니다. 직원 게시판은 환경 변수가 없을 때 React가 죽지 않도록 안전 처리했습니다.

### 9.3 GitHub PR 충돌

GitHub 웹에서 `Resolve conflicts` 버튼이 비활성화되는 경우, 로컬에서 command line으로 해결해야 합니다.

```bash
git fetch origin
git checkout yuni
git merge origin/dev
rg -n "<<<<<<<|=======|>>>>>>>" frontend
cd frontend
npm.cmd run build
```

주요 충돌 파일:

```txt
frontend/dist/index.html
frontend/src/app/pages/admin/BoardManagement.tsx
frontend/src/app/pages/employee/EmployeeBoard.tsx
frontend/src/app/pages/employee/EmployeePayroll.tsx
```

### 9.4 VM 디스크 부족

OpenCV/Torch 계열 Docker image는 용량이 크기 때문에 VM에서 `no space left on device`가 발생할 수 있습니다.

```bash
df -h
docker system df
docker system prune -af
docker builder prune -af
```

OpenCV base image를 분리해 반복 빌드 비용을 줄였습니다.

---

## 10. 프로젝트 구조

```txt
Team-CAL-/
├─ backend/      # Spring Boot REST API
├─ frontend/     # React + Vite admin/employee web
├─ native/       # React Native Expo employee app
├─ opencv/       # FastAPI + OpenCV + YOLO AI server
├─ opencvbase/   # OpenCV Docker base image
├─ docs/         # 운영/배포/문제 해결 문서
└─ .github/
   └─ workflows/ # service별 GitHub Actions
```

---

## 11. 기여 역할

- Spring Boot API 설계 및 구현
- QR 출퇴근 및 근태 관리 흐름 구현
- 급여 계산 및 주급 신청 알림 흐름 정리
- 관리자/직원 React 화면 구현 및 운영 중 UI 오류 수정
- 문서관리/OCR/OpenCV 서버 연동
- LINE Login 및 push 알림 흐름 구현
- Azure VM, Nginx, Docker Compose 배포 구조 정리
- GitHub Actions 기반 Docker image build/push 자동화
- OpenCV base image 분리로 빌드 최적화
- CORS, HTTPS, Docker 네트워크, VM 디스크, PR 충돌 문제 해결

---

## 12. 실행 방법

### Backend

```bash
cd backend
./gradlew bootRun
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### OpenCV

```bash
cd opencv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Native

```bash
cd native
npm install
npx expo start
```

### Production Docker

```bash
docker compose pull
docker compose up -d
docker ps
```

---

## 13. 포트폴리오 포인트

- 웹, 모바일, backend, AI 서버, Docker 인프라를 모두 포함한 통합 서비스
- 실제 매장 운영 흐름인 근무표, 출퇴근, 급여, 대타, 문서, 알림을 하나의 제품으로 연결
- OpenCV 분석 결과를 운영 데이터인 `people_log`로 저장해 혼잡도/인력 배치 판단에 활용
- LLM 실패에도 규칙 기반 fallback이 작동하는 AI 스케줄 생성 구조
- Azure VM, Nginx, Docker Compose, GitHub Actions, Docker Hub 기반 운영 배포 경험
- 운영 중 발생한 CORS, Docker 네트워크, Supabase RLS, PR 충돌 문제를 직접 해결하고 문서화

---

© 2026 Team CAL
