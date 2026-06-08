# AI Server Summary - ShiftOps AI

## 역할

Python AI 서버는 CCTV 또는 영상 파일에서 사람 수를 추정하고, 시간대별 방문 흐름 데이터를 만드는 분석 서버입니다.

주요 역할은 다음과 같습니다.

- 이미지/영상 입력 처리
- YOLO 기반 사람 감지
- 프레임 샘플링
- 1분 단위 방문자 집계
- 디버그용 annotated image 생성
- Spring Boot 서버로 집계 JSON 전송
- 카메라 상태와 처리 성능 모니터링

## 구현된 기능

| 구분 | 기능 | 상태 |
| --- | --- | --- |
| 입력 | 이미지 업로드 분석 | 완료 |
| 입력 | 영상 파일 업로드 및 샘플링 분석 | 완료 |
| 입력 | 스트림/RTSP 입력 구조 | 완료 |
| AI | Ultralytics YOLO person detection | 완료 |
| AI | COCO `person` class만 추론 | 완료 |
| 결과 | `customerCount`, `confidenceAvg`, `processingMs` 계산 | 완료 |
| 디버그 | detection box 좌표와 confidence 반환 | 완료 |
| 디버그 | box가 그려진 `annotatedImage` 반환 | 완료 |
| 성능 | `ThreadPoolExecutor` 기반 병렬 추론 | 완료 |
| 성능 | worker별 `PersonDetector` 분리 | 완료 |
| 성능 | 영상 시간 기준 프레임 샘플링 | 완료 |
| 실시간 | 스트림 최신 프레임 유지 | 완료 |
| 집계 | 1분 단위 avg/max/min/last 집계 | 완료 |
| 모니터링 | `/api/v1/camera/status` | 완료 |
| 모니터링 | `/api/v1/camera/metrics` | 완료 |
| 연동 | Spring Boot 집계 JSON 전송 | 완료 |
| 안정성 | sender queue, retry, failed payload log | 완료 |
| 실험 | `/experiment` 테스트 페이지 | 완료 |

## 처리 파이프라인

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

## 입력 소스 전략

`FileVideoSource`는 업로드된 영상 파일을 분석할 때 사용합니다.

- `CAP_PROP_POS_MSEC`를 사용해 `0초`, `intervalSec`, `intervalSec * 2` 위치로 점프합니다.
- 전체 프레임을 순차 분석하지 않고 필요한 시점의 프레임만 읽습니다.
- 발표/시연용 샘플 영상 분석에 적합합니다.

`StreamVideoSource`는 웹캠 또는 RTSP 스트림 분석에 사용합니다.

- 백그라운드 캡처 스레드가 최신 프레임 1개만 유지합니다.
- 추론 루프는 샘플링 시점에 최신 프레임을 복사해서 사용합니다.
- 오래된 프레임이 큐에 쌓이는 문제를 줄입니다.

## Spring Boot 전송 Payload

Spring Boot에는 개별 프레임 결과가 아니라 1분 단위 집계 데이터를 전송합니다.

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

## 주요 API

| Method | Endpoint | 설명 |
| --- | --- | --- |
| GET | `/api/v1/health` | 서버 상태 확인 |
| POST | `/api/v1/inference/image` | 이미지 1장 분석 |
| POST | `/api/v1/camera/start` | 영상/스트림 분석 시작 |
| POST | `/api/v1/camera/stop` | 분석 중지 |
| GET | `/api/v1/camera/status` | 최신 분석 결과 확인 |
| GET | `/api/v1/camera/metrics` | 처리량/큐/성능 지표 확인 |
| POST | `/api/v1/camera/upload-video` | 영상 업로드 |
| GET | `/experiment` | 브라우저 기반 실험 페이지 |

## Metrics 예시

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

## 권장 설정

```env
YOLO_MODEL=yolo11s.pt
INFERENCE_WORKERS=2
MAX_PENDING_FRAMES=20
SENDER_QUEUE_MAX_SIZE=100
SPRING_SEND_RETRY=3
SPRING_SEND_TIMEOUT_SEC=3
FAILED_PAYLOAD_LOG=logs/failed_payloads.log
```

영상 테스트 요청 예시:

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

## 발표 포인트

초기 구조는 영상을 순차적으로 읽고 YOLO 추론 후 바로 전송하는 방식이었습니다. 이 구조에서는 추론 시간이 길어지면 프레임 샘플링 간격이 흔들리고, Spring Boot 응답 지연이 AI 서버 전체 흐름에 영향을 줄 수 있었습니다.

현재 구조는 입력, 샘플링, 추론, 집계, 전송을 분리했습니다. 영상 파일은 필요한 시간 위치로 점프해서 샘플링하고, 실시간 스트림은 최신 프레임만 유지합니다. 추론은 worker 기반으로 병렬 처리하며, Spring Boot 전송은 sender queue가 비동기로 처리합니다.

이 구조 덕분에 30fps 원본 영상을 모든 프레임 단위로 처리하지 않아도 되고, 10초 단위 샘플링 기준으로 처리 대상 프레임을 약 99% 이상 줄일 수 있습니다. 최종적으로는 매장 방문 흐름, 피크 시간, 혼잡도, 근무 스케줄 추천에 사용할 수 있는 집계 데이터를 생성합니다.

## 다음 실험

1. `imageSize` 960, 800, 640 비교
2. `yolo11s`와 `yolo11n` 비교
3. `INFERENCE_WORKERS` 1, 2, 3 비교
4. OpenVINO export 성능 비교
5. `annotatedImage` 생성 빈도 조절 실험
