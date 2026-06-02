# Today Tasks - ShiftOps AI

Date: 2026-05-22

## Goal

FastAPI 기반 YOLO 인원 감지 서버를 발표와 시연이 가능한 상태로 정리한다. 오늘은 이미지 1장 추론, 영상 샘플링 추론, 실험 페이지, 테스트 자산, Spring 연동 준비 상태를 다시 확인하고 문서화한다.

상세 아키텍처와 구현 요약은 `docs/ai_server_summary.md`, 성능 실험 기록은 `docs/performance_report.md`에 정리한다.

## Done

- FastAPI 서버 기본 구조 구성
  - 진입점: `main.py`, `app/main.py`
  - API prefix: `/api/v1`
  - Swagger: `http://127.0.0.1:8000/docs`
  - 실험 페이지: `http://127.0.0.1:8000/experiment`
- YOLO person 탐지 파이프라인 구성
  - 기본 모델: `yolo11s.pt`
  - 추가 비교 모델: `yolov8n.pt`
  - 탐지 대상은 COCO class `person`
  - 결과에 `customerCount`, `confidenceAvg`, `processingMs`, `boxes`, `annotatedImage` 포함
- 이미지 1장 테스트 기능 추가
  - Endpoint: `POST /api/v1/inference/image`
  - 업로드 이미지에 탐지 박스 표시
  - person box 개수, confidence, 좌표 확인 가능
  - 옵션: model, image size, confidence threshold
- 영상 테스트 기능 추가
  - Endpoint: `POST /api/v1/camera/start`
  - 상태 확인: `GET /api/v1/camera/status`
  - 중지: `POST /api/v1/camera/stop`
  - 영상 업로드: `POST /api/v1/camera/upload-video`
  - `VIDEO_FILE`은 `0초, intervalSec초, intervalSec*2초...` 위치의 프레임을 샘플링
  - 프레임 샘플링과 YOLO 추론을 분리하고, 추론은 `INFERENCE_WORKERS` 설정값에 따라 병렬 처리
  - 영상이 끝나면 자동으로 종료
- 영상 추론 병렬 처리 개선
  - 기존 직렬 구조는 `프레임 읽기 -> YOLO 추론 -> 결과 저장/전송 -> 다음 프레임` 순서라서 추론 시간이 길면 샘플링 간격이 밀릴 수 있었음
  - 개선 후에는 프레임을 먼저 샘플링해서 추론 대기열에 넣고, `ThreadPoolExecutor` 워커가 병렬로 YOLO 추론 수행
  - 워커마다 별도 `PersonDetector`를 사용해서 YOLO 모델 인스턴스 공유 위험을 줄임
  - 루프 시작 시 모델을 미리 로드해서 최초 weight 다운로드/로드가 여러 워커에서 동시에 발생하지 않도록 처리
  - 관련 설정: `INFERENCE_WORKERS=2`, `MAX_PENDING_FRAMES=20`
- 1분 단위 집계 및 서버 모니터링 추가
  - 개별 추론 결과는 `/camera/status`에서 마지막 프레임 디버깅용으로 확인
  - Spring Boot 전송은 `aggregationIntervalSec=60` 기준으로 평균/최대/최소/마지막 인원 수를 집계해서 전송
  - `/api/v1/camera/metrics`에서 `workers`, `queueSize`, `processedFrames`, `droppedFrames`, `avgProcessingMs` 확인
  - Python 서버 역할을 단순 count 모듈이 아니라 AI 추론 서버 + 실험/검증/집계 엔진으로 설명 가능
- 입력 소스 전략 분리 및 Spring 전송 큐 추가
  - `FileVideoSource`: 영상 파일은 `CAP_PROP_POS_MSEC` 기반으로 interval 위치로 점프해서 샘플링
  - `StreamVideoSource`: 웹캠/RTSP는 최신 프레임 1개만 유지하고 오래된 프레임 큐 적재 방지
  - Spring Boot POST는 추론 루프와 분리하고, sender thread가 전송 큐에서 비동기 처리
  - 전송 실패 시 재시도 후 `logs/failed_payloads.log`에 JSON Lines 형식으로 보관
- `/experiment` 실험 페이지 정리
  - Start / Status / Stop 버튼
  - 이미지 업로드 후 즉시 추론
  - 영상 업로드 후 추론 시작
  - Built-in Sample 선택 기능
  - 마지막 샘플 프레임의 annotated image와 box 목록 표시
- 테스트 자산 구성
  - 이미지 30장
    - `test_assets/images/low` 10장
    - `test_assets/images/medium` 10장
    - `test_assets/images/busy` 10장
  - 영상 5개
    - `test_assets/videos/cafe_low.mp4`
    - `test_assets/videos/cafe_medium.mp4`
    - `test_assets/videos/cafe_busy.mp4`
    - `test_assets/videos/cafe_counter_queue.mp4`
    - `test_assets/videos/cafe_seat_area.mp4`
  - 출처 및 설명: `test_assets/metadata/assets.csv`
- Spring Boot CORS 설정 갱신
  - 파일: `backend/src/main/java/com/dm/backend/WebConfig.java`
  - 허용 origin: `localhost:5173`, `127.0.0.1:5173`, `localhost:3000`, `127.0.0.1:3000`

## Current Test Settings

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

## Today To Do

1. 이미지 30장 추론 결과 정리
   - `low`, `medium`, `busy` 각 10장씩 실행
   - 각 단계별 대표 캡처 2~3장 저장
   - box 누락 사례와 confidence가 낮은 사례 메모

2. 영상 5개 추론 결과 정리
   - Built-in Sample로 5개 영상 순서대로 실행
   - `intervalSec=1`, `imageSize=960`, `confidence=0.3` 기준 사용
   - 10초 영상이면 약 1초 간격으로 샘플링되는지 확인
   - 로그에서 `sample queued`가 샘플 개수만큼 찍히는지 확인
   - 추론 시간이 길어도 프레임 샘플링이 크게 밀리지 않는지 확인
   - `lastCustomerCount`, `lastConfidenceAvg`, `lastMeasuredAt` 확인
   - 마지막 annotated frame 캡처 저장

3. 발표용 결과 표 작성

```text
구분      이미지 수   평균 탐지 인원   관찰 내용
한산      10장        -                사람 적은 화면에서 안정적으로 탐지되는지 확인
보통      10장        -                일부 가림/측면 인물 탐지 여부 확인
혼잡      10장        -                겹침과 원거리 인물 누락 여부 확인
```

```text
영상 파일                  상황             최종 count   confidence avg   관찰 내용
cafe_low.mp4              한산             -            -                -
cafe_medium.mp4           보통             -            -                -
cafe_busy.mp4             혼잡             -            -                -
cafe_counter_queue.mp4    카운터 대기열     -            -                -
cafe_seat_area.mp4        좌석 구역         -            -                -
```

4. 발표 문장 확정
   - 이미지 테스트 설명
   - 영상 샘플링 방식 설명
   - 한계점: 조명, 가림, 거리, 사람 겹침에 따른 누락 가능성
   - Spring Boot 연동은 `SEND_TO_SPRING=false` 상태에서 AI 서버 단독 검증 후 연결한다고 설명

## Video Test Steps

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

## Presentation Sentence Draft

```text
카페 내부 혼잡도를 한산, 보통, 혼잡 3단계로 나누어 총 30장의 이미지로 YOLO 기반 사람 탐지 성능을 검증했습니다. 탐지 결과는 단순 인원 수뿐 아니라 박스 위치와 confidence를 함께 확인하여, 조명이나 가림 현상으로 일부 인물이 누락되는 한계까지 분석했습니다.

영상 테스트는 전체 프레임을 모두 분석하지 않고 설정한 intervalSec 간격으로 프레임을 샘플링하는 방식으로 진행했습니다. 파일 영상은 시간 위치로 점프해서 필요한 프레임만 읽고, 실시간 스트림은 최신 프레임만 유지하도록 분리했습니다.

프레임 수집, YOLO 추론, 1분 집계, Spring Boot 전송을 각각 분리하고 추론은 병렬 워커로 처리하여, 추론 시간이 길거나 Spring 응답이 지연되어도 AI 서버의 샘플링과 추론 흐름이 크게 밀리지 않도록 개선했습니다.
```

## Test Commands

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

## Notes

- `SEND_TO_SPRING=false` 상태에서는 Spring 전송 실패 여부와 관계없이 AI 서버 단독 테스트를 우선 진행한다.
- `low/medium/busy` 분류는 발표용 실험 카테고리이며, 실제 YOLO 탐지 수는 조명, 거리, 가림, 사람 겹침에 따라 달라질 수 있다.
- 탐지 누락 이미지는 실패가 아니라 모델 한계와 개선 방향을 설명하는 자료로 사용한다.
- `test_assets/uploads`는 실험 페이지에서 업로드한 영상이 저장되는 임시 테스트 경로다.
