# 현재 연동 상태

최종 갱신일: 2026-06-15

## 개요

현재 시스템은 다음 네 영역이 연결되어 동작합니다.

- React 프론트엔드: 관리자 CCTV 제어 화면, 고객 행동 분석 및 인사이트 화면
- Spring Boot 백엔드: API 프록시, Oracle 저장, people_log 조회
- FastAPI/OpenCV 서버: 웹캠/RTSP/영상 파일 분석, 집계, AI 인사이트 생성
- Oracle DB: 집계된 고객 수를 `PEOPLE_LOG` 테이블에 저장

2026-06-15 기준 추가 연동:

- 메인 대시보드 `실시간 매장 인원 추이`: `people_log`와 오늘 근무표 기반으로 연동
- 메인 대시보드 `AI 운영 추천`: 고객 수, 근무표, 출근 현황, 대타 모집, 예상 인건비를 종합해 추천
- 고객 분석 `요일별 방문 패턴`: 이번 주 `people_log`를 요일/시간대별로 집계
- 고객 분석 `AI 스케줄 추천`: Spring이 DB에서 오늘 근무표를 조회해 `staffSchedule`로 AI payload에 포함
- CCTV 화면 `실시간 카메라`: `/api/v1/camera/stream` MJPEG 스트림으로 최신 영상 프레임 표시

## CCTV 분석 시작/중지 흐름

React 화면:

- 라우트: `/admin/cctv/:branchId`
- 파일: `frontend/src/app/pages/admin/CctvAnalysis.tsx`

분석 시작 흐름:

```text
React
  POST http://localhost:8080/api/cctv/start
Spring Boot
  POST http://localhost:8000/api/v1/camera/start?...query...
FastAPI/OpenCV
  추론 루프 시작
```

분석 중지 흐름:

```text
React
  POST http://localhost:8080/api/cctv/stop
Spring Boot
  POST http://localhost:8000/api/v1/camera/stop
FastAPI/OpenCV
  추론 루프 중지
```

## camera start에서 query fallback을 쓰는 이유

FastAPI에 직접 JSON body로 요청하면 정상 동작합니다.

하지만 현재 로컬 Spring Boot 프록시 경로에서는 FastAPI가 POST body를 비어 있는 요청으로 받는 문제가 있었습니다. 이때 FastAPI는 다음 오류를 반환했습니다.

```text
body: Field required
```

그래서 안정적인 연동을 위해 FastAPI `/api/v1/camera/start`는 다음 두 방식을 모두 지원하도록 보강했습니다.

1. JSON body 방식
2. query parameter fallback 방식

현재 Spring Boot는 camera start 값을 query parameter로 전달합니다.

## 카메라 시작 요청 필드

기본 요청 값은 다음과 같습니다.

```json
{
  "storeId": 1,
  "cameraId": "CAM-001",
  "source": "0",
  "sourceType": "WEBCAM",
  "intervalSec": 5,
  "aggregationIntervalSec": 60,
  "modelName": "yolo11s",
  "imageSize": 640,
  "confidence": 0.3
}
```

입력 소스별 의미:

| sourceType | source 예시 | 의미 |
| --- | --- | --- |
| `WEBCAM` | `"0"` | 로컬 웹캠 번호 |
| `RTSP` | `"rtsp://..."` | CCTV/RTSP 스트림 |
| `VIDEO_FILE` | `"test_assets/uploads/sample.mp4"` | 로컬 영상 파일 |

## FastAPI 카메라 API

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/v1/camera/start` | 추론 루프 시작 |
| `POST` | `/api/v1/camera/stop` | 추론 루프 중지 |
| `GET` | `/api/v1/camera/status` | 현재 추론 상태 조회 |
| `GET` | `/api/v1/camera/metrics` | 처리 프레임, 최근 인원 수, 큐 상태 조회 |
| `GET` | `/api/v1/camera/stream` | 화면 표시용 MJPEG 프리뷰 스트림 |
| `GET` | `/api/v1/camera/aggregate/latest` | 가장 최근 집계 결과 조회 |

### MJPEG 프리뷰 스트림

React CCTV 화면은 분석 결과 JSON을 3초마다 받아서 이미지를 갈아끼우는 방식만으로는 영상이 끊겨 보입니다.

현재는 다음 방식으로 개선했습니다.

```text
React
  <img src="http://localhost:8000/api/v1/camera/stream?t=..." />
FastAPI/OpenCV
  multipart/x-mixed-replace MJPEG 스트림 반환
```

구조:

- YOLO 추론 루프와 화면 프리뷰 스트림을 분리
- 웹캠/RTSP는 `StreamVideoSource`가 유지하는 최신 프레임을 MJPEG로 송출
- 영상 파일은 프리뷰 전용 `VideoCapture`를 별도로 열어 연속 프레임 송출
- 분석용 샘플링은 `intervalSec` 기준으로 유지
- 화면 표시용 FPS는 `PREVIEW_STREAM_FPS`로 제어
- JPEG 품질은 `PREVIEW_JPEG_QUALITY`로 제어

기본 설정:

```env
PREVIEW_STREAM_FPS=12
PREVIEW_JPEG_QUALITY=75
INCLUDE_CAMERA_ANNOTATED_IMAGE=true
```

관련 파일:

```text
opencv/app/api/camera_router.py
opencv/app/services/inference_service.py
opencv/app/vision/sources/stream_video_source.py
opencv/app/core/config.py
frontend/src/app/pages/admin/CctvAnalysis.tsx
```

## Spring CCTV 프록시 API

| Method | Path | 대상 |
| --- | --- | --- |
| `POST` | `/api/cctv/start` | FastAPI `/api/v1/camera/start` |
| `POST` | `/api/cctv/stop` | FastAPI `/api/v1/camera/stop` |
| `GET` | `/api/cctv/status` | FastAPI `/api/v1/camera/status` |
| `GET` | `/api/cctv/metrics` | FastAPI `/api/v1/camera/metrics` |
| `GET` | `/api/cctv/aggregate/latest` | FastAPI `/api/v1/camera/aggregate/latest` |

관련 Spring 파일:

```text
backend/src/main/java/com/dm/backend/controller/CctvCameraC.java
```

## 분석 루프 정상 로그

정상 동작 시 FastAPI 로그는 다음과 비슷하게 출력됩니다.

```text
[CAMERA] sample queued: index=...
[INFERENCE] measuredAt=... count=... confidenceAvg=... processingMs=...
[AGGREGATE] measuredAt=... avg=... max=... min=... samples=... sent=True
```

각 로그의 의미:

- `sample queued`: 카메라 프레임을 샘플링해서 추론 큐에 넣음
- `INFERENCE`: YOLO person 감지가 한 프레임에 대해 완료됨
- `count`: 감지된 사람 수
- `confidenceAvg`: 감지 박스의 평균 confidence
- `processingMs`: 한 프레임 처리 시간
- `AGGREGATE`: 집계 구간이 끝나고 요약 결과 생성됨
- `sent=True`: Spring 전송 계층에서 처리 완료로 판단됨

`SEND_TO_SPRING=false`이면 다음 로그가 출력됩니다.

```text
[SPRING] skipped; SEND_TO_SPRING=false
```

이 경우 OpenCV 분석은 정상 동작하지만 Spring DB에는 저장되지 않습니다.

## Spring 저장 흐름

FastAPI는 집계 결과를 Spring으로 전송합니다.

```text
POST http://127.0.0.1:8080/api/ai/congestion
```

Spring은 받은 payload에서 인원 수를 추출해 `PEOPLE_LOG`에 저장합니다.

관련 파일:

```text
backend/src/main/java/com/dm/backend/controller/AiCongestionC.java
backend/src/main/java/com/dm/backend/controller/PeopleLogC.java
backend/src/main/java/com/dm/backend/mapper/PeopleLogMapper.java
```

people_log 조회 API:

```text
GET /people_log
GET /api/people_log
```

`/api/people_log` 매핑은 React 프론트엔드가 기존 `/api/**` CORS 정책 안에서 조회할 수 있도록 추가했습니다.

## React CCTV 제어 화면 동기화

CCTV 제어 화면은 버튼 클릭 결과만 믿지 않습니다.

다음 API를 3초마다 polling합니다.

```text
GET /api/cctv/status
GET /api/cctv/metrics
```

화면에 반영되는 값:

- 실행 중/대기 중 상태
- LIVE/STOP 배지
- REC/OFF 배지
- 최근 감지 인원
- 처리 프레임 수
- 최근 confidence
- 실시간 카메라 프리뷰
  - 실행 중이면 `/api/v1/camera/stream` MJPEG 스트림 표시
  - 중지 상태이거나 스트림이 없으면 최근 `annotatedImage` 또는 대기 메시지 표시

주의:

- 기본 설정이 `sourceType=WEBCAM`, `source=0`이면 FastAPI/OpenCV 서버가 실행되는 PC에 웹캠이 있어야 합니다.
- 웹캠이 없으면 `VIDEO_FILE`로 바꾸고 `test_assets/uploads/...mp4` 경로로 테스트합니다.
- MJPEG 스트림은 Spring 프록시를 거치지 않고 FastAPI `localhost:8000`을 직접 봅니다.

## React 고객 행동 분석 화면 동기화

React 화면:

- 라우트: `/admin/analytics/:branchId`
- 파일: `frontend/src/app/pages/admin/CustomerAnalytics.tsx`

자동 동기화 API:

```text
GET /api/people_log?store_id=...&start_date=...&end_date=...
GET /api/cctv/metrics
GET /api/cctv/aggregate/latest
```

동기화 주기:

```text
5초
```

사용 위치:

- KPI 카드
- 시간대별 방문 그래프
- 현재 진단
- fallback 인사이트
- fallback 스케줄 추천
- 요일별 방문 패턴
- AI 스케줄 추천 payload의 `staffSchedule`

### 요일별 방문 패턴

고객 분석 화면의 `요일별 방문 패턴`은 고정 더미 배열이 아니라 이번 주 `people_log`를 조회해 집계합니다.

조회 범위:

```text
이번 주 월요일 00:00:00 ~ 일요일 23:59:59
```

집계 기준:

| 차트 필드 | 시간대 |
| --- | --- |
| 오전 | 09:00 이상 11:00 미만 |
| 점심 | 11:00 이상 14:00 미만 |
| 저녁 | 18:00 이상 20:00 이하 |

관련 파일:

```text
frontend/src/app/pages/admin/CustomerAnalytics.tsx
backend/src/main/resources/sql/people_log.sql
```

`people_log.sql`에는 2026-06-15 월요일부터 2026-06-21 일요일까지의 주간 방문 패턴 샘플 `MERGE` 블록이 있습니다.

이미 `PEOPLE_LOG` 테이블이 있으면 `CREATE TABLE` 전체를 다시 실행하지 말고, 주간 샘플용 `MERGE INTO PEOPLE_LOG ... COMMIT;` 블록만 실행합니다.

### AI 스케줄 추천

고객 분석 화면의 AI 스케줄 추천은 다음 데이터를 payload에 포함합니다.

```text
cameraAggregates: 시간대별 고객 수/추천 인원/대기 지표
staffSchedule: 오늘 shift 기준 시간대별 currentStaff
historicalBaseline: 오늘 방문 수와 피크 기준값
externalFactors: CCTV/people_log 기반 출처 정보
```

`staffSchedule`은 Spring `AiInsightPayloadService`가 오늘 근무표를 조회한 뒤 시간대별 근무 인원을 계산해 만듭니다.

관련 파일:

```text
backend/src/main/java/com/dm/backend/controller/AiInsightProxyC.java
backend/src/main/java/com/dm/backend/service/AiInsightPayloadService.java
backend/src/main/java/com/dm/backend/vo/AiInsightAnalyzeRequestVO.java
backend/src/main/resources/sql/shift.sql
```

`shift.sql`에는 2026-06-15부터 2026-06-21까지 AI 스케줄 추천용 주간 근무표 샘플 `MERGE` 블록이 있습니다.

이미 `SHIFT` 테이블이 있으면 `CREATE TABLE` 전체를 다시 실행하지 말고, AI schedule recommendation sample shifts `MERGE INTO shift ... COMMIT;` 블록만 실행합니다.

## React 메인 대시보드 연동

React 화면:

- 라우트: `/admin/dashboard/:branchId`
- 파일: `frontend/src/app/pages/admin/AdminDashboard.tsx`

### 실시간 매장 인원 추이

메인 대시보드의 `실시간 매장 인원 추이`는 샘플 고정값이 아니라 다음 데이터를 조합합니다.

```text
GET /api/people_log?store_id=...&start_date=...&end_date=...
GET /api/shift?store_id=...&start_date=...&end_date=...
```

동작:

- 09:00~20:00 시간 축 생성
- `people_log`에서 시간대별 최신 고객 수 추출
- 오늘 근무표에서 해당 시간대에 겹치는 근무자 수 계산
- 5초마다 고객 수/근무 인원 차트 갱신

### AI 운영 추천

메인 대시보드의 `AI 운영 추천`은 고객 분석 테이블만 보는 화면이 아닙니다.

종합하는 데이터:

- `people_log`: 시간대별 고객 수
- `shift`: 시간대별 근무 인원
- 오늘 근무자 수
- 출근 완료 수
- 등록 직원 수
- 대타 모집 중 건수
- 오늘 예상 인건비

추천 카드:

| 카드 | 판단 기준 |
| --- | --- |
| 인력 배치 추천 | 피크 고객 수, 평균 대비 증가율, 시간대별 근무 인원, 출근 완료 수 |
| 피크 운영 액션 | 피크 시간대 직원 1명당 고객 수, 주문/응대 부하 |
| 유휴 시간 업무 | 저혼잡 시간대, 예상 인건비, 대타 모집 현황 |

연령대/POS 데이터는 현재 DB에 없으므로 `20대 고객 방문 비율` 같은 문구는 사용하지 않습니다.

대신 현재 DB에서 확인 가능한 운영 데이터만 기반으로 다음처럼 추천합니다.

```text
피크 시간대에는 주문/응대 동선을 단순화하고,
피크 전 재고 보충과 포장 준비를 먼저 배정한다.

저혼잡 시간대에는 재고 정리와 청소 체크리스트를 배정한다.
```

FastAPI AI 분석 API도 호출하지만, 메인 대시보드는 화면 성격에 맞게 메뉴/POS 추천보다 운영 액션 중심 fallback 문구를 우선 사용합니다.

## OpenAI / LLM 인사이트 흐름

고객 행동 분석 화면에는 두 가지 갱신 흐름이 있습니다.

1. 자동 5초 동기화
   - 운영 데이터만 조회합니다.
   - OpenAI API를 호출하지 않습니다.

2. 수동 `새로고침` 버튼
   - 최신 운영 데이터를 다시 조회합니다.
   - Spring에 `store_id`, `shift_store_id`, 조회 기간만 전달합니다.
   - Spring이 DB를 조회해 `AiInsightAnalyzeRequest` 형태의 payload를 만듭니다.
   - Spring이 FastAPI LLM 인사이트 API를 호출합니다.

수동 새로고침 흐름:

```text
React
  POST http://localhost:8080/api/ai-insights/analyze/llm
Spring Boot
  store, people_log, shift, store_member 조회
  AiInsightAnalyzeRequest payload 생성
  POST http://localhost:8000/api/v1/ai-insights/analyze/llm
FastAPI
  AiInsightService.analyze_with_llm()
OpenAI 또는 Gemini
  설정되어 있으면 호출
Fallback
  LLM 비활성화 또는 실패 시 룰 기반 결과 반환
```

FastAPI CORS 허용 origin:

```text
http://localhost:5173
http://127.0.0.1:5173
```

관련 FastAPI 파일:

```text
backend/src/main/java/com/dm/backend/controller/AiInsightProxyC.java
backend/src/main/java/com/dm/backend/service/AiInsightPayloadService.java
backend/src/main/java/com/dm/backend/vo/AiInsightAnalyzeRequestVO.java
opencv/app/main.py
opencv/app/api/ai_insight_router.py
opencv/app/services/ai_insight_service.py
opencv/app/services/llm_client.py
opencv/app/schemas/ai_insight.py
```

OpenAI 사용에 필요한 환경변수:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

OpenAI 호출이 정상 동작하면 응답의 `source`는 다음과 같습니다.

```text
source: "llm"
```

OpenAI 설정이 없거나 호출이 실패하면 다음으로 내려갑니다.

```text
source: "llm-fallback"
```

프론트엔드는 이 값을 KPI와 요약 배너에 표시합니다.

## Oracle / Hikari 안정화 설정

Spring DB 연결 안정화 설정은 다음 파일에 있습니다.

```text
backend/src/main/resources/application.properties
```

주요 설정:

```properties
spring.datasource.hikari.connection-test-query=SELECT 1 FROM DUAL
spring.datasource.hikari.max-lifetime=900000
spring.datasource.hikari.keepalive-time=120000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.data-source-properties.oracle.net.CONNECT_TIMEOUT=10000
spring.datasource.hikari.data-source-properties.oracle.jdbc.ReadTimeout=30000
spring.datasource.hikari.data-source-properties.oracle.net.keepAlive=true
```

목적:

- 끊어진 Oracle 커넥션 재사용 방지
- idle connection 유지
- 오래된 커넥션 주기적 교체
- DB 응답 지연 시 무한 대기 방지

## 현재 검증 체크리스트

1. Spring Boot를 `localhost:8080`에서 실행
2. FastAPI를 `localhost:8000`에서 실행
3. React를 `localhost:5173`에서 실행
4. CCTV 페이지에서 분석 시작 클릭
5. FastAPI 로그에 `[INFERENCE]` 출력 확인
6. FastAPI 로그에 `[AGGREGATE]` 출력 확인
7. CCTV 화면의 실시간 카메라 영역에 MJPEG 프레임이 표시되는지 확인
8. Spring 로그에 `PEOPLE_LOG 저장 완료` 출력 확인
9. 메인 대시보드 진입
10. 실시간 매장 인원 추이가 `people_log`, `shift` 기준으로 갱신되는지 확인
11. AI 운영 추천이 인력 배치/피크 운영 액션/유휴 시간 업무로 표시되는지 확인
12. 고객 행동 분석 페이지 진입
13. KPI와 차트가 `people_log`, `metrics` 기준으로 갱신되는지 확인
14. 요일별 방문 패턴이 주간 `people_log` 기준으로 표시되는지 확인
15. 고객 행동 분석 페이지에서 `새로고침` 클릭
16. AI 응답 출처가 `llm` 또는 `llm-fallback`으로 표시되는지 확인

## 문제 해결

### React는 STOP인데 FastAPI는 실행 중인 경우

다음 API 응답을 확인합니다.

```text
GET http://localhost:8080/api/cctv/metrics
```

CCTV 화면은 이 API를 기준으로 서버 상태를 동기화합니다.

### 실시간 카메라 영상이 끊기는 경우

현재 권장 방식은 `/api/v1/camera/stream` MJPEG 스트림입니다.

확인 순서:

1. FastAPI가 `localhost:8000`에서 실행 중인지 확인
2. CCTV 분석 시작 후 브라우저에서 직접 접속

```text
http://localhost:8000/api/v1/camera/stream
```

3. 직접 접속해도 안 나오면 OpenCV 입력 소스 문제입니다.
   - 웹캠 번호가 맞는지 확인
   - 서버 PC에 웹캠이 있는지 확인
   - 테스트 시 `VIDEO_FILE`과 `test_assets/uploads/...mp4` 경로 사용

4. 나오지만 끊기면 `.env`에서 프리뷰 설정 조정

```env
PREVIEW_STREAM_FPS=12
PREVIEW_JPEG_QUALITY=75
```

권장값:

- 부드러움 우선: `PREVIEW_STREAM_FPS=15`
- CPU/네트워크 절약: `PREVIEW_JPEG_QUALITY=60`
- 너무 높은 FPS는 YOLO 추론, JPEG 인코딩, 브라우저 렌더링 부담이 커질 수 있으므로 12~15fps 권장

### FastAPI가 `body: Field required`를 반환하는 경우

camera start는 Spring에서 query fallback을 사용합니다. 직접 확인할 때는 다음 형태를 사용할 수 있습니다.

```text
POST /api/v1/camera/start?storeId=1&cameraId=CAM-001&source=0&sourceType=WEBCAM&intervalSec=5&aggregationIntervalSec=60
```

### OpenAI 결과가 나오지 않는 경우

FastAPI `.env`를 확인합니다.

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=...
```

설정이 없으면 결과는 나오지만 출처가 다음처럼 표시됩니다.

```text
source: "llm-fallback"
```

### DB 오류 `ORA-03113`이 나오는 경우

Oracle 연결이 중간에 끊긴 상황입니다.

이후 로그에 다음 메시지가 있으면 저장은 복구된 것입니다.

```text
PEOPLE_LOG 저장 완료
```

같은 오류가 반복되면 Spring을 재시작하고 Hikari 설정이 적용되었는지 확인합니다.
