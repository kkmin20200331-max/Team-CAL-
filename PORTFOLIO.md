# 바이트메이트 / ShiftOps

소규모 매장을 위한 통합 인력·운영 관리 플랫폼

> 팀 프로젝트 | Full Stack + AI + Mobile + Docker Infra  
> 기간: 2026년  
> 팀: Team CAL  
> 운영 도메인: `https://www.bitemate.kro.kr`

---

## 1. 프로젝트 개요

바이트메이트는 카페, 음식점, 편의점처럼 인력 운영이 잦은 소규모 매장을 위한
통합 관리 서비스입니다.

점주는 웹 어드민에서 근무표, 출퇴근, 급여, 대타 모집, 문서, CCTV 고객 분석을
관리하고, 직원은 모바일 앱에서 QR 출퇴근, 근무표 확인, 휴무 신청, 알림 확인을
할 수 있습니다.

이 프로젝트는 단순 CRUD 서비스가 아니라, 실제 매장 운영에서 발생하는 다음
문제를 하나의 흐름으로 연결하는 것을 목표로 했습니다.

- 직원 근무표 작성과 변경이 번거로움
- 출퇴근 기록과 급여 계산이 수기로 관리됨
- 대타 모집과 승인 과정이 흩어져 있음
- 보건증, 계약서 같은 문서 만료 관리가 어려움
- CCTV 고객 흐름을 운영 의사결정에 활용하지 못함
- 웹, 모바일, AI 서버, 배포 환경이 함께 필요한 복합 서비스 구조

---

## 2. 주요 기능

| 영역 | 기능 |
| --- | --- |
| 근무표 관리 | 월간/주간/일간 근무표, 고정 근무 자동 반영, AI 스케줄 생성 |
| 근태 관리 | QR 출근/퇴근, 지각/결근/퇴근 상태 확인 |
| 급여 관리 | 출퇴근 기록 기반 급여 계산, 야간/초과 근무 반영 |
| 대타 모집 | 직원 대타 모집, 지원, 관리자 승인 |
| 문서 관리 | 보건증/근로계약서 등 업로드, OCR 추출, 만료 관리 |
| AI 고객 분석 | CCTV/웹캠 프레임 기반 고객 수 분석, 시간대별 혼잡도 |
| 알림 | LINE Login 계정 연동, LINE Messaging push 알림 |
| 모바일 앱 | 직원용 Expo 앱, QR 스캔, 근무표/게시판/알림 |

---

## 3. 시스템 아키텍처

```txt
사용자 브라우저 / 모바일 앱
  -> https://www.bitemate.kro.kr
  -> Nginx Reverse Proxy
      -> frontend Docker container :3000
      -> /api/* -> backend Docker container :8080

backend Docker container
  -> Oracle Cloud DB
  -> Supabase Storage
  -> LINE Messaging / LINE Login
  -> 공공데이터포털 / Google Translate
  -> OpenCV Docker container http://opencv:8000

opencv Docker container
  -> FastAPI
  -> OpenCV + YOLO
  -> AI 인사이트 / OCR / 이미지 추론
```

외부에는 80/443만 열고, Spring Boot 8080과 OpenCV 8000은 VM 내부 또는 Docker
네트워크에서만 접근하도록 구성했습니다.

---

## 4. 기술 스택

### Backend

| 분류 | 기술 |
| --- | --- |
| 언어/프레임워크 | Java 17, Spring Boot 3.5 |
| DB 접근 | MyBatis, HikariCP |
| DB | Oracle Cloud ATP |
| 파일 | Supabase Storage |
| 외부 연동 | LINE Messaging API, LINE Login OAuth2, 공공데이터포털, Google Translate |
| 빌드/배포 | Gradle, Docker |

### Frontend

| 분류 | 기술 |
| --- | --- |
| 언어/프레임워크 | TypeScript, React, Vite |
| 라우팅/상태 | React Router, React Hook Form |
| UI | shadcn/ui, Radix UI, MUI, Tailwind CSS |
| 차트 | Recharts |
| 배포 | Docker + Nginx |

### Mobile

| 분류 | 기술 |
| --- | --- |
| 언어/프레임워크 | TypeScript, React Native, Expo |
| 네비게이션 | React Navigation |
| 상태관리 | Zustand |
| 기능 | expo-camera, expo-notifications |

### AI / OpenCV

| 분류 | 기술 |
| --- | --- |
| 서버 | Python, FastAPI, Uvicorn |
| 비전 | OpenCV, Ultralytics YOLO |
| LLM | OpenAI / Gemini provider 전환 구조 |
| OCR | Naver CLOVA OCR |
| 배포 | Docker, OpenCV base image |

### Infra

| 분류 | 기술 |
| --- | --- |
| 서버 | Azure VM |
| Reverse Proxy | Nginx |
| 컨테이너 | Docker Compose |
| 이미지 저장소 | Docker Hub |
| CI | GitHub Actions |
| TLS | acme.sh + Nginx SSL |

---

## 5. 핵심 구현 내용

### 5.1 QR 출퇴근

관리자는 30초 유효 QR을 발급하고, 직원은 모바일 앱으로 QR을 스캔합니다.

동작 규칙:

1. 하루 첫 번째 스캔은 출근
2. 같은 날 두 번째 스캔은 퇴근
3. 같은 날 세 번째 이후 스캔은 퇴근 시간 갱신
4. 다음 날에는 다시 출근부터 시작

QR은 짧은 만료 시간을 두고, 새 QR 발급 시 기존 QR을 무효화하여 캡처 이미지
재사용 위험을 줄였습니다.

### 5.2 고정 근무와 월별 근무표

직원이 매주 같은 요일과 시간에 근무하는 경우, 고정 근무를 등록하면 다음 달,
다다음 달 근무표 조회 시에도 자동으로 반영되도록 구성했습니다.

근무표 조회 시점에 해당 기간의 고정 근무를 확인하고, 아직 생성되지 않은
근무 데이터를 자동 materialize하는 방식입니다.

### 5.3 AI 스케줄 생성

AI 스케줄 생성은 단순 LLM 요청이 아니라, 실제 운영 데이터 기반 규칙 로직을
먼저 사용합니다.

입력 데이터:

- 매장 운영 시간
- 직원 목록과 가용 요일
- 고정 근무
- 기존 근무표
- 승인된 휴무 신청
- `people_log` 고객 수 데이터

처리 흐름:

```txt
시간대별 예상 고객 수 계산
  -> 필요 인원 산출
  -> 근무 가능한 직원 후보 필터링
  -> 기존 근무/휴무 충돌 제외
  -> 신입 단독 근무 방지
  -> 마감 가능 직원 우선 배치
  -> 인접 시간대 병합
  -> LLM 또는 fallback으로 배정 사유 생성
```

LLM이 실패해도 스케줄 자체는 규칙 기반으로 생성되고, 설명 문구만 fallback으로
대체됩니다.

### 5.4 OpenCV 고객 수 분석

OpenCV/FastAPI 서버는 이미지 또는 영상 프레임에서 사람 수를 추론합니다.

지원 방식:

- 영상 파일 분석
- RTSP/웹캠 스트림 분석
- 브라우저 웹캠 프레임 업로드 분석

배포 환경에서는 Azure VM이 사용자의 로컬 웹캠을 직접 열 수 없기 때문에,
브라우저가 `getUserMedia`로 웹캠 프레임을 캡처하고 서버로 업로드하는 방식을
도입했습니다.

```txt
브라우저 웹캠
  -> 3~5초마다 JPEG 프레임 캡처
  -> POST /api/cctv/frame
  -> Spring Boot가 OpenCV /api/v1/inference/image 호출
  -> Spring Boot가 PEOPLE_LOG 저장
```

이 구조는 별도 설치형 에이전트 없이 웹페이지에서 바로 CCTV 분석을 시연할 수
있다는 장점이 있습니다.

### 5.5 AI 고객 분석

`people_log`, 근무표, 외부 요인을 조합해 시간대별 혼잡도와 인력 배치 추천을
표시합니다.

현재 실제 데이터로 판단 가능한 항목:

- 시간대별 고객 수
- 피크 시간
- 직원 1명당 고객 수
- 현재/추천 배치 인원
- 대기 위험도

고객 연령대, 메뉴 선호도, 프로모션 추천처럼 POS/회원 통계가 필요한 문구는
실제 데이터 연결 여부를 확인해야 하며, 데이터가 없으면 fallback 또는 샘플
문구로 분리해야 합니다.

### 5.6 LINE 계정 연동과 알림

단순 LINE 친구 추가 URL이 아니라 LINE Login OAuth2 callback 방식으로 사용자
계정과 LINE userId를 매핑합니다.

```txt
LINE 연동 버튼
  -> /api/line/login
  -> LINE Login
  -> /api/line/callback
  -> LINE profile 조회
  -> USER_LINE 저장
```

휴무 신청, 대타 승인, 스케줄 변경 등의 이벤트에서 LINE push 알림을 보낼 수
있도록 구성했습니다.

---

## 6. Docker 인프라와 배포 구조

초기에는 VM에서 서비스를 직접 실행했습니다.

```txt
Backend: ./gradlew bootRun
Frontend: npm run build 후 /var/www 복사
OpenCV: uvicorn 백그라운드 실행
```

이 방식은 빠른 시연에는 편했지만, 운영에서는 다음 문제가 있었습니다.

- 서버 재시작 시 프로세스 복구가 번거로움
- 배포된 코드 버전 추적이 어려움
- 프론트/백엔드/OpenCV 배포 방식이 제각각
- OpenCV Python 의존성이 무거워 VM 환경이 쉽게 꼬임
- Docker 내부에서 `localhost` 주소 혼동 발생

이를 해결하기 위해 Docker Compose 기반 구조로 전환했습니다.

```txt
Nginx
  -> frontend container
  -> backend container

backend container
  -> opencv container
  -> Oracle Cloud DB
```

백엔드에서 OpenCV를 호출할 때는 `127.0.0.1:8000`이 아니라 Compose 서비스명인
`http://opencv:8000`을 사용합니다.

---

## 7. CI/CD 자동화

GitHub Actions workflow를 서비스별로 분리했습니다.

| Workflow | 역할 |
| --- | --- |
| Backend Docker | 백엔드 이미지 빌드/푸시 |
| Frontend Docker | 프론트엔드 이미지 빌드/푸시 |
| OpenCV Docker | OpenCV 이미지 빌드/푸시 |
| Native CI | Expo 앱 타입 체크 |

이미지 태그는 Git SHA 기반으로 생성합니다.

```env
BACKEND_IMAGE_TAG=sha-xxxxxxx
FRONTEND_IMAGE_TAG=sha-xxxxxxx
OPENCV_IMAGE_TAG=sha-xxxxxxx
```

`dev` 또는 `main` 브랜치에 push되면 GitHub Actions가 Docker Hub에 이미지를
푸시하고, VM의 `.env` 태그를 자동 갱신합니다.

실제 운영 반영은 VM에서 수동으로 실행합니다.

```bash
docker compose pull
docker compose up -d
```

태그 갱신과 컨테이너 재시작을 분리해 운영자가 배포 시점을 통제할 수 있게
했습니다.

---

## 8. OpenCV 이미지 최적화

OpenCV 이미지는 Torch, Ultralytics, OpenCV, numpy 등 무거운 의존성이 있어
GitHub Actions에서 매번 설치하면 빌드 시간이 길어집니다.

그래서 자주 바뀌지 않는 런타임 의존성을 base image로 분리했습니다.

```txt
kkmin1106/bitemateopencv-base:py312-yolo
```

OpenCV 앱 이미지는 이 base image 위에 애플리케이션 코드만 복사합니다.

```dockerfile
FROM kkmin1106/bitemateopencv-base:py312-yolo
WORKDIR /app
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

효과:

- 일반 코드 변경 시 OpenCV 앱 이미지 빌드가 빨라짐
- VM마다 Python 환경을 수동으로 맞출 필요가 줄어듦
- `libxcb.so.1` 같은 OpenCV 런타임 라이브러리 문제를 이미지 레벨에서 해결

---

## 9. 문제 해결 경험

### 9.1 HTTPS 로그인 403 / CORS 문제

운영 도메인에서 로그인 요청이 `Invalid CORS request` 또는 403으로 실패했습니다.

해결:

- Spring CORS 허용 origin에 `https://www.bitemate.kro.kr` 추가
- Nginx `/api/` proxy header 정리
- 프론트 운영 빌드의 API base URL을 `/api`로 통일

### 9.2 OpenCV Docker 네트워크 문제

백엔드 컨테이너에서 OpenCV를 `127.0.0.1:8000`으로 호출해 connection refused가
발생했습니다.

해결:

```env
FASTAPI_BASE_URL=http://opencv:8000
```

Docker Compose 내부 서비스명으로 통신하도록 변경했습니다.

### 9.3 OpenCV 런타임 라이브러리 문제

컨테이너에서 `cv2` import 시 아래 오류가 발생했습니다.

```txt
ImportError: libxcb.so.1: cannot open shared object file
```

해결:

- OpenCV base image에 필요한 apt runtime library 추가
- `opencv-python-headless`, numpy, ultralytics 의존성 정리

### 9.4 VM 디스크 부족

OpenCV/Torch 이미지 pull 중 VM에서 용량 부족이 발생했습니다.

```txt
no space left on device
```

해결:

- `docker system prune`
- `docker builder prune`
- `/var/lib/docker`, `/var/lib/containerd`, `/home/dongmin` 사용량 점검
- OpenCV base image 도입으로 반복 빌드 부담 완화
- VM 디스크 128GB 이상 증설 권장 기준 정리

### 9.5 AI 스케줄 생성 timeout

AI 스케줄 생성은 10초 이상 걸릴 수 있는데, 프론트 공통 axios timeout이 10초라
요청이 중간에 끊겼습니다.

해결:

- 전체 API timeout은 유지
- `/shift/ai-preview` 요청만 60초 timeout 적용

---

## 10. 프로젝트 구조

```txt
Team-CAL-/
├── backend/      # Spring Boot REST API
├── frontend/     # React + Vite 웹 어드민
├── native/       # React Native Expo 직원 앱
├── opencv/       # FastAPI + OpenCV + YOLO AI 서버
├── opencvbase/   # OpenCV Docker base image
├── docs/         # 운영/배포/문제 해결 문서
└── .github/
    └── workflows/ # 서비스별 GitHub Actions
```

---

## 11. 나의 기여

포트폴리오 작성 시 본인 역할에 맞게 아래 항목을 조정합니다.

- Spring Boot API 설계 및 구현
- QR 출퇴근 로직과 근태 관리 흐름 구현
- 고정 근무 자동 반영과 AI 스케줄 생성 로직 구현
- React 관리자 화면과 AI 고객 분석 화면 구현
- OpenCV/FastAPI 분석 서버 연동
- 브라우저 웹캠 프레임 업로드 기반 CCTV 분석 구조 설계
- LINE Login 계정 연동과 알림 흐름 구현
- Azure VM, Nginx, Docker Compose 배포 구조 정리
- GitHub Actions 기반 Docker 이미지 빌드/푸시 자동화
- OpenCV base image 분리로 빌드 최적화
- 운영 중 발생한 CORS, HTTPS, Docker 네트워크, 디스크 부족 문제 해결

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

## 13. 포트폴리오 어필 포인트

- 웹, 모바일, 백엔드, AI 서버를 모두 포함한 실서비스형 팀 프로젝트
- QR 출퇴근, 급여, 대타, 문서, 알림까지 매장 운영 흐름을 하나로 연결
- CCTV/웹캠 데이터를 `people_log`로 저장해 운영 데이터로 활용
- AI 스케줄 생성에서 LLM 의존도를 낮추고 규칙 기반 안전망을 둠
- Docker Compose, Nginx, GitHub Actions, Docker Hub까지 실제 배포 구조 구성
- OpenCV처럼 무거운 AI 런타임을 base image로 분리해 빌드 최적화
- 운영 중 발생한 네트워크, CORS, HTTPS, 디스크 부족 문제를 직접 해결하고 문서화

---

© 2026 Team CAL
