# Performance Report - ShiftOps AI

## 목표

카페 CCTV 또는 영상 파일에서 모든 프레임을 분석하지 않고, 일정 간격으로 프레임을 샘플링해 비용 효율적인 방문자 수 데이터를 생성합니다.

성능 최적화의 핵심은 다음과 같습니다.

- 전체 프레임 분석 대신 interval 기반 샘플링
- YOLO 추론 병렬 처리
- 영상 입력과 추론 작업 분리
- Spring Boot 전송 비동기화
- 1분 단위 집계 데이터 생성

구현 구조는 [ai_server_summary.md](./ai_server_summary.md)를 참고합니다.

## 현재 기준 성능

```text
Video Length: 36 minutes
Processed Frames: 443
Total Processing Time: 2m 22s
Approx Speed: 15x realtime
Model: yolo11s
Image Size: 960
Workers: 2
```

## 실험 매트릭스

| Model | Engine | Image Size | Workers | Torch Threads | Video Length | Processed Frames | Total Time | Avg Processing Ms | Count Quality | Notes |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- | ---: | --- | --- |
| yolo11s | PyTorch | 960 | 2 | default | 36m | 443 | 2m 22s | - | Good | Baseline |
| yolo11s | PyTorch | 800 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11s | PyTorch | 640 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11n | PyTorch | 640 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11s | OpenVINO | 640 | 1 | - | 36m | - | - | - | - | TODO |

## 관찰 내용

- 30fps 원본 영상의 모든 프레임을 분석하지 않고 10초 단위로 샘플링하면 처리 대상 프레임을 약 99.7% 줄일 수 있습니다.
- 영상 파일은 `FileVideoSource`에서 시간 위치 기준으로 점프해 필요한 프레임만 읽습니다.
- 실시간 스트림은 `StreamVideoSource`에서 최신 프레임만 유지해 오래된 프레임 분석을 방지합니다.
- Spring Boot 전송은 sender queue로 분리되어 추론 루프가 HTTP 응답 지연에 묶이지 않습니다.
- 사람 수 정확도는 조명, 가림, 거리, 군중 밀집도에 영향을 받습니다.

## 테스트 절차

1. 동일한 36분 영상과 동일한 `intervalSec`를 사용합니다.
2. 한 번에 하나의 설정만 변경합니다.
   - 예: `imageSize` 960 -> 800 -> 640
3. `/api/v1/camera/metrics`에서 다음 지표를 기록합니다.
   - `processedFrames`
   - `avgProcessingMs`
   - `droppedFrames`
   - `lastCustomerCount`
   - `lastConfidenceAvg`
4. annotated image와 count 결과를 눈으로 확인합니다.
5. 성능은 빨라졌지만 count 품질이 크게 떨어지면 기본 후보에서 제외합니다.

## 후보 설정

고속 설정:

```text
modelName: yolo11n
imageSize: 640
confidence: 0.35
workers: 1 or 2
```

균형 설정:

```text
modelName: yolo11s
imageSize: 800
confidence: 0.3
workers: 2
```

정확도 우선:

```text
modelName: yolo11s
imageSize: 960
confidence: 0.3
workers: 2
```

## 다음 기록 항목

| 실험 | 기록할 값 |
| --- | --- |
| 모델 변경 | 처리 시간, 평균 confidence, 사람 수 누락 여부 |
| 이미지 크기 변경 | 처리 시간, 작은 사람 감지 여부 |
| worker 수 변경 | 큐 적체, dropped frame, CPU 사용률 |
| OpenVINO 적용 | 모델 로딩 시간, 추론 시간, 배포 난이도 |
