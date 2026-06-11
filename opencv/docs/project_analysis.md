# ShiftOps AI Server 프로젝트 분석

## 1. 프로젝트 개요

이 프로젝트는 FastAPI, OpenCV, Ultralytics YOLO를 기반으로 매장 영상 또는 이미지를 분석해 방문 고객 수를 추정하는 AI 서버입니다.

주요 역할은 다음과 같습니다.

- 영상 파일, 웹캠, RTSP 스트림에서 일정 간격으로 프레임을 샘플링합니다.
- YOLO person 클래스만 추론해 `customerCount`를 계산합니다.
- 단일 프레임 결과를 집계 구간 단위로 요약합니다.
- 집계 결과를 Spring Boot 서버로 비동기 전송할 수 있습니다.
- 더미 데이터, 샘플 데이터, 직접 입력 데이터를 기반으로 운영 인사이트를 생성합니다.
- OpenAI 또는 Gemini 설정이 있으면 LLM 기반 인사이트를 생성하고, 없거나 실패하면 룰 기반 결과로 fallback합니다.

## 2. 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| API 서버 | FastAPI, Uvicorn |
| 설정 관리 | pydantic-settings, `.env` |
| 영상 처리 | OpenCV |
| 객체 탐지 | Ultralytics YOLO |
| 데이터 검증 | Pydantic |
| 외부 연동 | httpx |
| 병렬/전송 처리 | Thread, ThreadPoolExecutor, SQLite outbox |

## 3. 디렉터리 구조

```text
.
├─ main.py                         # 루트 실행 진입점, app.main의 FastAPI app import
├─ requirements.txt                # Python 의존성
├─ app/
│  ├─ main.py                      # FastAPI 앱 생성, 라우터 등록, 정적 페이지 연결
│  ├─ api/                         # REST API 라우터
│  ├─ core/                        # 설정, 로거, 런타임 상태
│  ├─ schemas/                     # 요청/응답 Pydantic 모델
│  ├─ services/                    # 추론, Spring 전송, AI 인사이트, LLM 연동
│  ├─ vision/                      # 프레임 샘플링, YOLO 탐지, 영상 소스 처리
│  ├─ data/                        # AI 인사이트 더미/샘플 JSON
│  └─ web/                         # 실험용 웹 페이지
├─ docs/                           # 프로젝트 문서
└─ test_assets/                    # 테스트 이미지/영상 및 업로드 파일
```

## 4. 실행 흐름

### 4.1 서버 시작

`main.py`는 `app.main`의 `app` 객체를 가져오고, 직접 실행 시 `uvicorn`을 통해 `127.0.0.1:8000`에서 서버를 실행합니다.

```powershell
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

주요 접근 경로는 다음과 같습니다.

- Swagger: `http://127.0.0.1:8000/docs`
- 실험 페이지: `http://127.0.0.1:8000/experiment`
- 정적 웹 리소스: `http://127.0.0.1:8000/web`

### 4.2 카메라 추론

1. 클라이언트가 `POST /api/v1/camera/start`를 호출합니다.
2. `InferenceService.start()`가 백그라운드 Thread를 생성하고 `InferenceState`를 running 상태로 변경합니다.
3. `_run_loop()`가 입력 소스 타입에 따라 영상 소스를 엽니다.
4. `FrameSampler`가 샘플링 간격을 제어합니다.
5. 샘플 프레임은 `ThreadPoolExecutor`로 병렬 추론됩니다.
6. `PersonDetector`가 YOLO 모델로 사람 객체만 탐지합니다.
7. 결과는 `DetectionResponse`로 변환되고 상태에 저장됩니다.
8. `AggregationBucket`이 `aggregationIntervalSec` 기준으로 결과를 묶어 집계 응답을 만듭니다.
9. 집계 응답은 `SpringClient`의 SQLite outbox에 먼저 저장된 뒤 Spring Boot 서버로 전송되거나, 설정에 따라 전송을 건너뜁니다.

### 4.3 단일 이미지 추론

`POST /api/v1/inference/image`는 업로드된 이미지를 OpenCV로 디코딩한 뒤 YOLO 추론을 수행합니다.

응답에는 다음 정보가 포함됩니다.

- 탐지된 고객 수
- 평균 confidence
- 처리 시간
- 모델명, 이미지 크기, confidence threshold
- 박스 좌표 목록
- 박스가 그려진 base64 JPEG 이미지

### 4.4 AI 인사이트 생성

AI 인사이트는 `AiInsightService`가 담당합니다.

- `rule-based`: 입력 데이터에서 피크 시간과 혼잡도 흐름을 계산해 고정 규칙으로 응답합니다.
- `dummy`: `app/data/customer_analysis_dummy.json` 기반으로 룰 기반 응답을 만듭니다.
- `samples`: `app/data/ai_insight_samples/*.json` 샘플을 사용합니다.
- `llm`: OpenAI 또는 Gemini 설정이 있으면 룰 기반 baseline과 원본 데이터를 함께 보내 문구와 운영 제안을 생성합니다.
- `llm-fallback`: LLM이 비활성화되었거나 호출에 실패하면 룰 기반 결과를 반환합니다.

## 5. 주요 API

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/` | 서버 기본 상태와 문서/실험 페이지 링크 반환 |
| GET | `/health` | 서버 상태, 추론 루프 실행 여부, 모델 로드 여부 반환 |
| POST | `/api/v1/camera/start` | 영상/스트림 기반 추론 루프 시작 |
| POST | `/api/v1/camera/stop` | 추론 루프 중지 |
| GET | `/api/v1/camera/status` | 마지막 추론 결과와 현재 상태 반환 |
| GET | `/api/v1/camera/metrics` | 처리 프레임 수, 드롭 프레임 수, 평균 처리 시간 반환 |
| GET | `/api/v1/camera/aggregate/latest` | 가장 최근 집계 결과 반환 |
| POST | `/api/v1/camera/upload-video` | 테스트용 영상 업로드 후 저장 경로 반환 |
| POST | `/api/v1/inference/image` | 단일 이미지 고객 수 추론 |
| GET | `/api/v1/ai-insights/rule-based` | 더미 데이터 기반 룰 인사이트 반환 |
| GET | `/api/v1/ai-insights/dummy` | 더미 소스 표시가 포함된 룰 인사이트 반환 |
| GET | `/api/v1/ai-insights/samples` | 사용 가능한 샘플명 목록 반환 |
| GET | `/api/v1/ai-insights/samples/{sample_name}/rule-based` | 특정 샘플의 룰 인사이트 반환 |
| GET | `/api/v1/ai-insights/samples/{sample_name}/llm` | 특정 샘플의 LLM 인사이트 반환 |
| GET | `/api/v1/ai-insights/llm` | 더미 데이터 기반 LLM 인사이트 반환 |
| POST | `/api/v1/ai-insights/analyze` | 요청 본문 데이터 기반 룰 인사이트 생성 |
| POST | `/api/v1/ai-insights/analyze/llm` | 요청 본문 데이터 기반 LLM 인사이트 생성 |

## 6. 핵심 요청/응답 모델

### 6.1 CameraStartRequest

| 필드 | 설명 |
| --- | --- |
| `storeId` | 매장 ID |
| `cameraId` | 카메라 ID |
| `source` | 영상 파일 경로, 웹캠 번호, RTSP URL |
| `sourceType` | `VIDEO_FILE`, `WEBCAM`, `RTSP` |
| `intervalSec` | 프레임 샘플링 간격 |
| `aggregationIntervalSec` | Spring 전송용 집계 구간 |
| `modelName` | 사용할 YOLO 모델명 |
| `imageSize` | YOLO 입력 이미지 크기 |
| `confidence` | confidence threshold |

### 6.2 DetectionResponse

단일 프레임 또는 단일 이미지의 추론 결과입니다.

- `customerCount`: 탐지된 사람 수
- `confidenceAvg`: 탐지 박스 confidence 평균
- `processingMs`: 추론 처리 시간
- `boxes`: 좌표와 confidence가 포함된 탐지 박스 목록
- `annotatedImage`: 박스가 그려진 base64 JPEG

### 6.3 AggregatedCongestionResponse

여러 추론 결과를 하나의 운영 지표로 집계한 응답입니다.

- 평균, 최대, 최소, 마지막 고객 수
- 샘플 수
- 평균 confidence
- 평균 처리 시간
- 처리/드롭 프레임 수
- 집계 시작/종료 시각
- 선택적으로 개별 샘플 목록

### 6.4 AiInsightResponse

운영 인사이트 화면에서 바로 사용할 수 있는 구조입니다.

- 매장/업종 context
- 날짜/요일/휴일/계절 context
- 요약 상태와 위험도
- 인사이트 카드 목록
- 시간대별 혼잡도 요약
- 혼잡도 수준과 계산된 feature 값

## 7. 영상 소스 처리 방식

### VIDEO_FILE

`FileVideoSource`는 OpenCV `VideoCapture`를 사용해 파일을 열고, `sample_index * intervalSec` 위치로 이동한 뒤 프레임을 읽습니다.

장점은 영상 길이와 무관하게 일정 시간 간격의 샘플을 직접 추출할 수 있다는 점입니다.

### WEBCAM / RTSP

`StreamVideoSource`는 별도 reader Thread에서 최신 프레임만 계속 갱신합니다. 추론 루프는 샘플링 시점마다 최신 프레임을 복사해 사용합니다.

이 방식은 실시간 스트림에서 오래된 프레임이 누적되는 문제를 줄이는 데 유리합니다.

## 8. Spring Boot 연동

`SpringClient`는 `SEND_TO_SPRING` 설정에 따라 동작합니다. AWS SQS를 쓰지 않고 SQLite 기반 로컬 outbox queue를 사용해 전송 전 payload를 디스크에 먼저 저장합니다.

- `SEND_TO_SPRING=false`: 전송을 건너뛰고 성공으로 처리합니다.
- `SEND_TO_SPRING=true`: `SENDER_QUEUE_DB`에 payload를 저장하고 별도 Thread에서 POST를 수행합니다.
- 요청 헤더에는 `X-AI-API-KEY`가 포함됩니다.
- 전송 실패 시 설정된 횟수만큼 재시도합니다.
- 최종 실패 시 SQLite row를 `FAILED` 상태로 유지하고 `FAILED_PAYLOAD_LOG`에도 JSON Lines 형식으로 기록합니다.

Spring 전송 시 `boxes`, `annotatedImage`는 제외됩니다. `INCLUDE_AGGREGATE_SAMPLES=false`이면 집계 payload의 `samples`도 제외됩니다.

## 9. 환경변수

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `YOLO_MODEL` | `yolo11s.pt` | 기본 YOLO 모델 파일 |
| `MODEL_PATH` | `models/yolo11s.pt` | 명시 모델 경로 |
| `MODEL_NAME` | `yolo11s` | 모델명 fallback |
| `CONFIDENCE_THRESHOLD` | `0.35` | 기본 confidence threshold |
| `SPRING_CONGESTION_URL` | `http://127.0.0.1:8080/api/ai/congestion` | Spring 전송 URL |
| `SPRING_API_KEY` | `shiftops-ai-secret` | Spring API 인증 키 |
| `SEND_TO_SPRING` | `false` | Spring 전송 여부 |
| `MAX_FRAME_RETRIES` | `3` | 스트림 프레임 읽기 실패 재시도 횟수 |
| `INFERENCE_WORKERS` | `2` | 병렬 추론 worker 수 |
| `MAX_PENDING_FRAMES` | `20` | 대기 중인 추론 Future 최대치 |
| `SENDER_QUEUE_MAX_SIZE` | `100` | 로컬 전송 outbox의 pending/in-flight 허용치 |
| `SENDER_QUEUE_DB` | `logs/sender_queue.sqlite3` | 로컬 전송 outbox SQLite 파일 |
| `SENDER_POLL_INTERVAL_SEC` | `1.0` | sender thread가 대기 메시지를 확인하는 주기 |
| `INCLUDE_AGGREGATE_SAMPLES` | `true` | 집계 payload에 samples 포함 여부 |
| `INCLUDE_CAMERA_ANNOTATED_IMAGE` | `false` | 영상/스트림 분석 결과에 base64 annotated image 포함 여부 |
| `INCLUDE_IMAGE_ANNOTATED_IMAGE` | `true` | 단일 이미지 분석 결과에 base64 annotated image 포함 여부 |
| `SPRING_SEND_RETRY` | `3` | Spring 전송 재시도 횟수 |
| `SPRING_SEND_TIMEOUT_SEC` | `3.0` | Spring 요청 timeout |
| `FAILED_PAYLOAD_LOG` | `logs/failed_payloads.log` | 전송 실패 payload 로그 |
| `LLM_PROVIDER` | `none` | `none`, `openai`, `gemini` |
| `OPENAI_API_KEY` | 빈 문자열 | OpenAI API Key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 모델명 |
| `GEMINI_API_KEY` | 빈 문자열 | Gemini API Key |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini 모델명 |
| `LLM_TIMEOUT_SEC` | `20.0` | LLM 요청 timeout |

## 10. 모델 선택 로직

`PersonDetector`는 요청 또는 설정의 모델명을 stem 기준으로 해석합니다.

탐색 우선순위는 다음과 같습니다.

1. 이미 로드된 모델 캐시
2. `YOLO_MODEL`에 지정된 파일
3. `MODEL_PATH`에 지정된 파일
4. `models/{modelName}.pt`
5. `{modelName}.pt`

YOLO 추론은 `classes=[0]`으로 사람 클래스만 사용합니다.

## 11. 운영/개발 관점 체크포인트

- 현재 추론 상태는 프로세스 메모리의 싱글톤 `InferenceState`에 저장됩니다. 서버 재시작 시 상태는 초기화됩니다.
- 동시에 하나의 카메라 추론 루프만 실행할 수 있습니다.
- 업로드 영상은 `test_assets/uploads`에 UUID 파일명으로 저장됩니다.
- 대용량 모델 파일과 업로드 파일은 Git 관리 대상에서 제외하거나 별도 보관 전략이 필요합니다.
- README와 일부 기존 docs 출력은 콘솔 인코딩에 따라 한글이 깨져 보일 수 있습니다. 문서는 UTF-8 기준으로 관리하는 것이 좋습니다.
- LLM 인사이트는 외부 API 키가 없으면 자동으로 룰 기반 fallback 결과를 반환합니다.
- Spring 전송 실패 payload는 SQLite outbox와 로그에 남습니다. 운영 중에는 FAILED row 재전송 또는 정리 정책이 필요합니다.

## 12. 추천 개선 방향

- 다중 카메라 동시 처리 요구가 생기면 `InferenceState`와 `InferenceService`를 cameraId 기준 세션 구조로 분리합니다.
- SQLite outbox의 FAILED 메시지를 재처리하는 관리 API를 추가합니다.
- 테스트 코드가 없으므로 라우터, 집계 로직, 인사이트 feature 계산을 중심으로 단위 테스트를 추가합니다.
- AI 인사이트 문구는 현재 더미/샘플 데이터와 LLM prompt 의존도가 높으므로 프론트 요구사항에 맞춘 응답 계약 테스트를 두는 것이 좋습니다.
- 운영 환경에서는 모델 로드 시간, 추론 latency, Queue 포화율, 전송 실패율을 별도 모니터링 지표로 수집하는 것이 좋습니다.
