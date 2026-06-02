# ShiftOps AI Server

OpenCV/FastAPI 기반 AI 추론 서버입니다. 영상 또는 이미지에서 YOLO person 객체를 감지하고 `customerCount`를 계산한 뒤 Spring Boot 서버로 전송할 수 있습니다.

## 실행

```powershell
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Swagger 문서: <http://127.0.0.1:8000/docs>

실험 페이지: <http://127.0.0.1:8000/experiment>

## 주요 API

- `GET /health`: 서버 상태와 모델 로드 여부 확인
- `POST /api/v1/camera/start`: 영상 추론 루프 시작
- `POST /api/v1/camera/stop`: 영상 추론 루프 중지
- `GET /api/v1/camera/status`: 마지막 추론 결과 확인
- `GET /api/v1/camera/metrics`: AI 서버 처리량과 큐 상태 확인
- `POST /api/v1/inference/image`: 이미지 1장 추론 테스트

이미지 테스트 옵션:

- `modelName`: `yolo11s`, `yolov8n`, `yolov8s`
- `imageSize`: `640`, `960`, `1280`
- `confidence`: `0.25`, `0.3`, `0.5`

이미지 추론 응답에는 탐지 박스가 그려진 `annotatedImage`, 감지된 `boxes`, 각 box의 `confidence`가 포함됩니다.

## 테스트 소스

실험용 이미지와 영상은 `test_assets/`에 있습니다.

- 이미지: `test_assets/images/low`, `test_assets/images/medium`, `test_assets/images/busy` 각 10장
- 영상: `test_assets/videos` 5개
- 출처 목록: `test_assets/metadata/assets.csv`

## Start 요청 예시

```json
{
  "storeId": 1,
  "cameraId": "CAM-001",
  "source": "videos/test_store.mp4",
  "sourceType": "VIDEO_FILE",
  "intervalSec": 10
}
```

## 영상 처리 방식

영상 추론은 프레임 샘플링과 YOLO 추론을 분리해서 처리합니다.

- `VIDEO_FILE`은 `0초, intervalSec초, intervalSec*2초...` 위치의 프레임을 먼저 샘플링합니다.
- 웹캠/RTSP는 백그라운드 캡처 스레드가 최신 프레임 1개만 유지하고, 추론 루프가 그 시점의 최신 프레임을 복사해서 사용합니다.
- 샘플링된 프레임은 추론 대기열에 들어갑니다.
- YOLO 추론은 `INFERENCE_WORKERS` 개수만큼 병렬로 실행됩니다.
- 추론이 끝난 프레임부터 결과를 상태에 반영합니다.
- Spring Boot에는 개별 프레임이 아니라 `aggregationIntervalSec` 기준의 집계 JSON을 전송 큐에 넣습니다.
- 전송 전용 스레드가 Spring Boot POST를 처리하고, 실패 시 재시도 후 `FAILED_PAYLOAD_LOG`에 JSON Lines 형식으로 기록합니다.

예를 들어 10초 영상에 `intervalSec=1`을 사용하면 0초부터 10초 구간까지 약 1초 간격으로 프레임을 샘플링합니다. 추론 시간이 길어도 샘플링 자체가 추론 완료를 기다리며 밀리지 않도록 구성되어 있습니다.

Spring Boot 전송 JSON 예시:

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

AI 서버 metrics 예시:

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

## 환경 변수

`.env` 파일로 설정할 수 있습니다.

```env
YOLO_MODEL=yolo11s.pt
CONFIDENCE_THRESHOLD=0.35
SPRING_CONGESTION_URL=http://127.0.0.1:8080/api/ai/congestion
SPRING_API_KEY=shiftops-ai-secret
SEND_TO_SPRING=false
INFERENCE_WORKERS=2
MAX_PENDING_FRAMES=20
SENDER_QUEUE_MAX_SIZE=100
SPRING_SEND_RETRY=3
SPRING_SEND_TIMEOUT_SEC=3
FAILED_PAYLOAD_LOG=logs/failed_payloads.log
```

`SEND_TO_SPRING=false`이면 Spring Boot POST는 건너뛰고 추론 결과만 상태로 저장합니다.

`INFERENCE_WORKERS`는 동시에 추론할 프레임 수입니다. `MAX_PENDING_FRAMES`는 추론 대기열에 쌓아둘 최대 프레임 수입니다.

`SENDER_QUEUE_MAX_SIZE`는 Spring 전송 대기열 크기입니다. `SPRING_SEND_RETRY`는 전송 실패 재시도 횟수이고, 최종 실패 payload는 `FAILED_PAYLOAD_LOG`에 저장됩니다.

## YOLO Model

이 프로젝트는 Ultralytics YOLO 모델을 사용합니다.

기본 모델:

```txt
yolo11s.pt
```

실행 시 모델 파일이 로컬에 없으면 Ultralytics가 pretrained weight를 자동으로 다운로드합니다.

직접 받은 모델 파일을 쓰는 경우 아래 위치에 저장할 수 있습니다.

```txt
models/yolo11s.pt
```

모델 파일은 용량이 크기 때문에 GitHub에 올리지 않습니다. `.gitignore`에서 `*.pt`, `*.pth`, `*.onnx`를 제외하고 있습니다.

가볍게 테스트하려면 `.env`에서 다음처럼 바꿀 수 있습니다.

```env
YOLO_MODEL=yolov8n.pt
```
