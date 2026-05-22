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

## 환경 변수

`.env` 파일로 설정할 수 있습니다.

```env
MODEL_PATH=models/yolo11s.pt
MODEL_NAME=yolo11s
CONFIDENCE_THRESHOLD=0.35
SPRING_CONGESTION_URL=http://127.0.0.1:8080/api/ai/congestion
SPRING_API_KEY=shiftops-ai-secret
SEND_TO_SPRING=false
```

`SEND_TO_SPRING=false`이면 Spring Boot POST는 건너뛰고 추론 결과만 상태로 저장합니다.
