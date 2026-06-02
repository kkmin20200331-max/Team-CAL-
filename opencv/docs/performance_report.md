# Performance Report - ShiftOps AI

## Goal

장시간 카페 영상에서 전체 프레임을 모두 분석하지 않고, interval 기반 샘플링과 YOLO 추론 최적화로 비용 효율적인 인원 추이 데이터를 생성한다.

구현 구조 요약은 `docs/ai_server_summary.md`를 참고한다.

## Baseline

```text
Video Length: 36 minutes
Processed Frames: 443
Total Processing Time: 2m 22s
Approx Speed: 15x realtime
Model: yolo11s
Image Size: 960
Workers: 2
```

## Experiment Matrix

| Model | Engine | Image Size | Workers | Torch Threads | Video Length | Processed Frames | Total Time | Avg Processing Ms | Count Quality | Notes |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- | ---: | --- | --- |
| yolo11s | PyTorch | 960 | 2 | default | 36m | 443 | 2m 22s | - | Good | Baseline |
| yolo11s | PyTorch | 800 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11s | PyTorch | 640 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11n | PyTorch | 640 | 2 | - | 36m | - | - | - | - | TODO |
| yolo11s | OpenVINO | 640 | 1 | - | 36m | - | - | - | - | TODO |

## Notes

- 30fps 원본 영상을 모든 프레임 단위로 처리하지 않고 10초 단위 샘플링을 적용하면 처리 대상 프레임 수를 약 99.7% 줄일 수 있다.
- 영상 파일은 `FileVideoSource`에서 interval 기준 시간 위치로 점프해 읽는다.
- 실시간 스트림은 `StreamVideoSource`에서 최신 프레임만 유지해 오래된 프레임 분석을 방지한다.
- Spring Boot 전송은 sender queue로 분리해 추론 루프가 HTTP 응답 지연에 막히지 않도록 한다.

## Test Procedure

1. 동일한 36분 영상과 동일한 `intervalSec`를 사용한다.
2. 설정을 하나씩만 바꾼다. 예: imageSize만 960 -> 800 -> 640.
3. `/api/v1/camera/metrics`에서 `processedFrames`, `avgProcessingMs`, `droppedFrames`를 기록한다.
4. 마지막 annotated image와 count 품질을 육안으로 확인한다.
5. 성능이 빨라도 count 품질이 크게 떨어지면 기본 설정 후보에서 제외한다.

## Candidate Settings

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
