# 현재 연동 상태

최종 갱신일: 2026-06-11

## 개요

현재 시스템은 다음 네 영역이 연결되어 동작합니다.

- React 프론트엔드: 관리자 CCTV 제어 화면, 고객 행동 분석 및 인사이트 화면
- Spring Boot 백엔드: API 프록시, Oracle 저장, people_log 조회
- FastAPI/OpenCV 서버: 웹캠/RTSP/영상 파일 분석, 집계, AI 인사이트 생성
- Oracle DB: 집계된 고객 수를 `PEOPLE_LOG` 테이블에 저장

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
| `GET` | `/api/v1/camera/aggregate/latest` | 가장 최근 집계 결과 조회 |

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

## OpenAI / LLM 인사이트 흐름

고객 행동 분석 화면에는 두 가지 갱신 흐름이 있습니다.

1. 자동 5초 동기화
   - 운영 데이터만 조회합니다.
   - OpenAI API를 호출하지 않습니다.

2. 수동 `새로고침` 버튼
   - 최신 운영 데이터를 다시 조회합니다.
   - `AiInsightAnalyzeRequest` 형태의 payload를 만듭니다.
   - FastAPI LLM 인사이트 API를 호출합니다.

수동 새로고침 흐름:

```text
React
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
7. Spring 로그에 `PEOPLE_LOG 저장 완료` 출력 확인
8. 고객 행동 분석 페이지 진입
9. KPI와 차트가 `people_log`, `metrics` 기준으로 갱신되는지 확인
10. 고객 행동 분석 페이지에서 `새로고침` 클릭
11. AI 응답 출처가 `llm` 또는 `llm-fallback`으로 표시되는지 확인

## 문제 해결

### React는 STOP인데 FastAPI는 실행 중인 경우

다음 API 응답을 확인합니다.

```text
GET http://localhost:8080/api/cctv/metrics
```

CCTV 화면은 이 API를 기준으로 서버 상태를 동기화합니다.

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
