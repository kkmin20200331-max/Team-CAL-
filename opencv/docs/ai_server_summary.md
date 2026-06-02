# AI Server Summary - ShiftOps AI

## Role

Python AI 서버는 단순히 사람 수를 계산하는 모듈이 아니라, 영상 입력 처리, YOLO 기반 사람 탐지, 프레임 샘플링, 병렬 추론, 1분 단위 집계, 디버깅 이미지 생성, Spring Boot 전송, 서버 상태 모니터링을 담당하는 AI 분석 엔진이다.

## Implemented Features

| Category | Feature | Status |
| --- | --- | --- |
| Input | 이미지 업로드 추론 | Done |
| Input | 영상 파일 업로드 및 샘플 영상 추론 | Done |
| Input | 웹캠/RTSP 입력 구조 | Done |
| AI | Ultralytics YOLO person detection | Done |
| AI | `classes=[0]` person 전용 추론 | Done |
| Result | `customerCount`, `confidenceAvg`, `processingMs` 계산 | Done |
| Debug | 탐지 박스 좌표와 confidence 반환 | Done |
| Debug | 박스가 그려진 `annotatedImage` 반환 | Done |
| Performance | `ThreadPoolExecutor` 병렬 추론 | Done |
| Performance | 워커별 `PersonDetector` 분리 | Done |
| Performance | 파일 영상 시간 점프 샘플링 | Done |
| Realtime | 스트림 최신 프레임 유지 | Done |
| Aggregation | 1분 단위 avg/max/min/last 집계 | Done |
| Monitoring | `/api/v1/camera/status` | Done |
| Monitoring | `/api/v1/camera/metrics` | Done |
| Integration | Spring Boot 집계 JSON 전송 | Done |
| Reliability | Sender queue, retry, failed payload log | Done |
| Experiment | 성능 실험표 템플릿 | Done |

## Pipeline

```text
Input Source
  -> FileVideoSource or StreamVideoSource
  -> intervalSec frame sampling
  -> inference queue
  -> YOLO person detection workers
  -> latest debug result
  -> aggregation buffer
  -> sender queue
  -> Spring Boot POST
```

## Source Strategy

`FileVideoSource`는 오프라인 영상 파일에 사용한다. `CAP_PROP_POS_MSEC`로 `0초, intervalSec초, intervalSec*2초...` 위치에 점프해서 필요한 프레임만 읽는다.

`StreamVideoSource`는 웹캠과 RTSP에 사용한다. 백그라운드 캡처 스레드가 최신 프레임 1개만 계속 덮어쓰고, 추론 루프는 샘플링 시점의 최신 프레임을 복사해서 사용한다.

## Aggregated Spring Payload

Spring Boot에는 개별 프레임 결과가 아니라 1분 단위 집계 JSON을 보낸다.

```json
{
  "storeId": 1,
  "cameraId": "CAM-001",
  "measuredAt": "2026-05-28T15:31:00",
  "intervalSec": 60,
  "avgCustomerCount": 10.5,
  "maxCustomerCount": 13,
  "minCustomerCount": 8,
  "lastCustomerCount": 12,
  "sampleCount": 6,
  "confidenceAvg": 0.72,
  "processingMsAvg": 210,
  "processedFrames": 6,
  "droppedFrames": 0,
  "modelName": "yolo11s",
  "imageSize": 960,
  "confidenceThreshold": 0.3,
  "sourceType": "VIDEO_FILE",
  "status": "SUCCESS"
}
```

## Metrics

```text
GET /api/v1/camera/metrics
```

```json
{
  "running": true,
  "workers": 2,
  "queueSize": 1,
  "processedFrames": 128,
  "droppedFrames": 2,
  "avgProcessingMs": 225,
  "lastCustomerCount": 12,
  "lastConfidenceAvg": 0.74,
  "lastMeasuredAt": "2026-05-28T15:30:00",
  "lastSendSuccess": true,
  "lastSendAt": "2026-05-28T15:31:00"
}
```

## Current Recommended Settings

```env
YOLO_MODEL=yolo11s.pt
INFERENCE_WORKERS=2
MAX_PENDING_FRAMES=20
SENDER_QUEUE_MAX_SIZE=100
SPRING_SEND_RETRY=3
SPRING_SEND_TIMEOUT_SEC=3
FAILED_PAYLOAD_LOG=logs/failed_payloads.log
```

영상 테스트 요청 기준:

```json
{
  "storeId": 1,
  "cameraId": "CAM-VIDEO-001",
  "source": "test_assets/videos/cafe_low.mp4",
  "sourceType": "VIDEO_FILE",
  "intervalSec": 10,
  "aggregationIntervalSec": 60,
  "modelName": "yolo11s",
  "imageSize": 960,
  "confidence": 0.3
}
```

## Presentation Point

초기 구조에서는 영상 프레임을 순차적으로 읽고 YOLO 추론 후 바로 전송하는 방식이었기 때문에, 추론 시간이 길어지면 샘플링 간격이 밀리고 Spring Boot 응답 지연이 AI 서버 전체에 영향을 줄 수 있었다.

이를 개선하기 위해 영상 입력을 `FileVideoSource`와 `StreamVideoSource`로 추상화하고, 프레임 샘플링, YOLO 추론, 1분 집계, Spring Boot 전송을 각각 분리했다.

또한 30fps 원본 영상을 모든 프레임 단위로 처리하지 않고 10초 단위 샘플링 구조로 전환하여 처리 대상 프레임 수를 약 99.7% 줄였고, 1분 단위 avg/max/min/last 집계값을 생성해 매장 인원 추이와 피크타임 분석에 활용할 수 있도록 설계했다.

## Next Experiments

1. `imageSize` 960, 800, 640 비교
2. `yolo11s`와 `yolo11n` 비교
3. `INFERENCE_WORKERS` 1, 2, 3 비교
4. OpenVINO export 성능 비교
5. `annotatedImage` 생성 빈도 조절 실험
