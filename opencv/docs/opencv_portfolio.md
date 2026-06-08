# OpenCV AI Server 포트폴리오 발표 자료

## 1. 프로젝트 한 줄 소개

ShiftOps AI Server는 매장 CCTV 또는 영상 파일에서 고객 수를 자동으로 추정하고, 시간대별 혼잡도와 운영 인사이트 생성을 위한 데이터를 제공하는 Python 기반 AI 분석 서버입니다.

## 2. 프로젝트 배경

매장 운영자는 특정 시간대에 고객이 얼마나 몰리는지, 인력이 부족한 시간대가 언제인지, 방문 흐름이 매출이나 스케줄과 어떻게 연결되는지 빠르게 파악해야 합니다.

하지만 CCTV 영상을 사람이 직접 확인하는 방식은 시간이 많이 걸리고, 실시간 운영 판단에 활용하기 어렵습니다. 이 프로젝트는 OpenCV와 YOLO를 활용해 영상에서 사람 수를 자동으로 계산하고, Spring Boot 및 프론트엔드에서 활용 가능한 집계 데이터를 만드는 것을 목표로 했습니다.

## 3. 담당 역할

- FastAPI 기반 AI 서버 구조 설계
- OpenCV 영상 입력 처리 구현
- YOLO 기반 사람 탐지 기능 구현
- 영상 파일, 웹캠, RTSP 입력 소스 분리
- 프레임 샘플링 및 병렬 추론 구조 구현
- 고객 수 집계 응답 모델 설계
- Spring Boot 서버 전송 구조 구현
- AI 인사이트용 더미/샘플 데이터 및 분석 API 구현
- 발표/시연용 실험 페이지와 문서 정리

## 4. 사용 기술

| 구분 | 기술 |
| --- | --- |
| Language | Python |
| Backend | FastAPI, Uvicorn |
| Computer Vision | OpenCV |
| Object Detection | Ultralytics YOLO |
| Data Model | Pydantic |
| Config | pydantic-settings, `.env` |
| Async/Parallel | Thread, ThreadPoolExecutor, Queue |
| Integration | httpx, Spring Boot API |
| Optional AI | OpenAI API, Gemini API |

## 5. 시스템 구조

```text
Camera / Video / Image
  -> OpenCV VideoCapture
  -> Frame Sampling
  -> YOLO Person Detection
  -> Customer Count Result
  -> Aggregation
  -> Spring Boot API
  -> Frontend Dashboard / AI Insight
```

핵심은 영상 전체 프레임을 모두 분석하지 않고, 운영 지표에 필요한 시간 간격의 프레임만 샘플링한다는 점입니다. 이를 통해 추론 비용을 줄이면서도 매장 혼잡도 흐름을 파악할 수 있도록 설계했습니다.

## 6. 주요 기능

### 6.1 이미지 단건 분석

이미지 한 장을 업로드하면 YOLO 모델이 사람 객체만 탐지하고 고객 수를 계산합니다.

반환 데이터:

- 탐지된 고객 수
- confidence 평균
- 탐지 박스 좌표
- 박스가 그려진 annotated image
- 처리 시간

### 6.2 영상 파일 분석

영상 파일은 `VIDEO_FILE` 소스로 처리합니다.

OpenCV의 `CAP_PROP_POS_MSEC`를 사용해 `0초`, `10초`, `20초`처럼 지정한 간격의 프레임 위치로 이동한 뒤 분석합니다.

이 방식의 장점:

- 전체 프레임을 순차 처리하지 않아도 됩니다.
- 발표/시연용 영상에서 결과를 빠르게 확인할 수 있습니다.
- 같은 영상과 설정으로 반복 실험하기 쉽습니다.

### 6.3 웹캠/RTSP 스트림 분석

실시간 스트림은 최신 프레임 1개만 유지하는 구조로 처리합니다.

백그라운드 reader thread가 계속 프레임을 읽고, 추론 루프는 샘플링 시점마다 최신 프레임을 복사해 사용합니다.

이 방식의 장점:

- 오래된 프레임이 큐에 쌓이는 문제를 줄입니다.
- 실시간 영상에서 현재 상황에 가까운 프레임을 분석할 수 있습니다.
- RTSP CCTV 확장에 필요한 기반 구조를 갖출 수 있습니다.

### 6.4 고객 수 집계

개별 프레임 결과를 바로 전송하지 않고, `aggregationIntervalSec` 기준으로 묶어 집계합니다.

집계 데이터:

- 평균 고객 수
- 최대 고객 수
- 최소 고객 수
- 마지막 고객 수
- 샘플 수
- 평균 confidence
- 평균 처리 시간
- 처리 프레임 수
- 드롭 프레임 수

이 집계 결과는 프론트엔드 대시보드와 Spring Boot 서버에서 시간대별 혼잡도 데이터로 활용할 수 있습니다.

### 6.5 AI 운영 인사이트

단순 고객 수 추정에서 끝나지 않고, POS, 스케줄, 과거 평균 데이터와 결합할 수 있는 AI 인사이트 API도 구현했습니다.

인사이트 예시:

- 피크 시간대 안내
- 인력 부족 위험도
- 직원 추가 배치 추천
- 방문 대비 전환율 저하 시간대
- 업종별 운영 보조 역할 추천

LLM API Key가 설정되어 있으면 OpenAI 또는 Gemini를 호출하고, 설정이 없거나 실패하면 룰 기반 분석 결과를 반환합니다.

## 7. API 구성

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/health` | 서버 상태 및 모델 로드 여부 확인 |
| POST | `/api/v1/inference/image` | 이미지 1장 고객 수 분석 |
| POST | `/api/v1/camera/upload-video` | 영상 파일 업로드 |
| POST | `/api/v1/camera/start` | 영상/스트림 분석 시작 |
| POST | `/api/v1/camera/stop` | 분석 중지 |
| GET | `/api/v1/camera/status` | 최신 분석 결과 확인 |
| GET | `/api/v1/camera/metrics` | 처리량과 성능 지표 확인 |
| GET | `/api/v1/camera/aggregate/latest` | 최근 집계 결과 확인 |
| GET | `/api/v1/ai-insights/rule-based` | 룰 기반 인사이트 생성 |
| POST | `/api/v1/ai-insights/analyze` | 입력 데이터 기반 인사이트 생성 |
| POST | `/api/v1/ai-insights/analyze/llm` | LLM 기반 인사이트 생성 |

## 8. 핵심 기술 포인트

### 8.1 YOLO person class만 추론

COCO class 중 `person`만 탐지하도록 설정했습니다.

```python
predict_args = {
    "verbose": False,
    "conf": resolved_confidence,
    "classes": [0],
}
```

불필요한 객체 탐지를 줄이고, 매장 방문 인원 수라는 목적에 집중했습니다.

### 8.2 샘플링과 추론 분리

초기 구조에서 영상 읽기, 추론, 전송이 한 흐름에 묶이면 추론 시간이 길어질 때 샘플링 간격이 흔들릴 수 있습니다.

현재 구조는 다음처럼 역할을 분리했습니다.

- 영상 입력: `FileVideoSource`, `StreamVideoSource`
- 샘플링 제어: `FrameSampler`
- 병렬 추론: `ThreadPoolExecutor`
- 상태 관리: `InferenceState`
- 집계 처리: `AggregationBucket`
- 외부 전송: `SpringClient`

### 8.3 병렬 추론 구조

`INFERENCE_WORKERS` 설정값에 따라 여러 worker가 프레임 추론을 병렬 처리합니다.

또한 worker thread마다 `PersonDetector`를 분리해 모델 사용 흐름을 안정적으로 가져가도록 구성했습니다.

### 8.4 비동기 Spring 전송

Spring Boot로 데이터를 전송하는 과정이 AI 추론 흐름을 막지 않도록 Queue와 별도 sender thread를 사용했습니다.

전송 실패 시:

- 설정된 횟수만큼 재시도
- Queue 포화 또는 최종 실패 시 failed payload log 저장
- `SEND_TO_SPRING=false`일 때는 로컬 실험만 수행

### 8.5 로컬 영속 전송 큐

AWS SQS 같은 외부 메시지 큐를 바로 붙이지 않고, Python 표준 라이브러리의 SQLite를 사용해 로컬 outbox queue를 직접 구현했습니다.

```text
1분 단위 집계 결과
  -> SQLite outbound_messages 저장
  -> sender thread가 Spring Boot POST
  -> 성공 시 DB에서 삭제
  -> 실패 시 재시도
  -> 최종 실패 시 FAILED 상태와 failed payload log 보관
```

이 구조의 장점은 다음과 같습니다.

- AI 서버가 재시작되어도 아직 전송되지 않은 payload가 디스크에 남습니다.
- Spring Boot 서버가 잠시 내려가도 집계 데이터가 바로 사라지지 않습니다.
- 외부 클라우드 서비스 없이 메시지 큐와 유사한 안정성을 확보할 수 있습니다.
- `/api/v1/camera/metrics`에서 대기/실패 메시지 수를 확인할 수 있습니다.

## 9. 시연 흐름

발표 시 다음 순서로 보여주면 자연스럽습니다.

1. 서버 실행

```powershell
uvicorn main:app --reload
```

2. Swagger 문서 확인

```text
http://127.0.0.1:8000/docs
```

3. 실험 페이지 접속

```text
http://127.0.0.1:8000/experiment
```

4. 이미지 업로드 분석

- 이미지 업로드
- 탐지 박스 확인
- `customerCount`, `confidenceAvg`, `processingMs` 확인

5. 영상 업로드 후 분석 시작

```json
{
  "storeId": 1,
  "cameraId": "CAM-DEMO-001",
  "source": "test_assets/uploads/demo.mp4",
  "sourceType": "VIDEO_FILE",
  "intervalSec": 10,
  "aggregationIntervalSec": 60,
  "modelName": "yolo11s",
  "imageSize": 960,
  "confidence": 0.3
}
```

6. 상태와 metrics 확인

- `/api/v1/camera/status`
- `/api/v1/camera/metrics`
- `/api/v1/camera/aggregate/latest`

7. AI 인사이트 결과 확인

- `/api/v1/ai-insights/rule-based`
- `/api/v1/ai-insights/samples/cafe/rule-based`

## 10. 발표에서 강조할 점

### 문제 해결 관점

단순히 YOLO를 실행한 것이 아니라, 매장 운영자가 활용할 수 있는 시간대별 혼잡도 데이터로 변환했습니다.

### 성능 관점

30fps 영상을 모든 프레임으로 분석하지 않고, 운영 목적에 맞게 10초 또는 1분 단위로 샘플링했습니다. 이로 인해 처리 대상 프레임 수를 크게 줄일 수 있습니다.

예를 들어 10분짜리 30fps 영상은 약 18,000프레임입니다. 10초 간격으로 샘플링하면 약 60프레임만 분석하면 되므로, 전체 프레임 대비 분석량을 약 0.33% 수준으로 줄일 수 있습니다.

### 확장성 관점

영상 파일에서 시작했지만, 웹캠과 RTSP 구조를 분리해 실제 CCTV 입력으로 확장할 수 있게 만들었습니다.

### 연동 관점

AI 서버가 단독으로 끝나지 않고 Spring Boot, 프론트엔드, POS/스케줄 데이터와 연결될 수 있는 API 응답 구조를 설계했습니다.

### 안정성 관점

Spring 전송을 SQLite 기반 로컬 outbox queue로 분리하고, 실패 payload를 DB와 로그에 남겨 운영 중 장애 대응이 가능하도록 했습니다.

## 11. 트러블슈팅과 개선 경험

### 문제 1. 모든 프레임을 처리하면 추론 비용이 커짐

해결:

- 전체 프레임 분석 대신 시간 기반 샘플링을 적용했습니다.
- 영상 파일은 특정 초 위치로 점프해서 필요한 프레임만 읽도록 개선했습니다.

### 문제 2. 실시간 스트림에서 오래된 프레임이 쌓일 수 있음

해결:

- 스트림 reader thread가 최신 프레임만 유지하도록 구성했습니다.
- 추론 시점에는 최신 프레임 복사본을 사용했습니다.

### 문제 3. Spring Boot 응답 지연이 추론 흐름에 영향을 줄 수 있음

해결:

- SQLite outbox queue와 별도 전송 thread를 도입했습니다.
- 먼저 디스크에 payload를 저장한 뒤 전송해서 프로세스 재시작 상황에서도 데이터 소실 위험을 줄였습니다.
- 실패 시 retry, FAILED 상태, failed payload log를 남기도록 했습니다.

### 문제 4. 단일 탐지 결과만으로는 운영 판단이 어려움

해결:

- 프레임 단위 결과를 집계해 평균, 최대, 최소, 마지막 고객 수를 제공합니다.
- AI 인사이트 API에서 POS, 스케줄, 과거 평균 데이터와 결합할 수 있도록 구조화했습니다.

## 12. 결과물

- FastAPI 기반 AI 서버
- 이미지 고객 수 추론 API
- 영상/스트림 기반 고객 수 추론 API
- 시간대별 고객 수 집계 API
- Spring Boot 전송 모듈
- AI 인사이트 API
- 실험용 웹 페이지
- 발표 및 문서화 자료

## 13. 향후 개선 방향

- 다중 카메라 동시 분석 구조로 확장
- OpenVINO 또는 ONNX Runtime 기반 추론 최적화
- 실제 CCTV RTSP 환경에서 장시간 안정성 테스트
- 전송 실패 payload 재전송 API 추가
- 혼잡도 예측 모델 또는 시계열 분석 추가
- 프론트엔드 대시보드와 연동한 운영 리포트 자동화

## 14. 발표 마무리 멘트

이 프로젝트는 OpenCV와 YOLO를 이용해 영상에서 사람 수를 탐지하는 기능을 구현하는 데서 멈추지 않고, 매장 운영에 필요한 혼잡도 집계와 인사이트 데이터로 확장한 AI 서버입니다.

영상 입력, 샘플링, 추론, 집계, 외부 전송을 분리해 실제 서비스 구조에 가깝게 설계했고, Spring Boot 및 프론트엔드와 연동 가능한 API 중심으로 구현했습니다.
