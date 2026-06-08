# Today Tasks - ShiftOps AI

Date: 2026-05-22

## 목표

FastAPI 기반 YOLO 인원 감지 서버를 발표와 시연이 가능한 상태로 정리합니다.

오늘 확인할 범위는 다음과 같습니다.

- 이미지 1장 분석
- 영상 샘플링 분석
- 실험 페이지 동작
- 테스트 자산 구성
- Spring Boot 연동 준비 상태
- 발표용 설명 문장 정리

상세 구조는 [ai_server_summary.md](./ai_server_summary.md), 성능 실험 기록은 [performance_report.md](./performance_report.md)를 참고합니다.

## 완료된 작업

### 서버 구조

- FastAPI 서버 기본 구조 구성
- 진입점: `main.py`, `app/main.py`
- API prefix: `/api/v1`
- Swagger: `http://127.0.0.1:8000/docs`
- 실험 페이지: `http://127.0.0.1:8000/experiment`

### YOLO 분석 파이프라인

- 기본 모델: `yolo11s.pt`
- 비교 모델 후보: `yolov8n.pt`, `yolov8s.pt`
- 감지 대상: COCO `person`
- 결과 필드:
  - `customerCount`
  - `confidenceAvg`
  - `processingMs`
  - `boxes`
  - `annotatedImage`

### 이미지 테스트

- Endpoint: `POST /api/v1/inference/image`
- 업로드 이미지에서 사람 box 표시
- person box 개수, confidence, 좌표 확인 가능
- 옵션: model, image size, confidence threshold

### 영상 테스트

- 분석 시작: `POST /api/v1/camera/start`
- 상태 확인: `GET /api/v1/camera/status`
- 중지: `POST /api/v1/camera/stop`
- 영상 업로드: `POST /api/v1/camera/upload-video`
- `VIDEO_FILE` 입력은 `0초`, `intervalSec`, `intervalSec * 2` 위치에서 프레임 샘플링
- 추론은 `INFERENCE_WORKERS` 설정에 따라 병렬 처리
- 영상이 끝나면 자동 종료

### 성능 개선

- 기존 구조:
  - `프레임 읽기 -> YOLO 추론 -> 결과 저장/전송 -> 다음 프레임`
  - 추론 시간이 길어지면 샘플링 간격이 흔들릴 수 있음
- 개선 구조:
  - 프레임 샘플링과 YOLO 추론 분리
  - `ThreadPoolExecutor` 기반 병렬 추론
  - worker별 `PersonDetector` 사용
  - 루프 시작 시 모델을 미리 로드해 worker 동시 로딩 문제 완화
- 관련 설정:
  - `INFERENCE_WORKERS=2`
  - `MAX_PENDING_FRAMES=20`

### 집계 및 모니터링

- 개별 프레임 결과는 `/camera/status`에서 최신 디버그 결과로 확인
- Spring Boot 전송은 `aggregationIntervalSec=60` 기준으로 평균/최대/최소/마지막 인원 수를 집계
- `/api/v1/camera/metrics`에서 다음 상태 확인 가능:
  - `workers`
  - `queueSize`
  - `processedFrames`
  - `droppedFrames`
  - `avgProcessingMs`
- Spring Boot POST는 추론 루프와 분리
- 전송 실패 payload는 `logs/failed_payloads.log`에 JSON Lines 형식으로 보관

### 실험 페이지

- Start / Status / Stop 버튼
- 이미지 업로드 즉시 분석
- 영상 업로드 후 분석 시작
- built-in sample 선택
- 마지막 샘플 프레임의 annotated image와 box 목록 표시

### 테스트 자산

이미지 30장:

```text
test_assets/images/low      10장
test_assets/images/medium   10장
test_assets/images/busy     10장
```

영상 5개:

```text
test_assets/videos/cafe_low.mp4
test_assets/videos/cafe_medium.mp4
test_assets/videos/cafe_busy.mp4
test_assets/videos/cafe_counter_queue.mp4
test_assets/videos/cafe_seat_area.mp4
```

메타데이터:

```text
test_assets/metadata/assets.csv
```

### Spring Boot CORS

- 파일: `backend/src/main/java/com/dm/backend/WebConfig.java`
- 허용 origin:
  - `localhost:5173`
  - `127.0.0.1:5173`
  - `localhost:3000`
  - `127.0.0.1:3000`

## 현재 테스트 설정

이미지 테스트 기본값:

```text
Store ID: 1
Camera ID: CAM-001
Model: yolo11s
Image Size: 960
Confidence: 0.3
```

영상 테스트 기본값:

```text
Store ID: 1
Camera ID: CAM-VIDEO-001
Source Type: VIDEO_FILE
Interval Sec: 1
Video Model: yolo11s
Video Image Size: 960
Video Confidence: 0.3
Inference Workers: 2
Max Pending Frames: 20
Aggregation Interval Sec: 60
Sender Queue Max Size: 100
Spring Send Retry: 3
```

비교 테스트 옵션:

```text
Model: yolo11s, yolov8n, yolov8s
Image Size: 640, 960, 1280
Confidence: 0.25, 0.3, 0.5
```

## 남은 할 일

1. 이미지 30장 분석 결과 정리
   - `low`, `medium`, `busy` 각 10장 실행
   - 각 단계별 대표 캡처 2-3장 저장
   - box 누락 여부와 confidence 메모

2. 영상 5개 분석 결과 정리
   - built-in sample로 5개 영상 순서대로 실행
   - `intervalSec=1`, `imageSize=960`, `confidence=0.3` 기준 사용
   - 로그에서 샘플 개수 확인
   - `lastCustomerCount`, `lastConfidenceAvg`, `lastMeasuredAt` 확인
   - 마지막 annotated frame 캡처 저장

3. 발표용 결과 표 작성

```text
구분      이미지 수   평균 감지 인원   관찰 내용
한산      10장        -                사람이 적은 화면에서 안정적으로 감지되는지 확인
보통      10장        -                일부 가림/측면 인물 감지 여부 확인
혼잡      10장        -                겹침과 원거리 인물 누락 여부 확인
```

```text
영상 파일                   상황             최종 count   confidence avg   관찰 내용
cafe_low.mp4               한산             -            -                -
cafe_medium.mp4            보통             -            -                -
cafe_busy.mp4              혼잡             -            -                -
cafe_counter_queue.mp4     카운터 대기열     -            -                -
cafe_seat_area.mp4         좌석 구역         -            -                -
```

4. 발표 문장 확정
   - 이미지 테스트 설명
   - 영상 샘플링 방식 설명
   - 한계점: 조명, 가림, 거리, 사람 겹침에 따른 누락 가능성
   - Spring Boot 연동은 `SEND_TO_SPRING=false` 상태에서는 AI 서버 단독 검증을 먼저 진행했다고 설명

## 영상 테스트 절차

1. FastAPI 서버 실행

```powershell
cd C:\Users\soldesk\Desktop\Team-CAL-\opencv
venv\Scripts\activate
uvicorn main:app --reload
```

2. 실험 페이지 접속

```text
http://127.0.0.1:8000/experiment
```

3. 영상 입력값 설정

```text
Store ID: 1
Camera ID: CAM-VIDEO-001
Source Type: VIDEO_FILE
Interval Sec: 1
Video Model: yolo11s
Video Image Size: 960
Video Confidence: 0.3
```

4. Built-in Sample에서 영상 선택
5. `Start Video` 클릭
6. 자동 갱신 또는 `Status` 버튼으로 결과 확인
7. annotated image, person box 개수, confidence, box 좌표 확인
8. 충분히 확인하면 `Stop` 클릭
9. 5개 영상 반복

## 발표 문장 초안

```text
카페 내부 혼잡도를 한산, 보통, 혼잡 3단계로 나누고 총 30장의 이미지로 YOLO 기반 사람 감지 성능을 검증했습니다. 결과는 단순 인원 수만 보지 않고 box 위치와 confidence를 함께 확인해 조명, 거리, 가림 상황에서 어떤 한계가 있는지도 분석했습니다.

영상 테스트는 전체 프레임을 모두 분석하지 않고 설정한 intervalSec 간격으로 프레임을 샘플링하는 방식으로 진행했습니다. 파일 영상은 시간 위치로 점프해 필요한 프레임만 읽고, 실시간 스트림은 최신 프레임만 유지하도록 분리했습니다.

프레임 수집, YOLO 추론, 1분 집계, Spring Boot 전송을 각각 분리하고 추론은 병렬 worker로 처리했습니다. 이 구조 덕분에 추론 시간이 길어지거나 Spring 응답이 지연되어도 AI 서버의 샘플링과 분석 흐름이 쉽게 막히지 않도록 개선했습니다.
```

## 테스트 명령

Server:

```powershell
cd C:\Users\soldesk\Desktop\Team-CAL-\opencv
venv\Scripts\activate
uvicorn main:app --reload
```

Experiment page:

```text
http://127.0.0.1:8000/experiment
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/api/v1/health
```

## 메모

- `SEND_TO_SPRING=false` 상태에서는 Spring 전송 실패 여부와 무관하게 AI 서버 단독 테스트를 우선 진행합니다.
- `low/medium/busy` 분류는 발표용 실험 카테고리이며, 실제 YOLO 감지 수는 조명, 거리, 가림, 사람 겹침에 따라 달라질 수 있습니다.
- 감지 누락 이미지는 실패가 아니라 모델 한계와 개선 방향을 설명하는 자료로 사용합니다.
- `test_assets/uploads`는 실험 페이지에서 업로드한 영상이 저장되는 임시 테스트 경로입니다.
